from __future__ import annotations

import io
import json
import sqlite3
import uuid
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..agent import AgentContext, AxonAgentPipeline
from ..auth.jwt import create_access_token, decode_access_token
from ..config import Settings
from ..database import get_db
from ..models.conversation import Conversation
from ..models.document import Document
from ..models.message import Message, message_attachments
from ..models.user import User

settings = Settings()
router = APIRouter(prefix=settings.API_PREFIX)
uploads_root = Path(__file__).resolve().parents[1] / 'uploads'
uploads_root.mkdir(parents=True, exist_ok=True)
databases_root = Path(__file__).resolve().parents[1] / 'uploaded_databases'
databases_root.mkdir(parents=True, exist_ok=True)

# In-memory stores for lightweight UX features.
_password_reset_tokens: dict[str, str] = {}
_user_model_prefs: dict[int, str] = {}
_user_theme_prefs: dict[int, str] = {}
_user_db_connections: dict[int, dict[str, object]] = {}
_user_feedback: dict[int, dict[str, dict[str, object]]] = {}
agent_pipeline = AxonAgentPipeline()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SignUpPayload(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignInPayload(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequestPayload(BaseModel):
    email: EmailStr


class PasswordResetConfirmPayload(BaseModel):
    token: str
    password: str


class ChangePasswordPayload(BaseModel):
    currentPassword: str
    newPassword: str


class UpdateProfilePayload(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class ChatPayload(BaseModel):
    message: str
    conversation_id: str | None = None
    title: str | None = None
    document_ids: list[str] | None = None


class DatabaseConnectionPayload(BaseModel):
    mode: str
    displayName: str | None = None
    sqlitePath: str | None = None
    connectionString: str | None = None
    testConnection: bool | None = None


class SqlQueryPayload(BaseModel):
    query: str
    limit: int | None = 200


class SqlSuggestionPayload(BaseModel):
    query: str
    includeSchema: bool | None = True
    maxSuggestions: int | None = 3


class SetModelPayload(BaseModel):
    model: str


class FeedbackPayload(BaseModel):
    type: str
    reason: str | None = None


class ExportSqlPayload(BaseModel):
    query: str
    columns: list[str]
    rows: list[dict[str, object]]


class ExportConversationZipPayload(BaseModel):
    sqlResults: list[dict[str, object]] = []


def _iso(dt: datetime | None) -> str:
    if dt is None:
        return _utcnow().isoformat()
    return dt.isoformat()


def _serialize_user(user: User) -> dict[str, object]:
    return {
        'id': user.id,
        'email': user.email,
        'name': user.full_name or user.email.split('@')[0],
    }


def _serialize_attachment(document: Document) -> dict[str, object]:
    return {
        'id': str(document.id),
        'name': document.original_name,
        'url': f"{settings.API_PREFIX}/documents/{document.id}/download/",
        'size': document.size or 0,
        'uploadedAt': _iso(document.created_at),
    }


async def _serialize_conversation_detail(db: AsyncSession, conversation: Conversation) -> dict[str, object]:
    message_rows = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    messages = message_rows.scalars().all()

    data_messages: list[dict[str, object]] = []
    for item in messages:
        await db.refresh(item, attribute_names=['attachments'])
        data_messages.append(
            {
                'id': str(item.id),
                'sender': item.sender,
                'content': item.content,
                'timestamp': _iso(item.created_at),
                'attachments': [_serialize_attachment(doc) for doc in item.attachments],
            }
        )

    return {
        'id': str(conversation.id),
        'title': conversation.title or 'Untitled conversation',
        'summary': conversation.summary or (conversation.title or 'Conversation'),
        'updatedAt': _iso(conversation.updated_at),
        'updatedAtISO': _iso(conversation.updated_at),
        'messageCount': len(data_messages),
        'messages': data_messages,
    }


async def _current_user_optional(request: Request, db: AsyncSession) -> User | None:
    auth_header = request.headers.get('authorization', '')
    token = ''
    if auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    if not token:
        token = request.cookies.get('access_token', '')
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        email = payload.get('sub')
    except Exception:
        return None

    if not isinstance(email, str) or not email:
        return None

    return await User.get_by_email(db, email)


async def _require_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    user = await _current_user_optional(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication required')
    return user


def _connection_for_user(user_id: int) -> dict[str, object] | None:
    return _user_db_connections.get(user_id)


def _default_sqlite_path() -> Path:
    db_url = (settings.DATABASE_URL or '').strip()
    if db_url.startswith('sqlite+aiosqlite:///'):
        return Path(db_url.replace('sqlite+aiosqlite:///', '', 1)).expanduser().resolve()
    if db_url.startswith('sqlite:///'):
        return Path(db_url.replace('sqlite:///', '', 1)).expanduser().resolve()
    return Path('axon.db').resolve()


def _resolve_sqlite_path(connection: dict[str, object] | None) -> Path:
    if not connection:
        return _default_sqlite_path()

    mode = str(connection.get('mode') or 'sqlite')
    if mode == 'sqlite':
        sqlite_path = str(connection.get('sqlitePath') or _default_sqlite_path()).strip()
        return Path(sqlite_path).expanduser().resolve()

    connection_string = str(connection.get('connectionString') or '').strip()
    if connection_string.startswith('sqlite:///'):
        return Path(connection_string.replace('sqlite:///', '', 1)).expanduser().resolve()

    raise HTTPException(status_code=400, detail='Only SQLite connections are supported in this build')


@router.get('/health/')
async def api_health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text('SELECT 1'))
    except Exception:
        return {'status': 'degraded', 'database': 'error'}

    return {'status': 'healthy', 'database': 'ok'}


@router.post('/auth/register/')
async def register(payload: SignUpPayload, response: Response, db: AsyncSession = Depends(get_db)):
    existing = await User.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email already in use')

    user = User(email=payload.email, full_name=payload.name)
    user.set_password(payload.password)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(payload.email, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    response.set_cookie('access_token', token, httponly=True, samesite='lax')
    return {'user': _serialize_user(user)}


@router.post('/auth/login/')
async def login(payload: SignInPayload, response: Response, db: AsyncSession = Depends(get_db)):
    user = await User.get_by_email(db, payload.email)
    if user is None or not user.verify_password(payload.password):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    token = create_access_token(payload.email, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    response.set_cookie('access_token', token, httponly=True, samesite='lax')
    return {'user': _serialize_user(user)}


@router.post('/auth/logout/')
async def logout(response: Response):
    response.delete_cookie('access_token')
    return {'success': True}


@router.get('/auth/me/')
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    user = await _current_user_optional(request, db)
    return {'user': _serialize_user(user) if user else None}


@router.post('/auth/password/reset/')
async def password_reset_request(payload: PasswordResetRequestPayload):
    token = f"reset-{uuid.uuid4().hex[:10]}"
    _password_reset_tokens[token] = payload.email
    return {'message': 'Reset token generated', 'resetToken': token}


@router.post('/auth/password/reset/confirm/')
async def password_reset_confirm(
    payload: PasswordResetConfirmPayload,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    email = _password_reset_tokens.pop(payload.token, None)
    if not email:
        raise HTTPException(status_code=400, detail='Invalid or expired reset token')

    user = await User.get_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')

    user.set_password(payload.password)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.email, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    response.set_cookie('access_token', token, httponly=True, samesite='lax')
    return {'user': _serialize_user(user)}


@router.post('/auth/password/change/')
async def change_password(
    payload: ChangePasswordPayload,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.verify_password(payload.currentPassword):
        raise HTTPException(status_code=400, detail='Current password is incorrect')

    user.set_password(payload.newPassword)
    await db.commit()
    return {'success': True, 'message': 'Password updated successfully'}


@router.put('/auth/profile/')
async def update_profile(
    payload: UpdateProfilePayload,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.name is not None:
        user.full_name = payload.name

    if payload.email is not None and payload.email != user.email:
        existing = await User.get_by_email(db, payload.email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=400, detail='Email already in use')
        user.email = payload.email

    await db.commit()
    await db.refresh(user)
    return {'user': _serialize_user(user)}


@router.get('/models/')
async def get_models(user: User = Depends(_require_current_user)):
    current = _user_model_prefs.get(user.id, 'gemini')
    return {
        'models': [
            {'id': 'gemini', 'name': 'Gemini 2.0 Flash', 'provider': 'google', 'available': True, 'isDefault': True},
            {'id': 'gpt-4o', 'name': 'GPT-4o', 'provider': 'openai', 'available': True, 'isDefault': False},
        ],
        'current': current,
    }


@router.post('/models/set/')
async def set_model(payload: SetModelPayload, user: User = Depends(_require_current_user)):
    if payload.model not in {'gemini', 'gpt-4o'}:
        raise HTTPException(status_code=400, detail='Unsupported model')
    _user_model_prefs[user.id] = payload.model
    return {'success': True, 'current': payload.model, 'message': 'Model updated'}


@router.get('/preferences/')
async def get_preferences(user: User = Depends(_require_current_user)):
    return {
        'preferences': {
            'preferredModel': _user_model_prefs.get(user.id, 'gemini'),
            'theme': _user_theme_prefs.get(user.id, 'dark'),
            'updatedAt': _utcnow().isoformat(),
        }
    }


@router.put('/preferences/update/')
async def update_preferences(payload: dict[str, str], user: User = Depends(_require_current_user)):
    if 'preferredModel' in payload:
        _user_model_prefs[user.id] = payload['preferredModel']
    if 'theme' in payload:
        _user_theme_prefs[user.id] = payload['theme']

    return {
        'preferences': {
            'preferredModel': _user_model_prefs.get(user.id, 'gemini'),
            'theme': _user_theme_prefs.get(user.id, 'dark'),
            'updatedAt': _utcnow().isoformat(),
        }
    }


@router.put('/preferences/')
async def update_preferences_alias(payload: dict[str, str], user: User = Depends(_require_current_user)):
    return await update_preferences(payload, user)


@router.post('/messages/{message_id}/feedback/')
async def add_feedback(message_id: str, payload: FeedbackPayload, user: User = Depends(_require_current_user)):
    user_feedback = _user_feedback.setdefault(user.id, {})
    feedback_id = f"fb-{uuid.uuid4().hex[:8]}"
    user_feedback[message_id] = {
        'id': feedback_id,
        'type': payload.type,
        'messageId': message_id,
        'createdAt': _utcnow().isoformat(),
        'reason': payload.reason,
    }
    return {'success': True, 'feedback': user_feedback[message_id]}


@router.delete('/messages/{message_id}/feedback/delete/')
async def delete_feedback(message_id: str, user: User = Depends(_require_current_user)):
    user_feedback = _user_feedback.setdefault(user.id, {})
    user_feedback.pop(message_id, None)
    return {'success': True}


@router.delete('/messages/{message_id}/feedback/')
async def delete_feedback_alias(message_id: str, user: User = Depends(_require_current_user)):
    return await delete_feedback(message_id, user)


@router.get('/conversations/')
async def list_conversations(user: User = Depends(_require_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
    )
    conversations = rows.scalars().all()

    summaries = []
    for convo in conversations:
        msg_count = await db.scalar(select(func.count(Message.id)).where(Message.conversation_id == convo.id))
        summaries.append(
            {
                'id': str(convo.id),
                'title': convo.title or 'Untitled conversation',
                'summary': convo.summary or (convo.title or 'Conversation'),
                'updatedAt': _iso(convo.updated_at),
                'updatedAtISO': _iso(convo.updated_at),
                'messageCount': int(msg_count or 0),
            }
        )

    return {'conversations': summaries}


@router.get('/conversations/{conversation_id}/')
async def get_conversation(
    conversation_id: str,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        conversation_pk = int(conversation_id)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail='Invalid conversation id') from ex

    row = await db.execute(
        select(Conversation).where(Conversation.id == conversation_pk, Conversation.user_id == user.id)
    )
    conversation = row.scalars().first()
    if conversation is None:
        raise HTTPException(status_code=404, detail='Conversation not found')

    return await _serialize_conversation_detail(db, conversation)


@router.delete('/conversations/{conversation_id}/')
async def delete_conversation(
    conversation_id: str,
    delete_files: bool = Query(default=False, alias='delete_files'),
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        conversation_pk = int(conversation_id)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail='Invalid conversation id') from ex

    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_pk, Conversation.user_id == user.id)
    )
    conversation = result.scalars().first()
    if conversation is None:
        raise HTTPException(status_code=404, detail='Conversation not found')

    attached_docs: list[Document] = []
    if delete_files:
        attached_rows = await db.execute(
            select(Document)
            .join(message_attachments, message_attachments.c.document_id == Document.id)
            .join(Message, message_attachments.c.message_id == Message.id)
            .where(Message.conversation_id == conversation.id, Document.user_id == user.id)
            .distinct()
        )
        attached_docs = attached_rows.scalars().all()

    await db.delete(conversation)
    await db.flush()

    files_deleted = 0
    if delete_files and attached_docs:
        for document in attached_docs:
            remaining_refs = await db.scalar(
                select(func.count(message_attachments.c.message_id))
                .select_from(message_attachments.join(Message, message_attachments.c.message_id == Message.id))
                .where(
                    message_attachments.c.document_id == document.id,
                    Message.conversation_id != conversation.id,
                )
            )
            if int(remaining_refs or 0) > 0:
                continue

            file_path = Path(document.storage_path)
            if file_path.exists():
                file_path.unlink(missing_ok=True)

            await db.delete(document)
            files_deleted += 1

    await db.commit()
    return {'status': 'deleted', 'files_deleted': files_deleted}


@router.post('/chat/')
async def send_chat(
    payload: ChatPayload,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail='Message is required')

    conversation: Conversation | None = None
    if payload.conversation_id:
        try:
            conversation_pk = int(payload.conversation_id)
        except ValueError as ex:
            raise HTTPException(status_code=400, detail='Invalid conversation id') from ex

        row = await db.execute(
            select(Conversation).where(Conversation.id == conversation_pk, Conversation.user_id == user.id)
        )
        conversation = row.scalars().first()

    if conversation is None:
        conversation = Conversation(
            user_id=user.id,
            title=(payload.title or message[:80]).strip() or 'Untitled conversation',
            summary=message[:160],
        )
        db.add(conversation)
        await db.flush()

    user_message = Message(conversation_id=conversation.id, sender='user', content=message)
    db.add(user_message)
    await db.flush()

    attached_documents: list[Document] = []
    if payload.document_ids:
        valid_doc_ids = [int(item) for item in payload.document_ids if str(item).isdigit()]
        if valid_doc_ids:
            docs = await db.execute(
                select(Document).where(
                    Document.user_id == user.id,
                    Document.id.in_(valid_doc_ids),
                )
            )
            attached_documents = docs.scalars().all()
            if attached_documents:
                await db.execute(
                    message_attachments.insert(),
                    [{'message_id': user_message.id, 'document_id': doc.id} for doc in attached_documents],
                )

    history_rows = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    history = [(item.sender, item.content) for item in history_rows.scalars().all()]

    preferred_model = _user_model_prefs.get(user.id, 'gemini')
    sqlite_path: str | None = None
    connection = _connection_for_user(user.id)
    if connection:
        try:
            sqlite_path = str(_resolve_sqlite_path(connection))
        except HTTPException:
            sqlite_path = None

    agent_result = await agent_pipeline.generate_response(
        AgentContext(
            user_id=user.id,
            message=message,
            conversation_title=conversation.title or '',
            conversation_history=history,
            preferred_model=preferred_model,
            document_paths=[doc.storage_path for doc in attached_documents],
            sqlite_path=sqlite_path,
        )
    )
    assistant_reply = agent_result.content.strip()
    if not assistant_reply:
        assistant_reply = 'I could not generate a response right now. Please try again.'

    assistant_message = Message(conversation_id=conversation.id, sender='assistant', content=assistant_reply)
    db.add(assistant_message)

    conversation.summary = assistant_reply[:160]
    conversation.updated_at = _utcnow()

    await db.commit()
    await db.refresh(conversation)

    return await _serialize_conversation_detail(db, conversation)


@router.get('/documents/')
async def list_documents(user: User = Depends(_require_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc(), Document.id.desc())
    )
    return {'documents': [_serialize_attachment(doc) for doc in rows.scalars().all()]}


@router.post('/documents/')
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_dir = uploads_root / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    target_name = f"{uuid.uuid4().hex}_{file.filename or 'upload.bin'}"
    storage_path = user_dir / target_name
    content = await file.read()
    storage_path.write_bytes(content)

    document = Document(
        user_id=user.id,
        original_name=file.filename or target_name,
        storage_path=str(storage_path),
        size=len(content),
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return _serialize_attachment(document)


@router.get('/documents/{document_id}/download/')
async def download_document(document_id: str, user: User = Depends(_require_current_user), db: AsyncSession = Depends(get_db)):
    if not document_id.isdigit():
        raise HTTPException(status_code=400, detail='Invalid document id')

    row = await db.execute(
        select(Document).where(Document.id == int(document_id), Document.user_id == user.id)
    )
    document = row.scalars().first()
    if document is None:
        raise HTTPException(status_code=404, detail='Document not found')

    path = Path(document.storage_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail='Stored file not found')

    return FileResponse(path, filename=document.original_name)


@router.delete('/documents/{document_id}/')
async def delete_document(document_id: str, user: User = Depends(_require_current_user), db: AsyncSession = Depends(get_db)):
    if not document_id.isdigit():
        raise HTTPException(status_code=400, detail='Invalid document id')

    row = await db.execute(
        select(Document).where(Document.id == int(document_id), Document.user_id == user.id)
    )
    document = row.scalars().first()
    if document is None:
        raise HTTPException(status_code=404, detail='Document not found')

    path = Path(document.storage_path)
    if path.exists():
        path.unlink(missing_ok=True)

    await db.delete(document)
    await db.commit()
    return {'success': True}


@router.get('/conversations/{conversation_id}/documents/')
async def get_conversation_documents(
    conversation_id: str,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not conversation_id.isdigit():
        raise HTTPException(status_code=400, detail='Invalid conversation id')

    convo = await db.scalar(
        select(Conversation).where(Conversation.id == int(conversation_id), Conversation.user_id == user.id)
    )
    if convo is None:
        raise HTTPException(status_code=404, detail='Conversation not found')

    message_rows = await db.execute(
        select(Message).where(Message.conversation_id == convo.id).order_by(Message.created_at.asc())
    )

    docs: list[dict[str, object]] = []
    for msg in message_rows.scalars().all():
        await db.refresh(msg, attribute_names=['attachments'])
        for doc in msg.attachments:
            docs.append(
                {
                    'id': doc.id,
                    'original_name': doc.original_name,
                    'size': doc.size or 0,
                    'created_at': _iso(doc.created_at),
                    'message_id': msg.id,
                    'message_role': msg.sender,
                    'message_preview': msg.content[:80],
                }
            )

    return {
        'conversation_id': convo.id,
        'documents': docs,
        'count': len(docs),
    }


@router.delete('/conversations/{conversation_id}/documents/{document_id}/')
async def delete_conversation_document(
    conversation_id: str,
    document_id: int,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not conversation_id.isdigit():
        raise HTTPException(status_code=400, detail='Invalid conversation id')

    convo = await db.scalar(
        select(Conversation).where(Conversation.id == int(conversation_id), Conversation.user_id == user.id)
    )
    if convo is None:
        raise HTTPException(status_code=404, detail='Conversation not found')

    messages = await db.execute(select(Message).where(Message.conversation_id == convo.id))
    detached = False
    for msg in messages.scalars().all():
        await db.refresh(msg, attribute_names=['attachments'])
        before = len(msg.attachments)
        msg.attachments = [doc for doc in msg.attachments if doc.id != document_id]
        detached = detached or (len(msg.attachments) != before)

    await db.commit()
    return {
        'status': 'ok',
        'file_deleted': False,
        'message': 'Document detached from conversation' if detached else 'No matching attachment found',
    }


@router.get('/conversations/{conversation_id}/export/')
async def export_conversation_docx(
    conversation_id: str,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    detail = await get_conversation(conversation_id, user, db)
    messages = detail.get('messages', [])
    if not isinstance(messages, list):
        messages = []

    buffer = io.BytesIO()
    transcript = [
        f"{msg.get('sender', 'assistant')}: {msg.get('content', '')}"
        for msg in messages
        if isinstance(msg, dict)
    ]
    buffer.write(('\n\n'.join(transcript)).encode('utf-8'))
    buffer.seek(0)

    filename = f"conversation_{conversation_id}.docx"
    headers = {'Content-Disposition': f'attachment; filename={filename}'}
    return StreamingResponse(buffer, media_type='application/octet-stream', headers=headers)


@router.post('/conversations/{conversation_id}/export/zip/')
async def export_conversation_zip(
    conversation_id: str,
    payload: ExportConversationZipPayload,
    user: User = Depends(_require_current_user),
    db: AsyncSession = Depends(get_db),
):
    detail = await get_conversation(conversation_id, user, db)
    messages = detail.get('messages', [])
    if not isinstance(messages, list):
        messages = []

    memory = io.BytesIO()
    with zipfile.ZipFile(memory, mode='w', compression=zipfile.ZIP_DEFLATED) as archive:
        transcript = [
            f"{msg.get('sender', 'assistant')}: {msg.get('content', '')}"
            for msg in messages
            if isinstance(msg, dict)
        ]
        archive.writestr('conversation.txt', '\n\n'.join(transcript))

        for index, result in enumerate(payload.sqlResults):
            archive.writestr(f'sql_result_{index + 1}.json', json.dumps(result, indent=2, default=str))

    memory.seek(0)
    headers = {'Content-Disposition': f'attachment; filename=conversation_{conversation_id}.zip'}
    return StreamingResponse(memory, media_type='application/zip', headers=headers)


@router.get('/database/connection/')
async def get_database_connection(user: User = Depends(_require_current_user)):
    connection = _connection_for_user(user.id)
    return {
        'connection': connection,
        'availableModes': ['sqlite', 'url'],
        'environmentFallback': None,
        'tested': True,
    }


@router.post('/database/connection/')
async def set_database_connection(payload: DatabaseConnectionPayload, user: User = Depends(_require_current_user)):
    mode = payload.mode.strip().lower()
    if mode not in {'sqlite', 'url'}:
        raise HTTPException(status_code=400, detail='Connection mode must be either sqlite or url')

    if mode == 'url' and not (payload.connectionString or '').strip():
        raise HTTPException(status_code=400, detail='connectionString is required when mode=url')

    sqlite_path = str(payload.sqlitePath or _default_sqlite_path()).strip()
    display_name = payload.displayName or ('SQLite Database' if mode == 'sqlite' else 'Custom URL')
    connection = {
        'mode': mode,
        'displayName': display_name,
        'label': display_name,
        'sqlitePath': sqlite_path if mode == 'sqlite' else None,
        'resolvedSqlitePath': str(Path(sqlite_path).expanduser().resolve()) if mode == 'sqlite' else None,
        'connectionString': payload.connectionString if mode == 'url' else None,
        'isDefault': False,
        'source': 'user',
    }
    _user_db_connections[user.id] = connection

    return {
        'connection': connection,
        'availableModes': ['sqlite', 'url'],
        'environmentFallback': None,
        'tested': True,
    }


@router.delete('/database/connection/')
async def clear_database_connection(user: User = Depends(_require_current_user)):
    _user_db_connections.pop(user.id, None)
    return {
        'connection': None,
        'availableModes': ['sqlite', 'url'],
        'environmentFallback': None,
        'tested': True,
    }


@router.post('/database/connection/test/')
async def test_database_connection(payload: DatabaseConnectionPayload, user: User = Depends(_require_current_user)):
    try:
        mode = payload.mode.strip().lower()
        if mode not in {'sqlite', 'url'}:
            return {'ok': False, 'message': 'Connection mode must be either sqlite or url', 'resolvedSqlitePath': None}

        connection = {
            'mode': mode,
            'sqlitePath': payload.sqlitePath,
            'connectionString': payload.connectionString,
        }
        sqlite_path = _resolve_sqlite_path(connection)
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(sqlite_path))
        conn.execute('SELECT 1')
        conn.close()
    except Exception as ex:
        return {'ok': False, 'message': str(ex), 'resolvedSqlitePath': None}

    return {'ok': True, 'message': 'Connection successful', 'resolvedSqlitePath': str(sqlite_path)}


@router.post('/database/upload/')
async def upload_database_file(
    database: UploadFile = File(...),
    user: User = Depends(_require_current_user),
):
    original_name = Path(database.filename or 'database.db').name
    extension = Path(original_name).suffix.lower()
    if extension not in {'.db', '.sqlite', '.sqlite3'}:
        raise HTTPException(status_code=400, detail='Only SQLite files are supported (.db, .sqlite, .sqlite3)')

    user_dir = databases_root / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}_{original_name}"
    target_path = user_dir / safe_name
    content = await database.read()

    target_path.write_bytes(content)

    try:
        conn = sqlite3.connect(str(target_path))
        conn.execute('PRAGMA schema_version')
        conn.close()
    except Exception as ex:
        target_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail='Uploaded file is not a valid SQLite database') from ex

    return {
        'path': str(target_path.resolve()),
        'filename': original_name,
        'size': len(content),
    }


@router.post('/database/query/')
async def run_query(payload: SqlQueryPayload, user: User = Depends(_require_current_user)):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail='Query is required')

    sqlite_path = _resolve_sqlite_path(_connection_for_user(user.id))
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)

    started = _utcnow()
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        lowered = query.lower().lstrip()
        elapsed_ms = int((_utcnow() - started).total_seconds() * 1000)

        if lowered.startswith('select') or lowered.startswith('pragma'):
            rows = cursor.fetchmany(payload.limit or 200)
            columns = [item[0] for item in cursor.description] if cursor.description else []
            data = [[row[col] for col in columns] for row in rows]
            has_more = cursor.fetchone() is not None
            return {
                'type': 'rows',
                'columns': columns,
                'rows': data,
                'rowCount': len(data),
                'hasMore': has_more,
                'executionTimeMs': elapsed_ms,
                'connection': {'label': sqlite_path.name, 'mode': 'sqlite'},
            }

        conn.commit()
        return {
            'type': 'ack',
            'rowCount': cursor.rowcount if cursor.rowcount >= 0 else 0,
            'message': 'Query executed successfully',
            'executionTimeMs': elapsed_ms,
            'connection': {'label': sqlite_path.name, 'mode': 'sqlite'},
        }
    except Exception as ex:
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    finally:
        cursor.close()
        conn.close()


@router.get('/database/schema/')
async def get_schema(user: User = Depends(_require_current_user)):
    sqlite_path = _resolve_sqlite_path(_connection_for_user(user.id))
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(sqlite_path))
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        table_names = [row[0] for row in cursor.fetchall()]
        tables = []

        for table_name in table_names:
            cursor.execute(f"PRAGMA table_info('{table_name}')")
            columns = []
            for col in cursor.fetchall():
                columns.append(
                    {
                        'name': col[1],
                        'type': col[2],
                        'nullable': col[3] == 0,
                        'default': col[4],
                        'primaryKey': col[5] == 1,
                    }
                )

            cursor.execute(f"PRAGMA foreign_key_list('{table_name}')")
            foreign_keys = [
                {
                    'column': fk[3],
                    'referencedTable': fk[2],
                    'referencedColumn': fk[4],
                }
                for fk in cursor.fetchall()
            ]
            tables.append({'name': table_name, 'columns': columns, 'foreignKeys': foreign_keys})

        return {
            'schema': None,
            'tables': tables,
            'views': [],
            'generatedAt': _utcnow().isoformat(),
            'connection': {'label': sqlite_path.name, 'mode': 'sqlite'},
        }
    finally:
        cursor.close()
        conn.close()


@router.post('/database/query/suggestions/')
async def get_query_suggestions(payload: SqlSuggestionPayload, user: User = Depends(_require_current_user)):
    base_query = payload.query.strip()
    suggestions = [
        {
            'id': f'suggestion-{i + 1}',
            'title': title,
            'summary': summary,
            'query': query,
            'rationale': rationale,
            'warnings': [],
        }
        for i, (title, summary, query, rationale) in enumerate(
            [
                (
                    'Preview top rows',
                    'Get a quick sample of rows from a table.',
                    base_query if base_query.lower().startswith('select') else 'SELECT * FROM your_table LIMIT 20;',
                    'Useful for validating data shape before writing more complex queries.',
                ),
                (
                    'Row counts by table',
                    'Check approximate table sizes.',
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
                    'Helps identify high-volume tables first.',
                ),
                (
                    'Recent records',
                    'Inspect latest inserted records if your table has timestamps.',
                    'SELECT * FROM your_table ORDER BY id DESC LIMIT 20;',
                    'Good for sanity checks during iterative analysis.',
                ),
            ]
        )
    ]

    return {
        'originalQuery': payload.query,
        'analysis': 'Generated lightweight suggestions based on your current query.',
        'suggestions': suggestions[: max(1, min(payload.maxSuggestions or 3, 10))],
        'generatedAt': _utcnow().isoformat(),
        'connection': {'label': 'SQLite Database', 'mode': 'sqlite'},
        'schemaIncluded': bool(payload.includeSchema),
    }


@router.post('/database/export/')
async def export_database_rows(payload: ExportSqlPayload, user: User = Depends(_require_current_user)):
    output = io.StringIO()
    output.write(','.join(payload.columns) + '\n')
    for row in payload.rows:
        line = ','.join(json.dumps(row.get(col, ''), ensure_ascii=False) for col in payload.columns)
        output.write(line + '\n')

    content = output.getvalue().encode('utf-8')
    headers = {'Content-Disposition': f'attachment; filename=sql_results_{int(_utcnow().timestamp())}.xlsx'}
    return StreamingResponse(io.BytesIO(content), media_type='application/octet-stream', headers=headers)

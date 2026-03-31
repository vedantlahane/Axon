"""add message tables

Revision ID: 20260331_0002
Revises: 20260331_0001
Create Date: 2026-03-31 00:05:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260331_0002'
down_revision = '20260331_0001'
branch_labels = None
depends_on = None


def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _index_names(table_name: str) -> set[str]:
    return {index['name'] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def _ensure_index(name: str, table_name: str, columns: list[str], *, unique: bool = False) -> None:
    if name in _index_names(table_name):
        return
    op.create_index(name, table_name, columns, unique=unique)


def upgrade() -> None:
    tables = _table_names()

    if 'messages' not in tables:
        op.create_table(
            'messages',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('conversations.id'), nullable=False),
            sa.Column('sender', sa.String(length=20), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )

    if 'message_attachments' not in tables:
        op.create_table(
            'message_attachments',
            sa.Column('message_id', sa.Integer(), sa.ForeignKey('messages.id'), primary_key=True),
            sa.Column('document_id', sa.Integer(), sa.ForeignKey('documents.id'), primary_key=True),
        )

    _ensure_index('ix_messages_id', 'messages', ['id'])
    _ensure_index('ix_messages_conversation_id', 'messages', ['conversation_id'])


def downgrade() -> None:
    tables = _table_names()

    if 'messages' in tables:
        indexes = _index_names('messages')
        if 'ix_messages_conversation_id' in indexes:
            op.drop_index('ix_messages_conversation_id', table_name='messages')
        if 'ix_messages_id' in indexes:
            op.drop_index('ix_messages_id', table_name='messages')

    if 'message_attachments' in tables:
        op.drop_table('message_attachments')

    if 'messages' in tables:
        op.drop_table('messages')

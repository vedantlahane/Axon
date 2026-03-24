from fastapi import APIRouter, Depends

from ..auth.dependencies import get_current_user

router = APIRouter()


@router.get('/conversation/{conversation_id}/docx')
async def export_conversation_docx(conversation_id: int, user=Depends(get_current_user)):
    # TODO: build DOCX export
    return {'conversation_id': conversation_id, 'status': 'not implemented'}

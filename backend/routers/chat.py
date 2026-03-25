from fastapi import APIRouter, Depends
from ..auth.dependencies import get_current_user

router = APIRouter()


@router.post('/message')
async def send_message(message: str, user=Depends(get_current_user)):
    # TODO: hook into LangGraph agent logic here
    return {'user': user.email, 'message': message, 'response': 'Not yet implemented'}


@router.get('/streams')
async def streams():
    # SSE stream endpoint placeholder
    return {'detail': 'SSE not yet implemented'}

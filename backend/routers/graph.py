from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user
from ..database import get_db

router = APIRouter()


@router.get('/system')
async def get_graph(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # TODO: return system graph metadata and nodes
    return {'graph': [], 'user': user.email}

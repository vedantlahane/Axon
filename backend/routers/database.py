from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user
from ..database import get_db
from ..schemas.database import SQLConnectionDetails, QueryRequest

router = APIRouter()


@router.post('/connection/test')
async def test_connection(details: SQLConnectionDetails, user=Depends(get_current_user)):
    # this is the user-level connection-test path
    return {'database_url': details.database_url, 'status': 'ok'}


@router.post('/query')
async def execute_query(query: QueryRequest, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # TODO: integrate SQL execution with safety
    raise HTTPException(status_code=501, detail='Not implemented')

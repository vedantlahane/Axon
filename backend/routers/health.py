from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db

router = APIRouter()


@router.get('/health')
async def health_check(db: AsyncSession = Depends(get_db)):
    # Simple DB check
    try:
        await db.execute('SELECT 1')
        return {'status': 'ok'}
    except Exception:
        return {'status': 'degraded'}

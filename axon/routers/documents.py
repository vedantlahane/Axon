from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user
from ..database import get_db

router = APIRouter()


@router.post('/upload')
async def upload_document(file: UploadFile = File(...), user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # TODO: save file to disk/storage and create Document record
    return {'filename': file.filename, 'user': user.email}

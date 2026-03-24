from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from .jwt import decode_access_token
from ..database import get_db
from ..models.user import User
from ..schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/token')


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = decode_access_token(token)
        username: str = payload.get('sub')
        if username is None:
            raise HTTPException(status_code=401, detail='Invalid authentication credentials')
        token_data = TokenPayload(username=username)
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid token')

    user = await User.get_by_email(db, token_data.username)
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')
    return user

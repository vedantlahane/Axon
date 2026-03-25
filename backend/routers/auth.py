from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.jwt import create_access_token
from ..database import get_db
from ..models.user import User
from ..schemas.auth import Token, TokenPayload, UserCreate, UserRead
from ..config import Settings

router = APIRouter()
settings = Settings()


@router.post('/register', response_model=UserRead)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await User.get_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email already in use')

    user = User(email=user_data.email, full_name=user_data.full_name or '')
    user.set_password(user_data.password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post('/token', response_model=Token)
async def login(form_data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await User.get_by_email(db, form_data.email)
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=user.email, expires_delta=access_token_expires)
    return Token(access_token=token, token_type='bearer')

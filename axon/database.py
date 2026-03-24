import sqlalchemy.ext.asyncio as sa_asyncio
import sqlalchemy.orm as sa_orm
from sqlalchemy.ext.declarative import declarative_base

from .config import Settings

settings = Settings()

engine = sa_asyncio.create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sa_asyncio.async_sessionmaker(bind=engine, expire_on_commit=False, class_=sa_asyncio.AsyncSession)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

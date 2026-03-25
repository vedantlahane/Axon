from datetime import datetime
from pydantic import BaseModel


class ConversationBase(BaseModel):
    title: str | None = None
    summary: str | None = None


class ConversationCreate(ConversationBase):
    pass


class ConversationRead(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

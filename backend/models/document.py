from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = 'documents'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    original_name = Column(String(512), nullable=False)
    storage_path = Column(String(2048), nullable=False)
    size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship('User', backref='documents')
    messages = relationship('Message', secondary='message_attachments', back_populates='attachments')

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import Base


class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', backref='conversations')
    messages = relationship('Message', backref='conversation', cascade='all, delete-orphan')

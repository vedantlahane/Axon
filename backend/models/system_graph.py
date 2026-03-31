from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String

from ..database import Base


class SystemGraph(Base):
    __tablename__ = 'system_graphs'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    graph_metadata = Column('metadata', JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

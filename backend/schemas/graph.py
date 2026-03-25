from typing import Any

from pydantic import BaseModel


class SystemGraphCreate(BaseModel):
    name: str
    metadata: dict[str, Any] | None = None


class SystemGraphRead(SystemGraphCreate):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

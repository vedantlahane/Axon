from typing import Any

from pydantic import BaseModel, ConfigDict


class SystemGraphCreate(BaseModel):
    name: str
    metadata: dict[str, Any] | None = None


class SystemGraphRead(SystemGraphCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool

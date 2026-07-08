import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Friendly identifier for the API key")


class ApiKeyCreateResponse(ApiKeyResponse):
    secret_key: str = Field(..., description="Raw unhashed secret key. Shown only once upon creation.")


class ApiKeyRename(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class ApiKeyStatusToggle(BaseModel):
    is_active: bool

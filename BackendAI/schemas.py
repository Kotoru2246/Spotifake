from __future__ import annotations
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class SmartShuffleRequest(BaseModel):
    song_id: UUID | None = None
    playlist_song_ids: list[UUID] | None = None

class SmartShuffleResponse(BaseModel):
    song_ids: list[UUID]
    
class LoginRequest(BaseModel):
    username: str
    password: str
    role: str | None = None

from uuid import UUID

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    user_id: UUID
    expires_in: int
    
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"
    display_name: str = ""

from datetime import datetime

class RegisterResponse(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    display_name: str
    access_token: str
    token_type: str = "bearer"
    created_at: datetime

from pydantic import BaseModel, ConfigDict

class CommentCreate(BaseModel):
    song_id: str
    timestamp_ms: int
    content: str

class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID | None = None
    user_id: UUID | None = None
    song_id: UUID | str | None = None
    timestamp_ms: int = 0
    content: str = ""
    created_at: datetime | None = None
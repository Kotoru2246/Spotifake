from __future__ import annotations
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class SmartShuffleRequest(BaseModel):
    song_id: UUID

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

class CommentCreate(BaseModel):
    song_id: int
    timestamp_ms: int
    content: str

class CommentRead(BaseModel):
    id: int
    user_id: UUID
    song_id: int
    timestamp_ms: int
    content: str
    created_at: datetime
from __future__ import annotations
from pydantic import BaseModel
from uuid import UUID

class SmartShuffleRequest(BaseModel):
    song_id: UUID

class SmartShuffleResponse(BaseModel):
    song_ids: list[UUID]
    
class LoginRequest(BaseModel):
    username: str
    password: str
    role: str | None = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    expires_in: int

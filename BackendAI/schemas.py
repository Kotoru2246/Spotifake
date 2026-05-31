from __future__ import annotations
from pydantic import BaseModel
from uuid import UUID

class SmartShuffleRequest(BaseModel):
    song_id: UUID

class SmartShuffleResponse(BaseModel):
    song_ids: list[UUID]

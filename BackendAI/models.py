from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional


class Song(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source: str = Field(default="upload")
    source_id: str = Field(default="")
    title: str = Field(default="")
    artist: str = Field(default="")
    album: str = Field(default="")
    duration_ms: int = Field(default=0)
    uri: str = Field(default="")
    popularity: int = Field(default=0)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    genre: str = Field(default="")
    mood: str = Field(default="")
    tempo: float = Field(default=0.0)
    energy: float = Field(default=0.0)
    danceability: float = Field(default=0.0)
    valence: float = Field(default=0.0)
    acousticness: float = Field(default=0.0)
    instrumentalness: float = Field(default=0.0)
    key: int = Field(default=0)
    mode: int = Field(default=0)
    tags: str = Field(default="")
    file_path: str = Field(default="")
    storage_url: str = Field(default="")


class SongCreate(SQLModel):
    source: str = "upload"
    source_id: str = ""
    title: str = ""
    artist: str = ""
    album: str = ""
    duration_ms: int = 0
    uri: str = ""
    popularity: int = 0
    genre: str = ""
    mood: str = ""
    tempo: float = 0.0
    energy: float = 0.0
    danceability: float = 0.0
    valence: float = 0.0
    acousticness: float = 0.0
    instrumentalness: float = 0.0
    key: int = 0
    mode: int = 0
    tags: str = ""
    file_path: str = ""
    storage_url: str = ""


class SongRead(SQLModel):
    id: int
    source: str
    source_id: str
    title: str
    artist: str
    album: str
    duration_ms: int
    uri: str
    popularity: int
    genre: str
    mood: str
    tempo: float
    energy: float
    danceability: float
    valence: float
    acousticness: float
    instrumentalness: float
    key: int
    mode: int
    tags: str
    storage_url: str

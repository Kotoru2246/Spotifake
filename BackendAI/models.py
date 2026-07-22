from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


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


class User(SQLModel, table=True):
    __tablename__ = "Users"

    id: Optional[UUID] = Field(
    default_factory=uuid4,
    sa_column=Column(
        "UserID",
        UNIQUEIDENTIFIER,
        primary_key=True
    )
    )

    username: str = Field(
        sa_column=Column("Username", String(50), unique=True, nullable=False, index=True)
    )

    email: str = Field(
        sa_column=Column("Email", String(255), unique=True, nullable=False, index=True)
    )

    password_hash: str = Field(
        sa_column=Column("PasswordHash", String(255), nullable=False)
    )

    role: str = Field(
        sa_column=Column("Role", String(20), nullable=False, default="user")
    )

    display_name: str = Field(
        sa_column=Column("DisplayName", String(100), nullable=False, default="")
    )

    bio: str = Field(
        sa_column=Column("Bio", String(2000), nullable=False, default="")
    )

    avatar_url: str = Field(
        sa_column=Column("AvatarUrl", String(500), nullable=False, default="")
    )

    subscription_tier: str = Field(
        sa_column=Column("SubscriptionTier", String(20), nullable=False, default="Free")
    )

    is_incognito: bool = Field(
        sa_column=Column("IsIncognito", Boolean, nullable=False, default=False)
    )

    account_status: str = Field(
        sa_column=Column("AccountStatus", String(20), nullable=False, default="Active")
    )

    is_email_verified: bool = Field(
        sa_column=Column("IsEmailVerified", Boolean, nullable=False, default=False)
    )

    created_at: datetime = Field(
    sa_column=Column(
        "CreatedAt",
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
)
    updated_at: datetime = Field(
    sa_column=Column(
        "UpdatedAt",
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
)

class UserCreate(SQLModel):
    username: str
    email: str
    password: str
    role: str = "user"
    display_name: str = ""


class UserRead(SQLModel):
    id: UUID
    username: str
    email: str
    role: str
    display_name: str
    bio: str
    avatar_url: str
    subscription_tier: str
    account_status: str
    is_email_verified: bool
    created_at: datetime


class ArtistProfile(SQLModel, table=True):
    __tablename__ = "ArtistProfiles"

    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column(
            "ArtistProfileID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
)
    

    stage_name: str = Field(default="")
    bio: str = Field(default="")
    genre: str = Field(default="")
    verified: bool = Field(default=False)
    followers_count: int = Field(default=0)
    website: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AdminAuditLog(SQLModel, table=True):
    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column(
            "AuditLogID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
    )

    admin_id: UUID = Field(
        sa_column=Column(
            "AdminID",
            UNIQUEIDENTIFIER,
            ForeignKey("Users.UserID"),
            nullable=False
        )
    )

    action: str = Field(default="")
    target_type: str = Field(default="")
    target_id: str = Field(default="")
    details: str = Field(default="")

    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )

class Comment(SQLModel, table=True):
    __tablename__ = "Comments"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            "UserID",
            UNIQUEIDENTIFIER,
            ForeignKey("Users.UserID"),
            nullable=False
        )
    )
    song_id: int = Field(foreign_key="song.id")
    timestamp_ms: int = Field(default=0)
    content: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
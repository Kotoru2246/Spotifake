from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, LargeBinary
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

class Album(SQLModel, table=True):
    __tablename__ = "Albums"
    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column("AlbumID", UNIQUEIDENTIFIER, primary_key=True)
    )
    title: str = Field(sa_column=Column("Title", String(255)))
    artist_id: UUID = Field(sa_column=Column("ArtistID", UNIQUEIDENTIFIER, ForeignKey("ArtistProfiles.ArtistID")))
    cover_art_url: str = Field(default="", sa_column=Column("CoverArtUrl", String(1000)))
    cover_art_data: Optional[bytes] = Field(default=None, sa_column=Column("CoverArtData", LargeBinary))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("CreatedAt", DateTime))

class AlbumCreate(SQLModel):
    title: str
    cover_art_url: str = ""

class AlbumRead(SQLModel):
    id: UUID
    title: str
    artist_id: UUID
    cover_art_url: str
    created_at: datetime
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


class Song(SQLModel, table=True):
    __tablename__ = "Songs"
    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column(
            "SongID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
    )
    user_id: Optional[UUID] = Field(sa_column=Column("UserID", UNIQUEIDENTIFIER))
    genre_id: Optional[UUID] = Field(sa_column=Column("GenreID", UNIQUEIDENTIFIER))
    album_id: Optional[UUID] = Field(sa_column=Column("AlbumID", UNIQUEIDENTIFIER))
    source: str = Field(default="upload", sa_column=Column("Source", String(50)))
    source_id: str = Field(default="", sa_column=Column("SourceID", String(255)))
    title: str = Field(default="", sa_column=Column("Title", String(255)))
    artist: str = Field(sa_column=Column("ArtistName", String(255)))
    collab_artists: str = Field(default="", sa_column=Column("CollabArtists", String(1000)))
    album: str = Field(default="", sa_column=Column("Album", String(255)))
    duration_ms: int = Field(default=0, sa_column=Column("DurationSeconds", Integer))
    uri: str = Field(default="", sa_column=Column("Uri", String(500)))
    popularity: int = Field(default=0, sa_column=Column("Popularity", Integer))
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("UploadedAt", DateTime))
    genre: str = Field(default="", sa_column=Column("Genre", String(100)))
    mood: str = Field(default="", sa_column=Column("Mood", String(100)))
    language: str = Field(default="", sa_column=Column("Language", String(50)))
    tempo: float = Field(default=0.0, sa_column=Column("Tempo", Float))
    energy: float = Field(default=0.0, sa_column=Column("Energy", Float))
    danceability: float = Field(default=0.0, sa_column=Column("Danceability", Float))
    valence: float = Field(default=0.0, sa_column=Column("Valence", Float))
    acousticness: float = Field(default=0.0, sa_column=Column("Acousticness", Float))
    instrumentalness: float = Field(default=0.0, sa_column=Column("Instrumentalness", Float))
    key: int = Field(default=0, sa_column=Column("Key", Integer))
    mode: int = Field(default=0, sa_column=Column("Mode", Integer))
    tags: str = Field(default="", sa_column=Column("Tags", String(1000)))
    file_path: str = Field(default="", sa_column=Column("FilePath", String(1000)))
    file_data: Optional[bytes] = Field(default=None, sa_column=Column("FileData", LargeBinary))
    cover_art_url: str = Field(default="", sa_column=Column("CoverArtUrl", String(1000)))
    cover_art_data: Optional[bytes] = Field(default=None, sa_column=Column("CoverArtData", LargeBinary))
    release_date: Optional[datetime] = Field(default=None, sa_column=Column("ReleaseDate", DateTime))
    credits: str = Field(default="", sa_column=Column("Credits", String(1000)))
    lyrics: str = Field(default="", sa_column=Column("Lyrics", String))
    storage_url: str = Field(default="", sa_column=Column("StorageUrl", String(1000)))


class SongCreate(SQLModel):
    source: str = "upload"
    source_id: str = ""
    title: str = ""
    artist: str = ""
    collab_artists: str = ""
    album: str = ""
    album_id: Optional[UUID] = None
    duration_ms: int = 0
    uri: str = ""
    popularity: int = 0
    genre: str = ""
    mood: str = ""
    language: str = ""
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
    cover_art_url: str = ""
    release_date: Optional[datetime] = None
    credits: str = ""
    lyrics: str = ""


class SongRead(SQLModel):
    id: UUID
    source: str
    source_id: str
    title: str
    artist: str
    collab_artists: str
    album: str
    duration_ms: int
    uri: str
    popularity: int
    genre: str
    mood: str
    language: str
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
    cover_art_url: str
    release_date: Optional[datetime]
    credits: str


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
            "ArtistID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
    )
    user_id: UUID = Field(sa_column=Column("UserID", UNIQUEIDENTIFIER, ForeignKey("Users.UserID")))
    

    stage_name: str = Field(default="", sa_column=Column("StageName", String(255)))
    bio: str = Field(default="", sa_column=Column("Bio", String(2000)))
    genre: str = Field(default="", sa_column=Column("Genre", String(100)))
    verified: bool = Field(default=False, sa_column=Column("Verified", Boolean))
    status: str = Field(default="Pending", sa_column=Column("Status", String(50)))
    followers_count: int = Field(default=0, sa_column=Column("FollowersCount", Integer))
    website: str = Field(default="", sa_column=Column("Website", String(500)))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column("CreatedAt", DateTime))

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
    
    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column(
            "CommentID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
    )
    user_id: UUID = Field(
        sa_column=Column(
            "UserID",
            UNIQUEIDENTIFIER,
            nullable=False
        )
    )
    song_id: UUID = Field(
        sa_column=Column(
            "SongID",
            UNIQUEIDENTIFIER,
            nullable=False
        )
    )
    timestamp_ms: int = Field(
        default=0,
        sa_column=Column("TimestampMS", Integer, nullable=False, default=0)
    )
    content: str = Field(
        default="",
        sa_column=Column("Content", String(2000), nullable=False, default="")
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column("CreatedAt", DateTime, nullable=False, default=datetime.utcnow)
    )


class PaymentTransaction(SQLModel, table=True):
    """Lưu lịch sử giao dịch Premium. Mỗi lần user đăng ký/gia hạn Premium tạo 1 record."""
    __tablename__ = "PaymentTransactions"

    id: Optional[UUID] = Field(
        default_factory=uuid4,
        sa_column=Column(
            "TransactionID",
            UNIQUEIDENTIFIER,
            primary_key=True
        )
    )
    user_id: UUID = Field(
        sa_column=Column(
            "UserID",
            UNIQUEIDENTIFIER,
            ForeignKey("Users.UserID"),
            nullable=False
        )
    )
    amount_vnd: int = Field(
        default=18000,
        sa_column=Column("AmountVND", Integer, nullable=False, default=18000)
    )
    plan_name: str = Field(
        default="Premium 1 Tháng",
        sa_column=Column("PlanName", String(100), nullable=False, default="Premium 1 Tháng")
    )
    status: str = Field(
        default="pending",
        sa_column=Column("Status", String(20), nullable=False, default="pending")
    )
    payment_method: str = Field(
        default="",
        sa_column=Column("PaymentMethod", String(50), nullable=False, default="")
    )
    transaction_code: str = Field(
        default="",
        sa_column=Column("TransactionCode", String(50), nullable=False, default="")
    )
    # OTP 6 chữ số dùng để xác thực (lưu plaintext vì đây là demo)
    otp_code: str = Field(
        default="",
        sa_column=Column("OtpCode", String(10), nullable=False, default="")
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column("CreatedAt", DateTime, nullable=False)
    )
    paid_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column("PaidAt", DateTime, nullable=True)
    )
    # Ngày hết hạn gói Premium (created_at + 30 ngày), set khi verify thành công
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column("ExpiresAt", DateTime, nullable=True)
    )


class PaymentTransactionRead(SQLModel):
    """Schema trả về cho frontend — không expose otp_code."""
    id: UUID
    user_id: UUID
    amount_vnd: int
    plan_name: str
    status: str
    payment_method: str
    transaction_code: str
    created_at: datetime
    paid_at: Optional[datetime]
    expires_at: Optional[datetime]
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from uuid import UUID
import asyncio
import threading
import numpy as np
import jwt
import bcrypt
from sqlmodel import Session, select
from .schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SmartShuffleRequest, SmartShuffleResponse, CommentCreate, CommentRead
from .spotify_integration import SpotifyIntegration
from .callback_server import start_callback_server, stop_callback_server, get_auth_code, reset_auth_code
from .db import create_db_and_tables, engine
from .models import Song, SongCreate, SongRead, User, UserCreate, UserRead, ArtistProfile, AdminAuditLog, Comment
from .upload_handler import save_upload_file
from .audio_features import categorize_genre_and_mood, extract_audio_features
from .essentia_client import classify_with_features
import tempfile
import os

app = FastAPI(title="Music Player AI Bridge")

try:
    spotify = SpotifyIntegration()
    print("Spotify integration initialized.")
except Exception as e:
    print(f"Spotify integration disabled: {e}")
    spotify = None
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "spotifake-dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEST_USERS = {
    "user_test": {"password": "User@123", "role": "user", "id": UUID("00000000-0000-0000-0000-000000000001")},
    "artist_test": {"password": "Artist@123", "role": "artist", "id": UUID("00000000-0000-0000-0000-000000000002")},
    "admin_test": {"password": "Admin@123", "role": "admin", "id": UUID("00000000-0000-0000-0000-000000000003")}
}


def get_session():
    """Database session dependency."""
    with Session(engine) as session:
        yield session


from uuid import UUID

def create_access_token(user_id: UUID, username: str, role: str) -> tuple[str, int]:
    """Create a signed JWT for the authenticated user."""
    expires_in = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    payload = {
        "sub": username,
        "user_id": str(user_id),
        "role": role,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return token, expires_in
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    """Validate the Bearer token and return the user from the database."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    user_id = payload.get("user_id")
    token_role = payload.get("role")

    if not username or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if this is a demo/test user
    if username in TEST_USERS:
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
        # We must insert this user into the DB if they don't exist, otherwise comments will fail foreign key checks!
        db_user = session.get(User, user_uuid)
        if not db_user:
            db_user = User(
                id=user_uuid,
                username=username,
                email=f"{username}@musicplayer.local",
                password_hash="testuser",
                role=token_role or TEST_USERS[username]["role"],
                display_name=username,
                account_status="Active"
            )
            session.add(db_user)
            try:
                session.commit()
                session.refresh(db_user)
            except Exception:
                session.rollback()
        return db_user


    # Verify user exists in database
    try:
        db_user = session.get(User, user_id)
        if db_user and db_user.username == username and db_user.account_status == "Active":
            return db_user
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found or account is inactive",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify role matches
    if db_user.role != token_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token role does not match user role",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return db_user


def require_role(required_role: str):
    """Dependency factory: returns a dependency that checks for a specific role."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires '{required_role}' role",
            )
        return current_user
    return role_checker


@app.post("/auth/register", response_model=RegisterResponse)
def register(request: RegisterRequest, session: Session = Depends(get_session)):
    """Register a new user account."""
    # Validate role
    valid_roles = {"user", "artist", "admin"}
    if request.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    # Check for existing username
    existing_username = session.exec(select(User).where(User.username == request.username)).first()
    if existing_username:
        raise HTTPException(status_code=409, detail="Username already taken")

    # Check for existing email
    existing_email = session.exec(select(User).where(User.email == request.email)).first()
    if existing_email:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    password_hash = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Create user
    display_name = request.display_name or request.username
    db_user = User(
        username=request.username,
        email=request.email,
        password_hash=password_hash,
        role=request.role,
        display_name=display_name,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Generate JWT
    access_token, expires_in = create_access_token(db_user.id, db_user.username, db_user.role)

    return RegisterResponse(
    id=str(db_user.id),
    username=db_user.username,
    email=db_user.email,
    role=db_user.role,
    display_name=db_user.display_name,
    access_token=access_token,
    created_at=db_user.created_at
)


@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    """Verify username/password against database or test users and issue a JWT."""
    # 1. Check demo/test users first
    if request.username in TEST_USERS:
        user_info = TEST_USERS[request.username]
        if request.password == user_info["password"]:
            role = user_info["role"]
            if request.role and request.role != role:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account type does not match the selected role",
                )
            access_token, expires_in = create_access_token(user_info["id"], request.username, role)
            return LoginResponse(
                access_token=access_token,
                token_type="bearer",
                username=request.username,
                role=role,
                user_id=str(user_info["id"]),
                expires_in=expires_in,
            )

    # 2. Check SQL Server database
    try:
        db_user = session.exec(select(User).where(User.username == request.username)).first()
        if db_user:
            pwd_valid = False
            try:
                pwd_valid = bcrypt.checkpw(request.password.encode("utf-8"), db_user.password_hash.encode("utf-8"))
            except Exception:
                pwd_valid = (request.password == db_user.password_hash)

            if pwd_valid:
                if db_user.account_status != "Active":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account is inactive. Contact an administrator.",
                    )
                if request.role and request.role != db_user.role:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Account type does not match the selected role",
                    )
                access_token, expires_in = create_access_token(db_user.id, db_user.username, db_user.role)
                return LoginResponse(
                    access_token=access_token,
                    token_type="bearer",
                    username=db_user.username,
                    role=db_user.role,
                    user_id=str(db_user.id),
                    expires_in=expires_in,
                )
    except Exception as e:
        print(f"⚠ DB login check warning: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )

# Start the allback server when the app starts
@app.on_event("startup")
async def startup_event():
    """Start the callback server on app startup."""
    try:
        start_callback_server(port=8888)
    except Exception as e:
        print(f"Warning: Could not start callback server: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop the callback server on app shutdown."""
    stop_callback_server()

# Placeholder neighbor map for demo and local testing.
# Replace this with real ChromaDB queries and vector similarity when ready.
SONG_NEIGHBORS = {
    UUID('00000000-0000-0000-0000-000000000001'): [
        UUID('00000000-0000-0000-0000-000000000002'),
        UUID('00000000-0000-0000-0000-000000000003'),
        UUID('00000000-0000-0000-0000-000000000004')
    ]
}

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "Music Player AI Backend"}

@app.get("/spotify/auth-url")
def get_spotify_auth_url(current_user=Depends(get_current_user)):
    """Get Spotify OAuth authentication URL."""
    auth_url = spotify.sp_oauth.get_authorize_url()
    return {"auth_url": auth_url}

@app.get("/spotify/auth-status")
def get_spotify_auth_status(current_user=Depends(get_current_user)):
    """Check if authorization code was captured."""
    code = get_auth_code()
    if code:
        return {"authenticated": True, "code": code}
    return {"authenticated": False, "code": None}

@app.post("/spotify/authenticate-with-code")
async def spotify_authenticate_with_code(code: str = None, current_user=Depends(get_current_user)):
    """Authenticate with Spotify using the captured auth code."""
    # If code is provided in query/body, use it directly
    if not code:
        # Wait a moment for the callback to be processed
        for attempt in range(10):  # Try for up to 5 seconds
            code = get_auth_code()
            if code:
                reset_auth_code()
                break
            await asyncio.sleep(0.5)
        
        if not code:
            raise HTTPException(status_code=408, detail="Authorization code not received. Please authorize the app in your browser.")
    
    # Try to authenticate with the code
    if spotify.authenticate_with_code(code):
        reset_auth_code()
        return {"status": "authenticated", "message": "Successfully connected to Spotify"}
    else:
        raise HTTPException(status_code=401, detail="Failed to authenticate with Spotify")

@app.get("/spotify/tracks")
def get_spotify_tracks(limit: int = 50, current_user=Depends(get_current_user)):
    """Fetch user's liked tracks from Spotify."""
    if not spotify.sp:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify. Visit /spotify/auth-url first.")
    
    tracks = spotify.get_current_user_tracks(limit)
    return {"tracks": tracks, "count": len(tracks)}

@app.get("/spotify/playlists")
def get_spotify_playlists(limit: int = 20, current_user=Depends(get_current_user)):
    """Fetch user's playlists from Spotify."""
    if not spotify.sp:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify. Visit /spotify/auth-url first.")
    
    playlists = spotify.get_playlists(limit)
    return {"playlists": playlists, "count": len(playlists)}

@app.get("/spotify/playlist/{playlist_id}/tracks")
def get_playlist_tracks(playlist_id: str, current_user=Depends(get_current_user)):
    """Fetch tracks from a specific Spotify playlist."""
    if not spotify.sp:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify. Visit /spotify/auth-url first.")
    
    tracks = spotify.get_playlist_tracks(playlist_id)
    return {"tracks": tracks, "count": len(tracks)}

@app.get("/spotify/track/{track_id}/features")
def get_track_features(track_id: str, current_user=Depends(get_current_user)):
    """Get audio features for a track (for Smart Shuffle AI)."""
    if not spotify.sp:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify. Visit /spotify/auth-url first.")
    
    features = spotify.get_track_audio_features(track_id)
    if not features:
        raise HTTPException(status_code=404, detail="Could not fetch audio features for track")
    
    return {"track_id": track_id, "features": features}

@app.get("/spotify/search")
def search_spotify(query: str, search_type: str = "track", limit: int = 50, current_user=Depends(get_current_user)):
    """Search Spotify's entire catalog."""
    if not spotify.sp:
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify. Visit /spotify/auth-url first.")
    
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    results = spotify.search_spotify(query, search_type, limit)
    return {"query": query, "type": search_type, "results": results, "count": len(results)}


def _extract_and_update(song_id: int, file_path: str):
    """Background task: extract audio features and update the song record."""
    try:
        print(f"[bg] Starting feature extraction for song {song_id}: {file_path}")
        features = extract_audio_features(file_path)
        genre, mood = categorize_genre_and_mood(features, file_path)
        print(f"[bg] Done — genre={genre}, mood={mood}")
        with Session(engine) as bg_session:
            song = bg_session.get(Song, song_id)
            if song:
                song.tempo           = features.get("tempo", 0.0)
                song.energy          = features.get("energy", 0.0)
                song.danceability    = features.get("danceability", 0.0)
                song.valence         = features.get("valence", 0.0)
                song.acousticness    = features.get("acousticness", 0.0)
                song.instrumentalness = features.get("instrumentalness", 0.0)
                song.key             = features.get("key", 0)
                song.mode            = features.get("mode", 0)
                song.duration_ms     = features.get("duration_ms", song.duration_ms)
                song.genre           = genre
                song.mood            = mood
                song.tags            = f"{genre},{mood}"
                bg_session.add(song)
                bg_session.commit()
                print(f"[bg] Song {song_id} updated in DB.")
    except Exception as e:
        print(f"[bg] Feature extraction failed for song {song_id}: {e}")


@app.post("/songs/upload", response_model=SongRead)
async def upload_song(
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: str = Form(...),
    album: str = Form(default=""),
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Upload a song file. Saves immediately and returns fast.
    Feature extraction (genre/mood/tempo) runs in the background.
    Poll GET /songs/{id}/features to check when analysis is done.
    """
    try:
        # 1. Save the file to disk immediately
        file_path = await save_upload_file(file)

        # 2. Save the song to DB right away with placeholder features
        song = Song(
            source="upload",
            title=title,
            artist=artist,
            album=album,
            file_path=file_path,
            storage_url=file_path,
            duration_ms=0,
            tempo=0.0, energy=0.0, danceability=0.0,
            valence=0.0, acousticness=0.0, instrumentalness=0.0,
            key=0, mode=0,
            genre="analyzing...",
            mood="analyzing...",
            tags="analyzing...",
        )
        session.add(song)
        session.commit()
        session.refresh(song)

        # 3. Kick off feature extraction in a background thread (non-blocking)
        t = threading.Thread(
            target=_extract_and_update,
            args=(song.id, file_path),
            daemon=True
        )
        t.start()

        # 4. Return immediately — frontend gets the song record in < 1 second
        return song
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error uploading song: {str(e)}")


@app.get("/songs/{song_id}/features")
def get_song_features(song_id: int, session: Session = Depends(get_session)):
    """Poll this endpoint to check if background feature extraction is done."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    ready = song.genre not in (None, "", "analyzing...")
    return {
        "ready": ready,
        "genre": song.genre,
        "mood": song.mood,
        "tempo": song.tempo,
        "energy": song.energy,
        "danceability": song.danceability,
        "valence": song.valence,
    }


@app.post("/classify-file")
async def classify_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    """
    Classify an audio file using the trained ML model.
    
    Extracts features and returns genre prediction with confidence and feature details.
    This endpoint is used by the test UI to validate the trained model.
    """
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Extract audio features
            features = extract_audio_features(tmp_path)
            
            # Classify using the ML model
            genre, classification_data = classify_with_features(features)
            
            # Return results with genre, confidence, features subset, and genre scores
            return {
                "genre": genre,
                "confidence": classification_data.get("confidence", 0),
                "features": {
                    "tempo": features.get("tempo"),
                    "energy": features.get("energy"),
                    "danceability": features.get("danceability"),
                    "acousticness": features.get("acousticness"),
                    "valence": features.get("valence"),
                    "instrumentalness": features.get("instrumentalness")
                },
                "genre_scores": classification_data.get("genre_scores", {}),
                "mapped_scores_18": classification_data.get("mapped_scores_18", {}),
                "mapped_top_5_18": classification_data.get("mapped_top_5_18", {}),
                "source_genre": classification_data.get("source_genre"),
                "source_confidence": classification_data.get("source_confidence"),
                "all_scores": classification_data.get("all_scores", {})
            }
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error classifying audio: {str(e)}")


@app.get("/songs", response_model=list[SongRead])
def list_songs(session: Session = Depends(get_session)):
    """List all uploaded songs from SQL Server."""
    songs = session.exec(select(Song)).all()
    return songs


@app.delete("/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(song_id: int, session: Session = Depends(get_session)):
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    session.delete(song)
    session.commit()
    return

@app.post("/songs/{song_id}/comments", response_model=CommentRead)
def create_comment(
    song_id: int,
    comment: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    song = session.get(Song, song_id)
    if not song:
        # Allow commenting on frontend hardcoded tracks by automatically creating them in the DB
        song = Song(id=song_id, title=f"Track {song_id}")
        session.add(song)
        try:
            session.commit()
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Failed to initialize track for commenting")
    
    db_comment = Comment(
        user_id=current_user.id,
        song_id=song_id,
        timestamp_ms=comment.timestamp_ms,
        content=comment.content
    )
    session.add(db_comment)
    session.commit()
    session.refresh(db_comment)
    return db_comment

@app.get("/songs/{song_id}/comments", response_model=list[CommentRead])
def get_comments(song_id: int, session: Session = Depends(get_session)):
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    comments = session.exec(select(Comment).where(Comment.song_id == song_id).order_by(Comment.timestamp_ms)).all()
    return comments


@app.get("/songs/{song_id}", response_model=SongRead)
def get_song(song_id: int, session: Session = Depends(get_session)):
    """Get a song by ID."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    return song



@app.get("/songs/{song_id}/stream")
def stream_song(song_id: int, session: Session = Depends(get_session)):
    """Stream an uploaded song audio file for web playback."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")

    if not song.file_path or not os.path.exists(song.file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on server")

    extension = os.path.splitext(song.file_path)[1].lower()
    media_types = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".flac": "audio/flac",
    }
    media_type = media_types.get(extension, "audio/mpeg")

    return FileResponse(
        path=song.file_path,
        media_type=media_type,
        filename=os.path.basename(song.file_path),
    )



@app.post("/recommendations/hybrid")
def get_hybrid_recommendations(
    seed_song_id: int = None,
    seed_spotify_id: str = None,
    limit: int = 10,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get recommendations combining:
    - Spotify recommendations (if seed_spotify_id provided)
    - Similar uploaded songs (based on audio features)
    """
    recommendations = {
        "spotify_recommendations": [],
        "similar_uploads": [],
        "combined": []
    }
    
    # Get Spotify recommendations if seed provided
    if seed_spotify_id and spotify.sp:
        try:
            spotify_recs = spotify.sp.recommendations(seed_tracks=[seed_spotify_id], limit=limit)
            recommendations["spotify_recommendations"] = [
                {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"] if track["artists"] else "Unknown",
                    "uri": track["uri"],
                    "source": "spotify"
                }
                for track in spotify_recs.get("tracks", [])
            ]
        except Exception as e:
            print(f"Error fetching Spotify recommendations: {e}")
    
    # Get similar uploaded songs based on audio features
    if seed_song_id:
        seed_song = session.get(Song, seed_song_id)
        if not seed_song:
            raise HTTPException(status_code=404, detail=f"Song {seed_song_id} not found")
        
        # Get all other songs
        all_songs = session.exec(select(Song).where(Song.id != seed_song_id)).all()
        
        # Compute similarity based on audio features
        seed_vector = np.array([
            seed_song.tempo,
            seed_song.energy,
            seed_song.danceability,
            seed_song.valence,
            seed_song.acousticness,
            seed_song.instrumentalness
        ])
        
        similarities = []
        for song in all_songs:
            song_vector = np.array([
                song.tempo,
                song.energy,
                song.danceability,
                song.valence,
                song.acousticness,
                song.instrumentalness
            ])
            
            # Euclidean distance
            distance = np.linalg.norm(seed_vector - song_vector)
            similarities.append((song, distance))
        
        # Sort by similarity (closest first)
        similarities.sort(key=lambda x: x[1])
        
        recommendations["similar_uploads"] = [
            {
                "id": song.id,
                "title": song.title,
                "artist": song.artist,
                "genre": song.genre,
                "mood": song.mood,
                "source": "upload",
                "similarity_distance": float(distance)
            }
            for song, distance in similarities[:limit]
        ]
    
    # Combine recommendations
    recommendations["combined"] = (
        recommendations["spotify_recommendations"] +
        recommendations["similar_uploads"]
    )[:limit]
    
    return recommendations

@app.post('/api/smart-shuffle', response_model=SmartShuffleResponse)
def smart_shuffle(request: SmartShuffleRequest):
    """
    Smart Shuffle endpoint.
    Accepts a seed song ID and returns similar song recommendations.
    Currently returns placeholder data; integrate ChromaDB for real vector search.
    """
    seed_id = request.song_id
    if seed_id not in SONG_NEIGHBORS:
        raise HTTPException(
            status_code=404,
            detail=f'Seed song {seed_id} not found in vector store. Please add sample data to SONG_NEIGHBORS.'
        )

    neighbor_ids = SONG_NEIGHBORS[seed_id]
    response = SmartShuffleResponse(song_ids=neighbor_ids)
    return response


# ============================================================
# Admin-only endpoints
# ============================================================

@app.get("/admin/users", response_model=list[UserRead])
def admin_list_users(
    session: Session = Depends(get_session),
    admin: User = Depends(require_role("admin"))
):
    """List all registered users. Admin only."""
    users = session.exec(select(User)).all()
    return users


@app.put("/admin/users/{user_id}/status")
def admin_update_user_status(
    user_id: int,
    status: str = "Active",
    session: Session = Depends(get_session),
    admin: User = Depends(require_role("admin"))
):
    """Update a user's account status (Active/Banned/Suspended). Admin only."""
    valid_statuses = {"Active", "Banned", "Suspended"}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = target.account_status
    target.account_status = status
    target.updated_at = datetime.utcnow()
    session.add(target)

    # Log the action
    log = AdminAuditLog(
        admin_id=admin.id,
        action="UPDATE_USER_STATUS",
        target_type="user",
        target_id=str(user_id),
        details=f"Status changed from '{old_status}' to '{status}'",
    )
    session.add(log)
    session.commit()

    return {"status": "updated", "user_id": user_id, "new_status": status}


@app.put("/admin/artists/{user_id}/verify")
def admin_verify_artist(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role("admin"))
):
    """Verify an artist account. Admin only."""
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role != "artist":
        raise HTTPException(status_code=400, detail="User is not an artist")

    # Create or update artist profile
    profile = session.exec(select(ArtistProfile).where(ArtistProfile.user_id == user_id)).first()
    if not profile:
        profile = ArtistProfile(user_id=user_id)
    profile.verified = True
    session.add(profile)

    # Log the action
    log = AdminAuditLog(
        admin_id=admin.id,
        action="VERIFY_ARTIST",
        target_type="user",
        target_id=str(user_id),
        details=f"Artist '{target.username}' verified",
    )
    session.add(log)
    session.commit()

    return {"status": "verified", "user_id": user_id}


@app.delete("/admin/songs/{song_id}")
def admin_delete_song(
    song_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role("admin"))
):
    """Delete a song. Admin only."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    session.delete(song)

    # Log the action
    from datetime import datetime as dt
    log = AdminAuditLog(
        admin_id=admin.id,
        action="DELETE_SONG",
        target_type="song",
        target_id=str(song_id),
        details=f"Song '{song.title}' by {song.artist} deleted",
    )
    session.add(log)
    session.commit()

    return {"status": "deleted", "song_id": song_id}


@app.get("/admin/audit-logs")
def admin_get_audit_logs(
    limit: int = 50,
    session: Session = Depends(get_session),
    admin: User = Depends(require_role("admin"))
):
    """View admin audit logs. Admin only."""
    logs = session.exec(
        select(AdminAuditLog).order_by(AdminAuditLog.timestamp.desc()).limit(limit)
    ).all()
    return logs


@app.post("/songs/{song_id}/comments", response_model=CommentRead)
def create_comment(
    song_id: int,
    comment: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    song = session.get(Song, song_id)
    if not song:
        # Allow commenting on frontend hardcoded tracks by automatically creating them in the DB
        song = Song(id=song_id, title=f"Track {song_id}")
        session.add(song)
        try:
            session.commit()
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Failed to initialize track for commenting")
    
    db_comment = Comment(
        user_id=current_user.id,
        song_id=song_id,
        timestamp_ms=comment.timestamp_ms,
        content=comment.content
    )
    session.add(db_comment)
    session.commit()
    session.refresh(db_comment)
    return db_comment

@app.get("/songs/{song_id}/comments", response_model=list[CommentRead])
def get_comments(song_id: int, session: Session = Depends(get_session)):
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    comments = session.exec(select(Comment).where(Comment.song_id == song_id).order_by(Comment.timestamp_ms)).all()
    return comments

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

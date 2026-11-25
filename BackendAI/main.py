from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, Request
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from uuid import UUID
import os
import tempfile
import threading
import shutil
from pathlib import Path


def _ensure_ffmpeg_on_path() -> None:
    """Make ffmpeg reachable for audio_features (subprocess) and librosa/audioread (m4a/mp3 decode).

    Order: FFMPEG_PATH env (file or folder), ffmpeg already on PATH, spotdl's ~/.spotdl/ffmpeg.exe, C:\\ffmpeg\\bin.
    """
    if shutil.which("ffmpeg"):
        return
    candidates = []
    if os.environ.get("FFMPEG_PATH"):
        candidates.append(Path(os.environ["FFMPEG_PATH"]))
    candidates += [Path.home() / ".spotdl", Path(r"C:\ffmpeg\bin")]
    for c in candidates:
        folder = c.parent if c.is_file() else c
        if (folder / "ffmpeg.exe").exists() or (folder / "ffmpeg").exists():
            os.environ["PATH"] = str(folder) + os.pathsep + os.environ.get("PATH", "")
            print(f"[startup] ffmpeg added to PATH from {folder}")
            return
    print("[startup] WARNING: ffmpeg not found; m4a/mp3 analysis will fail. Set FFMPEG_PATH.")


_ensure_ffmpeg_on_path()

import numpy as np
import jwt
import bcrypt
from sqlmodel import Session, select
from .schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SmartShuffleRequest, SmartShuffleResponse, CommentCreate, CommentRead, KnnProjectionResponse, KnnProjectionPoint

from .spotify_integration import SpotifyIntegration
from .callback_server import start_callback_server, stop_callback_server, get_auth_code, reset_auth_code
from .db import create_db_and_tables, engine
from .models import Song, SongCreate, SongRead, User, UserCreate, UserRead, ArtistProfile, AdminAuditLog, Comment, Album, AlbumCreate, AlbumRead
from .upload_handler import save_upload_file
from .audio_features import categorize_genre_and_mood, extract_audio_features
from .genre_classifier_advanced import GenreClassifierV4
from .cnn_spectrogram_classifier import CnnSpectrogramClassifier, format_genre_label
from .language_detector import detect_language
from .recommendation_engine import recommendation_service
from .essentia_client import classify_with_features
import tempfile
import os

# Initialize Advanced AI Models
genre_classifier = GenreClassifierV4()
try:
    cnn_classifier = CnnSpectrogramClassifier()
except Exception as e:
    print(f"Warning: CNN Classifier disabled: {e}")
    cnn_classifier = None
# Main genre model (PANNs embeddings + LogReg, see genre_eval/RESULTS.md); the CNN stays as the fallback.
try:
    from .embedding_genre_classifier import EmbeddingGenreClassifier
    embedding_classifier = EmbeddingGenreClassifier()
except Exception as e:
    print(f"Warning: embedding genre classifier disabled, using CNN: {e}")
    embedding_classifier = None


def _embedding_genre(path: str):
    """(genre_label, all_probs) from the embedding model, or (None, {}) if it is unavailable or fails."""
    if not embedding_classifier:
        return None, {}
    try:
        pred = embedding_classifier.predict(path)
        return pred.get("genre") or None, pred.get("all_probs") or {}
    except Exception as e:
        print(f"[genre] embedding classifier failed for {path}: {e}")
        return None, {}

app = FastAPI(title="Music Player AI Bridge")

try:
    spotify = SpotifyIntegration()
    print("Spotify integration initialized.")
except Exception as e:
    print(f"Spotify integration disabled: {e}")
    spotify = None
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "spotifake-dev-secret-change-me-12345")
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
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_aud": False, "verify_iss": False})
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        print("JWT Decode Error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {repr(e)}",
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
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
        db_user = session.get(User, user_uuid)
        if db_user and db_user.account_status == "Active":
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
    # 1. Check SQL Server database
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

    # 2. Check demo/test users fallback
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

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
    )

# Start the allback server when the app starts
@app.on_event("startup")
async def startup_event():
    """Start the callback server and initialize database tables on app startup."""
    try:
        create_db_and_tables()
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Warning: Database table creation note: {e}")
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


def _extract_and_update(song_id: UUID, training_genre: str = ""):
    """Background task: extract audio features and update the song record."""
    tmp_path = None
    owns_tmp = False
    try:
        print(f"[bg] Starting feature extraction for song {song_id}")
        with Session(engine) as bg_session:
            song = bg_session.get(Song, song_id)
            if not song:
                print(f"[bg] Song {song_id} not found.")
                return
            
            if song.file_data:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
                    tmp.write(song.file_data)
                    tmp_path = tmp.name
                owns_tmp = True
            elif song.file_path and os.path.exists(song.file_path):
                tmp_path = song.file_path
            else:
                print(f"[bg] Song {song_id} missing file_data and valid file_path.")
                return

        # 1. Base features
        features = extract_audio_features(tmp_path)
        
        # 2. Extract AI Genre (embedding model first; it already returns the stored label format)
        genre, _ = _embedding_genre(tmp_path)
        primary_genre = genre.split(", ")[0] if genre else None
        if not genre:
            if cnn_classifier:
                pred = cnn_classifier.predict(tmp_path)
                primary_genre = pred['genre']
                all_scores = pred['all_probs']
            else:
                primary_genre, details = genre_classifier.classify_genre(tmp_path)
                all_scores = details.get('all_scores', {})

            genre = primary_genre
            if all_scores:
                high_conf_genres = [g for g, score in all_scores.items() if score > 0.2]
                if high_conf_genres:
                    genre = ", ".join(high_conf_genres)
        
        # 3. Extract Mood using the AI Genre as context
        from .audio_features import categorize_genre_and_mood_rule_based
        _, mood = categorize_genre_and_mood_rule_based(features, override_genre=primary_genre)
        
        # 4. Extract AI Language using Whisper (offset by 50%)
        language = detect_language(tmp_path)
        
        print(f"[bg] Done — genre={genre}, mood={mood}, language={language}")
        
        # 4. Handle Dataset Contribution if requested
        if training_genre:
            import pandas as pd
            print(f"[bg] User contributed song to dataset as: {training_genre}")
            csv_path = os.path.join(os.path.dirname(__file__), 'fma_data', 'custom_training_data.csv')
            
            # Use raw_features from 25%, 50%, and 75% marks
            all_features = []
            for pct in [0.25, 0.50, 0.75]:
                from .audio_features_advanced import extract_audio_features as ext_adv
                raw = ext_adv(tmp_path, offset_pct=pct)
                if raw:
                    raw['mapped_genre'] = training_genre
                    raw['sample_weight'] = 5.0 # High weight for user contributions
                    all_features.append(raw)
                    
            if all_features:
                df_new = pd.DataFrame(all_features)
                if os.path.exists(csv_path):
                    df_new.to_csv(csv_path, mode='a', header=False, index=False)
                else:
                    df_new.to_csv(csv_path, index=False)
                print(f"[bg] Added {len(all_features)} rows to custom training dataset.")
        
        if owns_tmp and tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

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
                
                # Only auto-tag if genre wasn't provided or was analyzing
                # (skip when no classifier produced a genre, never save "unknown")
                if genre and (not song.genre or song.genre == "analyzing..."):
                    song.genre = genre
                    song.tags = f"{genre},{mood},{language}"
                elif not genre:
                    if (song.genre or "").strip().lower() == "analyzing...":
                        song.genre = ""
                    if (song.tags or "").strip().lower() == "analyzing...":
                        song.tags = ""

                song.mood = mood or ""
                song.language = language
                bg_session.add(song)
                bg_session.commit()
                print(f"[bg] Song {song_id} updated in DB.")
    except Exception as e:
        print(f"[bg] Feature extraction failed for song {song_id}: {e}")
        if owns_tmp and tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ============================================================
# Internal analysis endpoint (called by the Spring backend)
# ============================================================

_LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}


def _decode_to_wav(path: str) -> str:
    """Decode any ffmpeg-readable audio (m4a/mp3/...) to a temp mono 22.05 kHz WAV.

    librosa 1.x no longer decodes compressed formats via audioread, so the CNN needs a WAV.
    Caller deletes the returned file.
    """
    import subprocess
    fd, wav = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    res = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", path, "-ac", "1", "-ar", "22050", "-f", "wav", wav],
        stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=120,
    )
    if res.returncode != 0 or os.path.getsize(wav) == 0:
        os.remove(wav)
        raise RuntimeError(f"ffmpeg decode failed: {res.stderr.decode(errors='replace')[-300:]}")
    return wav


def _analyze_file(path: str) -> dict:
    """Blocking: extract features + genre/mood. Does not touch the DB."""
    # The embedding model decodes the original file itself (48 kHz, as in training).
    emb_genre, _ = _embedding_genre(path)
    wav = None
    if os.path.splitext(path)[1].lower() not in (".wav", ".flac", ".ogg"):
        wav = _decode_to_wav(path)
    try:
        return _analyze_decoded(wav or path, emb_genre)
    finally:
        if wav and os.path.exists(wav):
            os.remove(wav)


def _analyze_decoded(path: str, emb_genre: str = None) -> dict:
    features = extract_audio_features(path)
    genre = None
    model = "none"
    all_scores = {}
    if emb_genre:
        genre = emb_genre
        model = "panns-lr"
    elif cnn_classifier:
        pred = cnn_classifier.predict(path)
        genre = pred.get('genre') or None
        all_scores = pred.get('all_probs') or {}
        model = "cnn" if genre else "none"
    else:
        genre, details = genre_classifier.classify_genre(path)
        all_scores = (details or {}).get('all_scores', {})
        model = "v4" if genre else "none"
    if genre and all_scores:
        # Top-1, plus the runner-up only when it is clearly present (prob >= 0.35).
        genre = format_genre_label(all_scores) or genre

    from .audio_features import categorize_genre_and_mood_rule_based
    primary = genre.split(", ")[0] if genre else None
    _, mood = categorize_genre_and_mood_rule_based(features, override_genre=primary)

    import math

    def _f(k):
        try:
            v = float(features.get(k, 0.0) or 0.0)
        except (TypeError, ValueError):
            return 0.0
        return v if math.isfinite(v) else 0.0

    def _i(k):
        v = features.get(k)
        if v is None:
            return None
        try:
            fv = float(v)
        except (TypeError, ValueError):
            return None
        return int(fv) if math.isfinite(fv) else None

    return {
        "features": {
            "tempo": _f("tempo"), "energy": _f("energy"),
            "danceability": _f("danceability"), "valence": _f("valence"),
            "acousticness": _f("acousticness"),
            "instrumentalness": _f("instrumentalness"),
            "key": _i("key"), "mode": _i("mode"),
        },
        "genre": genre,
        "mood": mood or None,
        "model": model,
    }


@app.post("/internal/analyze")
async def internal_analyze(request: Request, file: UploadFile = File(None)):
    """Analyze an uploaded audio file. Internal use only; no DB writes."""
    import hmac
    from fastapi.responses import JSONResponse
    from starlette.concurrency import run_in_threadpool

    token = os.getenv("INTERNAL_API_TOKEN", "")
    if token:
        supplied = request.headers.get("X-Internal-Token", "")
        if not hmac.compare_digest(supplied.encode(), token.encode()):
            return JSONResponse({"error": "invalid internal token"}, status_code=401)
    else:
        host = request.client.host if request.client else ""
        if host not in _LOOPBACK_HOSTS:
            return JSONResponse({"error": "loopback only"}, status_code=403)

    if file is None:
        return JSONResponse({"error": "missing file"}, status_code=400)
    max_bytes = 100 * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        return JSONResponse({"error": "file too large (max 100 MB)"}, status_code=413)
    if not data:
        return JSONResponse({"error": "empty file"}, status_code=400)

    ext = os.path.splitext(file.filename or "")[1] or ".mp3"
    tmp_path = None
    try:
        def _write_tmp():
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(data)
                return tmp.name
        tmp_path = await run_in_threadpool(_write_tmp)
        try:
            result = await run_in_threadpool(_analyze_file, tmp_path)
        except Exception as e:
            return JSONResponse({"error": f"analysis failed: {e}"}, status_code=500)
        return result
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

# ============================================================
# Album Management Endpoints
# ============================================================

@app.post("/api/albums", response_model=AlbumRead)
def create_album(
    album: AlbumCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role("artist"))
):
    """Create a new album for the currently authenticated artist."""
    # Look up the ArtistProfile to get the correct ArtistID
    artist_profile = session.exec(select(ArtistProfile).where(ArtistProfile.user_id == current_user.id)).first()
    if not artist_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist profile not found for the current user."
        )

    db_album = Album(
        title=album.title,
        artist_id=artist_profile.id,
        cover_art_url=album.cover_art_url
    )
    session.add(db_album)
    session.commit()
    session.refresh(db_album)
    return db_album

@app.get("/api/artists/{artist_id}/albums", response_model=list[AlbumRead])
def get_artist_albums(
    artist_id: UUID,
    session: Session = Depends(get_session)
):
    """Get all albums for a specific artist. Fallback to UserID if ArtistID returns nothing."""
    print(f"[DEBUG] Fetching albums for artist_id: {artist_id}")
    albums = session.exec(select(Album).where(Album.artist_id == artist_id)).all()
    
    # Workaround: If no albums found, check if the ID passed was actually a UserID 
    # (this happens because the C# Razor view is cached and still sending UserID)
    if not albums:
        profile = session.exec(select(ArtistProfile).where(ArtistProfile.user_id == artist_id)).first()
        if profile:
            albums = session.exec(select(Album).where(Album.artist_id == profile.id)).all()
            
    print(f"[DEBUG] Found {len(albums)} albums: {albums}")
    return albums

@app.get("/api/albums/{album_id}", response_model=AlbumRead)
def get_album(
    album_id: UUID,
    session: Session = Depends(get_session)
):
    """Get album by ID."""
    album = session.get(Album, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album


@app.post("/songs/{song_id}/extract")
def trigger_extraction(
    song_id: UUID,
    session: Session = Depends(get_session)
):
    """Trigger background feature extraction for an existing song."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
        
    _extract_and_update(song.id, "")
    return {"status": "Extraction completed"}

@app.post("/songs/upload", response_model=SongRead)
async def upload_song(
    file: UploadFile = File(...),
    cover_art_file: UploadFile = File(None),
    title: str = Form(...),
    artist: str = Form(...),
    collab_artists: str = Form(default=""),
    album: str = Form(default=""),
    album_id: str = Form(default=""),
    cover_art_url: str = Form(default=""),
    release_date: str = Form(default=""),
    credits: str = Form(default=""),
    lyrics: str = Form(default=""),
    custom_genre: str = Form(default=""),
    training_genre: str = Form(default=""),
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Upload a song file. Saves immediately and returns fast.
    Feature extraction (genre/mood/tempo) runs in the background.
    """
    try:
        file_data = await file.read()
        cover_art_data = await cover_art_file.read() if cover_art_file else None
        
        parsed_album_id = UUID(album_id) if album_id else None
        parsed_release_date = datetime.fromisoformat(release_date) if release_date else datetime.utcnow()
        
        # Inherit cover art from album if none provided
        if not cover_art_data and not cover_art_url and parsed_album_id:
            db_album = session.get(Album, parsed_album_id)
            if db_album:
                cover_art_data = db_album.cover_art_data
                cover_art_url = db_album.cover_art_url
        
        # Determine the user ID based on current_user
        user_uuid = current_user.id if current_user else None

        song = Song(
            source="upload",
            title=title,
            artist=artist,
            collab_artists=collab_artists,
            album=album,
            album_id=parsed_album_id,
            file_data=file_data,
            cover_art_url=cover_art_url,
            cover_art_data=cover_art_data,
            release_date=parsed_release_date,
            credits=credits,
            lyrics=lyrics,
            user_id=user_uuid,
            duration_ms=0,
            tempo=0.0, energy=0.0, danceability=0.0,
            valence=0.0, acousticness=0.0, instrumentalness=0.0,
            key=0, mode=0,
            genre=custom_genre if custom_genre else "analyzing...",
            mood="analyzing...",
            tags="analyzing...",
        )
        session.add(song)
        session.commit()
        session.refresh(song)

        t = threading.Thread(
            target=_extract_and_update,
            args=(song.id, training_genre),
            daemon=True
        )
        t.start()

        return song
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error uploading song: {str(e)}")


@app.post("/songs/test_upload")
def test_upload(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """
    Test upload: analyze the song synchronously and return results without saving to DB.
    Plain def so FastAPI runs it in the threadpool (heavy analysis must not block the loop).
    """
    tmp_path = None
    try:
        file_data = file.file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
        
        print(f"[test_upload] Testing file: {tmp_path}")
        # 1. Base features
        features = extract_audio_features(tmp_path)
        
        # 2. Genre Extraction
        if cnn_classifier:
            pred = cnn_classifier.predict(tmp_path)
            primary_genre = pred['genre']
            all_scores = pred['all_probs']
        else:
            primary_genre, details = genre_classifier.classify_genre(tmp_path)
            all_scores = details.get('all_scores', {})
            
        genre = primary_genre
        if all_scores:
            high_conf_genres = [g for g, score in all_scores.items() if score > 0.2]
            if high_conf_genres:
                genre = ", ".join(high_conf_genres)
                
        # 3. Extract Mood using the AI Genre as context
        from .audio_features import categorize_genre_and_mood_rule_based
        _, mood = categorize_genre_and_mood_rule_based(features, override_genre=primary_genre)
                
        # 4. Language
        language = detect_language(tmp_path)
        
        print(f"[test_upload] Results -> Genre: {genre}, Mood: {mood}, Language: {language}")
        
        return {
            "genre": genre,
            "mood": mood,
            "language": language,
            "genre_scores": all_scores,
            "success": True
        }
    except Exception as e:
        print(f"[test_upload] Error: {e}")
        raise HTTPException(status_code=400, detail=f"Error in test upload: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.get("/songs/{song_id}/features")
def get_song_features(song_id: UUID, session: Session = Depends(get_session)):
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
    """List all uploaded songs (metadata only, heavy BLOBs deferred for fast loading)."""
    from sqlalchemy.orm import defer
    songs = session.exec(
        select(Song).options(defer(Song.file_data), defer(Song.cover_art_data))
    ).all()
    return songs


@app.delete("/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_song(song_id: UUID, session: Session = Depends(get_session)):
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    session.delete(song)
    session.commit()
    return




@app.get("/songs/{song_id}", response_model=SongRead)
def get_song(song_id: UUID, session: Session = Depends(get_session)):
    """Get a song by ID."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    return song



@app.get("/songs/{song_id}/stream")
def stream_song(song_id: UUID, session: Session = Depends(get_session)):
    """Stream an uploaded song audio file from disk or database for web playback with Range support."""
    import urllib.parse
    import io
    from fastapi.responses import StreamingResponse, FileResponse, Response

    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")

    # If the file exists directly on disk, use FileResponse for instant Range/seeking support
    if song.file_path and os.path.exists(song.file_path):
        return FileResponse(
            song.file_path,
            media_type="audio/mpeg",
            filename=f"song_{song_id}.mp3"
        )

    if not song.file_data:
        raise HTTPException(status_code=404, detail="Audio file data not found in database")

    # Use ASCII-only safe filename in header to strictly adhere to RFC latin-1 requirements
    safe_title = urllib.parse.quote(f"{song.title or song_id}.mp3")
    return StreamingResponse(
        io.BytesIO(song.file_data),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="song_{song_id}.mp3"; filename*=UTF-8\'\'{safe_title}',
            "Accept-Ranges": "bytes"
        }
    )


DEFAULT_COVER_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#282828">'
    '<rect width="100" height="100" rx="10"/>'
    '<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="38" fill="#555">&#9835;</text>'
    '</svg>'
)

@app.get("/songs/{song_id}/cover")
def get_song_cover(song_id: UUID, session: Session = Depends(get_session)):
    """Return album art cover image for a song with browser caching."""
    from fastapi.responses import Response, FileResponse
    song = session.get(Song, song_id)
    if not song:
        return Response(content=DEFAULT_COVER_SVG, media_type="image/svg+xml", headers={"Cache-Control": "public, max-age=86400"})

    if song.cover_art_data:
        return Response(
            content=song.cover_art_data,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=604800, immutable"}
        )

    if song.cover_art_url and os.path.exists(song.cover_art_url):
        return FileResponse(
            song.cover_art_url,
            headers={"Cache-Control": "public, max-age=604800, immutable"}
        )

    return Response(
        content=DEFAULT_COVER_SVG,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=86400"}
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
def smart_shuffle(request: SmartShuffleRequest, session: Session = Depends(get_session)):
    """
    Smart Shuffle endpoint.
    Accepts a single song_id or a list of playlist_song_ids.
    Returns similar song recommendations using the ML Acoustic Recommendation Engine.
    """
    # 1. Determine the input seed(s)
    seed_ids = []
    if request.playlist_song_ids and len(request.playlist_song_ids) > 0:
        seed_ids = request.playlist_song_ids
    elif request.song_id:
        seed_ids = [request.song_id]
    else:
        raise HTTPException(status_code=400, detail="Must provide either song_id or playlist_song_ids")
        
    # 2. Fetch the seed songs to build the 'Vibe'
    seed_songs = session.exec(select(Song).where(Song.id.in_(seed_ids))).all()
    if not seed_songs:
        raise HTTPException(status_code=404, detail="Seed songs not found in database")
        
    playlist_vectors = np.array([
        [s.tempo, s.energy, s.danceability, s.valence, s.acousticness, s.instrumentalness]
        for s in seed_songs
    ])
    
    # 3. Fetch candidate songs (all other songs)
    candidate_songs = session.exec(select(Song).where(Song.id.not_in(seed_ids))).all()
    if not candidate_songs:
        # If there are no other songs, just return an empty list
        return SmartShuffleResponse(song_ids=[])
        
    candidate_vectors = np.array([
        [s.tempo, s.energy, s.danceability, s.valence, s.acousticness, s.instrumentalness]
        for s in candidate_songs
    ])
    candidate_ids = [s.id for s in candidate_songs]
    
    # 4. Generate recommendations using KNN Cosine Similarity
    recommendations = recommendation_service.get_smart_shuffle(
        playlist_vectors=playlist_vectors,
        candidate_vectors=candidate_vectors,
        candidate_ids=candidate_ids,
        n_recommendations=3  # User asked for "after 3 songs" or similar, returning top 3 is safe
    )
    
    return SmartShuffleResponse(song_ids=recommendations)


@app.get('/api/knn-projection', response_model=KnnProjectionResponse)
def get_knn_projection(
    seed_id: str | None = None,
    k_neighbors: int = 5,
    session: Session = Depends(get_session)
):
    """
    Computes 2D PCA feature projections for songs in the database (or synthetic demonstration set)
    and highlights KNN nearest neighbors for the specified seed track or vibe.
    """
    from sklearn.decomposition import PCA
    from sklearn.neighbors import NearestNeighbors

    songs = session.exec(select(Song)).all()

    # Synthetic demo generator if database has fewer than 5 songs
    if len(songs) < 5:
        np.random.seed(42)
        demo_points = []
        genres_list = ['Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Indie', 'Jazz']
        
        playlist_vecs = np.random.rand(3, 6)
        playlist_vecs[:, 0] = np.random.normal(0.8, 0.05, 3)
        playlist_vecs[:, 1] = np.random.normal(0.2, 0.05, 3)
        
        cand_vecs = np.random.rand(30, 6)
        all_vecs = np.vstack([playlist_vecs, cand_vecs])
        
        pca = PCA(n_components=2)
        pca_res = pca.fit_transform(all_vecs)
        
        vibe_vec = np.mean(playlist_vecs, axis=0).reshape(1, -1)
        knn = NearestNeighbors(metric='cosine', algorithm='brute')
        knn.fit(cand_vecs)
        k_count = min(k_neighbors, len(cand_vecs))
        dists, indices = knn.kneighbors(vibe_vec, n_neighbors=k_count)
        neighbor_indices = set(indices[0])

        for i in range(len(playlist_vecs)):
            demo_points.append(KnnProjectionPoint(
                id=f"seed-{i+1}",
                title=f"Seed Track {i+1}",
                artist="Demo Artist",
                genre=genres_list[i % len(genres_list)],
                x=float(pca_res[i, 0]),
                y=float(pca_res[i, 1]),
                type="seed",
                energy=float(playlist_vecs[i, 1]),
                valence=float(playlist_vecs[i, 3])
            ))
            
        for idx in range(len(cand_vecs)):
            global_idx = idx + len(playlist_vecs)
            is_neighbor = idx in neighbor_indices
            demo_points.append(KnnProjectionPoint(
                id=f"song-{idx+1}",
                title=f"Acoustic Track {idx+1}",
                artist=f"Artist {(idx % 5) + 1}",
                genre=genres_list[idx % len(genres_list)],
                x=float(pca_res[global_idx, 0]),
                y=float(pca_res[global_idx, 1]),
                type="neighbor" if is_neighbor else "candidate",
                energy=float(cand_vecs[idx, 1]),
                valence=float(cand_vecs[idx, 3])
            ))

        vibe_pca = pca.transform(vibe_vec)[0]
        return KnnProjectionResponse(
            points=demo_points,
            vibe_x=float(vibe_pca[0]),
            vibe_y=float(vibe_pca[1]),
            k_neighbors=k_count
        )

    # Real DB songs
    song_vectors = np.array([
        [s.tempo, s.energy, s.danceability, s.valence, s.acousticness, s.instrumentalness]
        for s in songs
    ])
    
    pca = PCA(n_components=2)
    pca_2d = pca.fit_transform(song_vectors)

    seed_idx = 0
    if seed_id:
        for i, s in enumerate(songs):
            if str(s.id) == seed_id:
                seed_idx = i
                break

    seed_vec = song_vectors[seed_idx].reshape(1, -1)
    
    # Exclude seed from candidates
    cand_mask = np.ones(len(songs), dtype=bool)
    cand_mask[seed_idx] = False
    
    cand_vectors = song_vectors[cand_mask]
    cand_indices = np.where(cand_mask)[0]

    knn = NearestNeighbors(metric='cosine', algorithm='brute')
    knn.fit(cand_vectors)
    k_count = min(k_neighbors, len(cand_vectors))
    dists, indices = knn.kneighbors(seed_vec, n_neighbors=k_count)
    neighbor_global_indices = set(cand_indices[indices[0]])

    points = []
    for i, s in enumerate(songs):
        pt_type = "candidate"
        if i == seed_idx:
            pt_type = "seed"
        elif i in neighbor_global_indices:
            pt_type = "neighbor"
            
        points.append(KnnProjectionPoint(
            id=str(s.id),
            title=s.title or s.file_name,
            artist=s.artist or "Unknown Artist",
            genre=s.genre or "Pop",
            x=float(pca_2d[i, 0]),
            y=float(pca_2d[i, 1]),
            type=pt_type,
            energy=float(s.energy),
            valence=float(s.valence)
        ))

    vibe_pt = pca_2d[seed_idx]
    return KnnProjectionResponse(
        points=points,
        vibe_x=float(vibe_pt[0]),
        vibe_y=float(vibe_pt[1]),
        k_neighbors=k_count
    )



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


def parse_frontend_song_id(song_id: str) -> UUID:
    try:
        return UUID(str(song_id))
    except (ValueError, AttributeError):
        try:
            s_int = int(song_id)
            return UUID(int=s_int)
        except ValueError:
            return UUID("00000000-0000-0000-0000-000000000011")

@app.post("/songs/{song_id}/comments", response_model=CommentRead)
def create_comment(
    song_id: str,
    comment: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    s_uuid = parse_frontend_song_id(song_id)
    
    from sqlalchemy import text
    song_exists = session.execute(
        text("SELECT 1 FROM Songs WHERE SongID = :sid"),
        {"sid": str(s_uuid)}
    ).fetchone()
    
    if not song_exists:
        try:
            session.execute(
                text("""
                    INSERT INTO Songs (SongID, Title, ArtistName, FilePath)
                    VALUES (:sid, :title, :artist, :filepath)
                """),
                {
                    "sid": str(s_uuid),
                    "title": f"Track {song_id}",
                    "artist": "Demo Artist",
                    "filepath": f"/music/track{song_id}.mp3"
                }
            )
            session.commit()
        except Exception:
            session.rollback()

    db_comment = Comment(
        user_id=current_user.id,
        song_id=s_uuid,
        timestamp_ms=comment.timestamp_ms,
        content=comment.content
    )
    session.add(db_comment)
    try:
        session.commit()
        session.refresh(db_comment)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_comment


@app.get("/songs/{song_id}/comments", response_model=list[CommentRead])
def get_comments(song_id: str, session: Session = Depends(get_session)):
    s_uuid = parse_frontend_song_id(song_id)
    comments = session.exec(select(Comment).where(Comment.song_id == s_uuid).order_by(Comment.timestamp_ms)).all()
    return comments


# ============================================================
# Playlist & Song Downloader Endpoints (spotDL -> Spotifake DB)
# ============================================================

from pydantic import BaseModel as _PydanticBaseModel
from fastapi.staticfiles import StaticFiles

class DownloadRequest(_PydanticBaseModel):
    query: str


@app.post("/api/downloader/download")
def start_download_job(req: DownloadRequest):
    """Start an asynchronous playlist/song download job using spotDL."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    from .downloader_service import create_download_job
    job_id = create_download_job(req.query.strip())
    return {"job_id": job_id, "query": req.query.strip(), "status": "pending"}


@app.get("/api/downloader/jobs")
def get_download_jobs():
    """List recent download jobs and their statuses."""
    from .downloader_service import list_jobs
    return list_jobs()


@app.get("/api/downloader/jobs/{job_id}")
def get_download_job(job_id: str):
    """Get status and logs for a download job."""
    from .downloader_service import get_job
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/downloader/jobs/{job_id}/events")
async def stream_job_events_endpoint(job_id: str):
    """Real-time SSE event stream for live download progress."""
    from .downloader_service import stream_job_events
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        stream_job_events(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/")
def get_root_page():
    """Serve the main Spotifake music platform web app."""
    index_html = os.path.join(os.path.dirname(__file__), "..", "WebClient", "index.html")
    if os.path.exists(index_html):
        return FileResponse(index_html)
    raise HTTPException(status_code=404, detail="index.html not found")


@app.get("/downloader")
def get_downloader_page():
    """Serve the Web UI for the playlist downloader."""
    downloader_html = os.path.join(os.path.dirname(__file__), "..", "WebClient", "downloader.html")
    if os.path.exists(downloader_html):
        return FileResponse(
            downloader_html,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    raise HTTPException(status_code=404, detail="downloader.html not found")


webclient_dir = os.path.join(os.path.dirname(__file__), "..", "WebClient")
if os.path.exists(webclient_dir):
    app.mount("/web", StaticFiles(directory=webclient_dir, html=True), name="web")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

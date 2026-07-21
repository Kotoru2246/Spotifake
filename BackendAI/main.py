from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Form, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from uuid import UUID
import asyncio
import numpy as np
import jwt
import bcrypt
from sqlmodel import Session, select
from .schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, SmartShuffleRequest, SmartShuffleResponse
from .spotify_integration import SpotifyIntegration
from .callback_server import start_callback_server, stop_callback_server, get_auth_code, reset_auth_code
from .db import engine
from .models import Song, SongCreate, SongRead, User, UserCreate, UserRead
from .upload_handler import process_uploaded_song
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
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    # Verify user exists in database
    db_user = session.get(User, user_id)
    if not db_user or db_user.username != username or db_user.account_status != "Active":
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
    """Verify username/password against database and issue a JWT."""
    # Find user by username
    db_user = session.exec(select(User).where(User.username == request.username)).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Verify password
    if not bcrypt.checkpw(request.password.encode("utf-8"), db_user.password_hash.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Check account status
    if db_user.account_status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact an administrator.",
        )

    # If role specified, verify it matches
    if request.role and request.role != db_user.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account type does not match the selected role",
        )

    # Generate JWT
    access_token, expires_in = create_access_token(db_user.id, db_user.username, db_user.role)

    return LoginResponse(
    access_token=access_token,
    token_type="bearer",
    username=db_user.username,
    role=db_user.role,
    user_id=str(db_user.id),
    expires_in=expires_in,
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
    Upload a song file and extract audio features.
    
    Returns the created song with extracted features.
    """
    try:
        # Process upload and extract features
        song_create = await process_uploaded_song(file, title, artist, album)
        
        # Save to database using plain Python values
        song = Song(**song_create.model_dump())
        session.add(song)
        session.commit()
        session.refresh(song)
        
        return song
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error uploading song: {str(e)}")


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
def list_songs(session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    """List all uploaded songs."""
    songs = session.exec(select(Song)).all()
    return songs


@app.get("/songs/{song_id}", response_model=SongRead)
def get_song(song_id: int, session: Session = Depends(get_session), current_user=Depends(get_current_user)):
    """Get a song by ID."""
    song = session.get(Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    return song


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

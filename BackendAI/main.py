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
from sqlmodel import Session, select
from .schemas import LoginRequest, LoginResponse, SmartShuffleRequest, SmartShuffleResponse
from .spotify_integration import SpotifyIntegration
from .callback_server import start_callback_server, stop_callback_server, get_auth_code, reset_auth_code
from .db import create_db_and_tables, engine
from .models import Song, SongCreate, SongRead
from .upload_handler import save_upload_file
from .audio_features import categorize_genre_and_mood, extract_audio_features
from .essentia_client import classify_with_features
import tempfile
import os

app = FastAPI(title="Music Player AI Bridge")
spotify = SpotifyIntegration()
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "spotifake-dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

TEST_USERS = {
    "user_test": {"password": "User@123", "role": "user"},
    "artist_test": {"password": "Artist@123", "role": "artist"},
    "admin_test": {"password": "Admin@123", "role": "admin"},
}

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
create_db_and_tables()


def get_session():
    """Database session dependency."""
    with Session(engine) as session:
        yield session


def create_access_token(username: str, role: str) -> tuple[str, int]:
    """Create a signed JWT for the authenticated user."""
    expires_in = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload = {
        "sub": username,
        "role": role,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires_in


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate the Bearer token and return the decoded user claims."""
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
    role = payload.get("role")

    if not username or username not in TEST_USERS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected_role = TEST_USERS[username]["role"]
    if role != expected_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token role",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"username": username, "role": role}


@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Verify username/password and issue a JWT for the client."""
    user = TEST_USERS.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if request.role and request.role != user["role"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account type does not match the selected role",
        )

    access_token, expires_in = create_access_token(request.username, user["role"])
    return LoginResponse(
        access_token=access_token,
        username=request.username,
        role=user["role"],
        expires_in=expires_in,
    )

# Start the callback server when the app starts
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

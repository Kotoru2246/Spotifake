# BackendAI Service

This FastAPI service is the AI bridge for the modern music player with Spotify integration.

## Features

- Accept a seed `SongID` from the desktop client
- Query ChromaDB vector data for nearest neighbor tracks
- Apply anti-fatigue rules
- Return a list of recommended `SongID` values
- **Spotify Integration**: Fetch user's liked tracks, playlists, and audio features
- **Smart Shuffle AI**: Generate recommendations based on audio feature similarity

## Setup

1. Create a Python virtual environment:
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Spotify API credentials in `.env`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://localhost:8888/callback
```

## Run

```bash
uvicorn BackendAI.main:app --reload --port 8000
```

## API Endpoints

### Health Check
- `GET /health` - Service status

### Spotify Authentication
- `GET /spotify/auth-url` - Get OAuth authentication URL
- `POST /spotify/authenticate?code=AUTH_CODE` - Complete OAuth flow

### Spotify Data
- `GET /spotify/tracks?limit=50` - Get user's liked tracks
- `GET /spotify/playlists?limit=20` - Get user's playlists
- `GET /spotify/playlist/{playlist_id}/tracks` - Get playlist tracks
- `GET /spotify/track/{track_id}/features` - Get track audio features

### Smart Shuffle (AI)
- `POST /api/smart-shuffle` - Get recommendations for a seed track

## Interactive API Documentation

Visit http://127.0.0.1:8000/docs for Swagger UI with all endpoints.

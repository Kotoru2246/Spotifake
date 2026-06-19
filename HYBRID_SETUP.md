# Spotifake Hybrid Architecture (Python + Node.js)

## Overview

Spotifake now uses a **hybrid architecture** combining:
- **Python FastAPI** for backend audio processing & database management
- **Node.js + Essentia.js** for advanced music genre classification

This hybrid approach provides:
- ✓ Accurate ML-based genre classification (Essentia.js)
- ✓ Fast audio feature extraction (librosa in Python)
- ✓ Fallback to rule-based classification if Essentia service is down
- ✓ Clean separation of concerns

## Architecture Diagram

```
┌─────────────────┐
│  React Frontend │
│  (Browser/Web)  │
└────────┬────────┘
         │
         ├──────────────┬────────────────┐
         │              │                │
    Upload File   Get Status      Stream Audio
         │              │                │
    (HTTP)         (HTTP)           (HTTP)
         │              │                │
    ┌────┴──────────────┴────────────────┴─────┐
    │       FastAPI Backend                    │
    │     (Python on :8000)                    │
    │  - Song Management                       │
    │  - Feature Extraction (librosa)          │
    │  - Recommendations                       │
    │  - Spotify Integration                   │
    └────────┬─────────────────────────────────┘
             │
        POST /classify
        (file_path)
             │
    ┌────────┴───────────────────────────┐
    │   Essentia.js Service              │
    │   (Node.js on :3000)               │
    │  - Genre Classification (ML)       │
    │  - Mood Detection                  │
    │  - Audio Tag Extraction            │
    └────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 14+** (for Essentia service)
- **npm** (for Node dependencies)

### Step 1: Install & Run Essentia Service

```bash
cd EssentiaService

# Install dependencies
npm install

# Start the service
npm start
```

Expected output:
```
✓ Essentia.js Classification Service running on http://localhost:3000
  - Health check: GET http://localhost:3000/health
  - Classify: POST http://localhost:3000/classify
  - Batch: POST http://localhost:3000/batch-classify
```

**Keep this terminal open** - the Essentia service must be running for genre classification.

### Step 2: Install & Run Python Backend

In a **new terminal**:

```bash
cd BackendAI

# Install Python dependencies
pip install -r requirements.txt

# Start the backend
python start_backend.py
# OR
uvicorn main:app --reload --port 8000
```

Expected output:
```
Callback server started on http://127.0.0.1:8888
✓ Classified with Essentia: genre=rock, mood=energetic
INFO:     Application startup complete.
```

### Step 3: Test the Integration

```bash
# Check Essentia health
curl http://localhost:3000/health

# Check Backend health  
curl http://localhost:8000/health

# Upload a test song
curl -X POST "http://localhost:8000/songs/upload" \
  -F "file=@sample.mp3" \
  -F "title=Test Song" \
  -F "artist=Test Artist" \
  -F "album=Test Album"
```

## How It Works

### Upload Flow

1. **User uploads MP3 file** → FastAPI `/songs/upload` endpoint
2. **Features extracted** with librosa (tempo, energy, danceability, etc.)
3. **Classification request** sent to Essentia service
4. **Essentia analyzes** audio with ML models → returns genre + confidence + tags
5. **Result stored** in database with both librosa + Essentia features
6. **Response sent** to frontend with complete metadata

### Fallback Behavior

If Essentia service is **unavailable**:
- Audio feature extraction ✓ (continues normally)
- Genre classification uses rule-based fallback ✓
- Song is saved with confidence = lower
- Print warning: `⚠ Essentia service unavailable, using fallback classification`

Configure with `.env` variable:
```
ESSENTIA_USE_FALLBACK=true  # Enable fallback (default)
ESSENTIA_USE_FALLBACK=false # Raise error if unavailable
```

## API Endpoints

### Python Backend (FastAPI)

```
GET  /health                          - Service status
GET  /docs                            - Interactive API docs

POST /songs/upload                    - Upload & classify
  Form: file, title, artist, album
  Returns: Song with genre, mood, features

GET  /songs                           - List all songs
GET  /songs/{id}                      - Get song by ID
POST /recommendations/hybrid          - Get recommendations
```

### Node.js Service (Essentia)

```
GET  /health                          - Service status
GET  /genres                          - List supported genres

POST /classify                        - Classify single file
  Body: { "file_path": "uploads/song.mp3" }
  Returns: { genre, confidence, tags, features }

POST /batch-classify                  - Classify multiple files
  Body: { "files": ["path1.mp3", "path2.mp3"] }
  Returns: { results: [...] }
```

## Supported Genres

The Essentia service classifies into these genres:

```
acoustic, ambient, blues, classical, country, dance, edm, electronic,
folk, funk, hip-hop, indie, jazz, metal, pop, reggae, rock, soul
```

## Environment Configuration

### Python Backend (.env)

```bash
# Essentia Service Integration
ESSENTIA_SERVICE_URL=http://127.0.0.1:3000    # Essentia Node service URL
ESSENTIA_USE_FALLBACK=true                     # Use rule-based if service down

# Spotify Integration
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret

# Database
DATABASE_URL=sqlite:///./backendai.db

# Server
BACKEND_PORT=8000
```

### Node.js Service (.env)

```bash
# Server Configuration
ESSENTIA_PORT=3000
NODE_ENV=development

# Backend Integration (optional)
BACKEND_URL=http://127.0.0.1:8000
```

## Development Tips

### Hot Reload

**Python (FastAPI):**
```bash
uvicorn main:app --reload --port 8000
```

**Node.js (with nodemon):**
```bash
npm install --save-dev nodemon
npm run dev
```

### Debug Mode

**Python:**
```bash
# Add to audio_features.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Node.js:**
```bash
DEBUG=essentia-service:* npm start
```

### Test Essentia Service

```bash
# From EssentiaService directory
node -e "const client = require('./genre-classifier'); console.log(client.getSupportedGenres())"
```

### Test Python Integration

```bash
# From BackendAI directory
python -c "from essentia_client import is_service_available; print('Available:', is_service_available())"
```

## Troubleshooting

### "Cannot connect to Essentia service"

- [ ] Is Node.js service running on port 3000?
- [ ] Check: `curl http://localhost:3000/health`
- [ ] Try restarting: `npm start` in `EssentiaService/`
- [ ] Check port conflicts: `netstat -ano | findstr :3000`

### "Essentia classification failed"

- [ ] Check file path is valid
- [ ] Check file is readable (not corrupted)
- [ ] Check Node.js service logs
- [ ] Try manual test: `curl -X POST http://localhost:3000/classify -H "Content-Type: application/json" -d '{"file_path":"uploads/test.mp3"}'`

### "Classification slow"

- Essentia analyzes the **entire audio file** - large files take time
- Typical: 10-30 seconds for 5MB MP3
- Can parallelize with `/batch-classify` endpoint

### Using Fallback Classification

```python
# Force fallback for testing
from essentia_client import classify_audio

genre, data = classify_audio("uploads/song.mp3")
# Returns: (None, None) if fallback used
# Then categorize_genre_and_mood() uses rule-based
```

## Performance Metrics

| Operation | Time | Service |
|-----------|------|---------|
| Load audio | ~1s | librosa (Python) |
| Extract 9 features | ~2s | librosa |
| Classify genre (ML) | ~10-20s | Essentia.js |
| Store to DB | <100ms | SQLite |
| **Total** | **~15-25s** | Both |

Rule-based fallback: ~5-8s total

## Production Deployment

For production, consider:

1. **Docker Compose** - Run both services in containers
2. **Load balancer** - Route to multiple Essentia instances
3. **Queue system** - Use Celery/RabbitMQ for async classification
4. **Cache** - Store results for repeated uploads
5. **Monitoring** - Health checks + metrics

Example `docker-compose.yml`:

```yaml
version: '3'
services:
  essentia:
    build: ./EssentiaService
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ESSENTIA_PORT=3000
  
  backend:
    build: ./BackendAI
    ports:
      - "8000:8000"
    environment:
      - ESSENTIA_SERVICE_URL=http://essentia:3000
      - DATABASE_URL=postgresql://...
    depends_on:
      - essentia
```

## File Structure

```
Spotifake/
├── BackendAI/
│   ├── audio_features.py          # Updated: calls Essentia
│   ├── essentia_client.py          # NEW: Python client for Essentia
│   ├── upload_handler.py           # Updated: passes file_path
│   ├── requirements.txt            # Updated: added requests
│   └── ...
│
├── EssentiaService/                # NEW: Node.js service
│   ├── server.js                   # Express API server
│   ├── genre-classifier.js         # Essentia classification logic
│   ├── package.json                # Node dependencies
│   ├── .env                        # Environment config
│   └── .gitignore
│
└── README.md                       # This file
```

## Next Steps

1. ✓ Hybrid system running
2. → Build React frontend to upload songs
3. → Test genre classification accuracy
4. → Add user authentication
5. → Implement caching for recommendations
6. → Deploy to production

## Support

For issues with:
- **Python backend**: Check FastAPI logs + essentia_client.py
- **Essentia service**: Check Node.js console + genre-classifier.js
- **Integration**: Check both services are running (`curl /health`)

Happy classifying! 🎵

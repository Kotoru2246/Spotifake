# Essentia.js Classification Service

Advanced music genre classification service using Essentia.js pre-trained ML models.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Start Service

```bash
npm start
```

Service will start on `http://localhost:3000`

### Development Mode (with auto-reload)

```bash
npm install --save-dev nodemon
npm run dev
```

## API Endpoints

### Health Check

Check if service is running:

```bash
GET /health

# Response:
{
  "status": "ok",
  "service": "Essentia.js Genre Classification Service",
  "version": "1.0.0"
}
```

### Classify Audio

Classify a single audio file:

```bash
POST /classify

# Request:
{
  "file_path": "/path/to/song.mp3"
}

# Response:
{
  "file_path": "/path/to/song.mp3",
  "genre": "rock",
  "confidence": 0.85,
  "genre_scores": {
    "rock": 0.85,
    "metal": 0.12,
    "pop": 0.03
  },
  "tags": ["energetic", "acoustic"],
  "features": {
    "tempo": 145.2,
    "energy": 0.78,
    "danceability": 0.45,
    "acousticness": 0.62,
    "valence": 0.55,
    "instrumentalness": 0.12,
    "key": 7,
    "mode": 1
  },
  "timestamp": "2026-06-18T12:34:56.789Z"
}
```

### Batch Classification

Classify multiple files:

```bash
POST /batch-classify

# Request:
{
  "files": [
    "/path/to/song1.mp3",
    "/path/to/song2.mp3",
    "/path/to/song3.mp3"
  ]
}

# Response:
{
  "results": [
    {
      "file_path": "/path/to/song1.mp3",
      "genre": "rock",
      "confidence": 0.85,
      ...
    },
    {
      "file_path": "/path/to/song2.mp3",
      "genre": "pop",
      "confidence": 0.72,
      ...
    },
    ...
  ]
}
```

### Get Supported Genres

List all genres the service can classify:

```bash
GET /genres

# Response:
{
  "supported_genres": [
    "acoustic", "ambient", "blues", "classical", "country",
    "dance", "edm", "electronic", "folk", "funk", "hip-hop",
    "indie", "jazz", "metal", "pop", "reggae", "rock", "soul"
  ]
}
```

## Supported Genres

The service classifies music into these 18 genres:

- **acoustic** - Primarily acoustic instruments
- **ambient** - Background/atmospheric music
- **blues** - Blues music
- **classical** - Classical orchestral music
- **country** - Country/Americana music
- **dance** - Dance/electronic dance
- **edm** - Electronic Dance Music
- **electronic** - Electronic/synthesized music
- **folk** - Folk/traditional music
- **funk** - Funk/groove
- **hip-hop** - Hip-hop/rap
- **indie** - Indie/alternative
- **jazz** - Jazz music
- **metal** - Heavy metal
- **pop** - Pop music
- **reggae** - Reggae/dub
- **rock** - Rock music
- **soul** - Soul/R&B

## Configuration

Create a `.env` file:

```bash
# Server port
ESSENTIA_PORT=3000

# Environment
NODE_ENV=development

# Backend URL (optional)
BACKEND_URL=http://127.0.0.1:8000
```

## Architecture

### Files

- **server.js** - Express.js API server with endpoints
- **genre-classifier.js** - Genre classification logic using Essentia.js
- **package.json** - Node.js dependencies and scripts

### Genre Classification Algorithm

1. **Feature Extraction** - Essentia extracts 30+ audio features
2. **Feature Scoring** - Each genre gets a score based on features
3. **Normalization** - Scores normalized to 0-1 range
4. **Ranking** - Genres sorted by confidence
5. **Tag Detection** - Mood tags extracted from features

### Features Extracted

- **Temporal:** Tempo (BPM), beat tracking
- **Spectral:** Spectral centroid, rolloff, flux
- **MFCCs:** Mel-frequency cepstral coefficients
- **Harmonic:** Chroma, key, mode
- **Perceptual:** Energy, loudness, dynamic range
- **Tonal:** Pitch, timbre

## Usage Examples

### With curl

```bash
# Classify a file
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"file_path":"uploads/song.mp3"}'

# Check service health
curl http://localhost:3000/health

# Get genres
curl http://localhost:3000/genres
```

### With Python

```python
import requests

# Classify audio
response = requests.post(
    'http://localhost:3000/classify',
    json={'file_path': 'uploads/song.mp3'}
)

result = response.json()
print(f"Genre: {result['genre']}")
print(f"Confidence: {result['confidence']}")
print(f"Tags: {result['tags']}")
```

### With JavaScript

```javascript
// Classify audio
fetch('http://localhost:3000/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file_path: 'uploads/song.mp3' })
})
.then(r => r.json())
.then(data => {
  console.log(`Genre: ${data.genre}`);
  console.log(`Confidence: ${data.confidence}`);
  console.log(`Tags: ${data.tags.join(', ')}`);
});
```

## Performance

Typical classification times:

- **Small file** (< 1MB): ~5-10 seconds
- **Medium file** (1-5MB): ~10-20 seconds
- **Large file** (> 5MB): ~20-40 seconds

This depends on:
- Audio file size
- Audio quality (higher quality = slower)
- System CPU performance
- Node.js event loop load

## Troubleshooting

### "Cannot find module 'essentia.js'"

```bash
npm install
# or
npm install essentia.js
```

### "Port 3000 already in use"

Change the port in `.env`:

```bash
ESSENTIA_PORT=3001
```

Then start service:

```bash
npm start
```

### Service crashes on startup

Check Node.js version (requires 14+):

```bash
node --version  # Should be v14 or higher
```

Update Node.js if needed:
- Download: https://nodejs.org/

### File not found error

Ensure file paths are absolute or relative to current directory:

```bash
# Correct
{
  "file_path": "/home/user/uploads/song.mp3"
}

# Or from service directory
{
  "file_path": "../BackendAI/uploads/song.mp3"
}
```

### Low classification accuracy

- Ensure audio files are in supported formats (MP3, WAV, FLAC, OGG)
- Check audio file quality (low bitrate = less accurate)
- Genre classification is probabilistic - confidence may be low for edge cases
- Try with multiple similar songs to verify pattern

## Deployment

### Docker

```dockerfile
FROM node:16-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t essentia-service .
docker run -p 3000:3000 essentia-service
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use reverse proxy (nginx/Apache)
- [ ] Enable CORS properly
- [ ] Add rate limiting
- [ ] Set up monitoring/logging
- [ ] Use process manager (PM2)
- [ ] Enable file size limits
- [ ] Add authentication if needed

## Development

### Run in Debug Mode

```bash
DEBUG=essentia-service:* npm start
```

### Run Tests (if available)

```bash
npm test
```

### Code Style

Check with ESLint:

```bash
npm run lint
```

## Integration with Python Backend

The Essentia service integrates with Spotifake's Python FastAPI backend:

```python
from essentia_client import classify_audio

# Call from Python
genre, data = classify_audio("uploads/song.mp3")
print(f"Genre: {genre}")  # "rock"
print(f"Confidence: {data['confidence']}")  # 0.85
```

The Python backend will:
1. Extract features with librosa
2. Send file to Essentia service for genre classification
3. Combine results and store in database

## Support

For issues:
1. Check logs: `npm start` console output
2. Test health endpoint: `curl http://localhost:3000/health`
3. Verify file paths are correct
4. Check file permissions
5. Try with different audio files

## Links

- **Essentia.js:** https://essentia.upf.edu/
- **Node.js:** https://nodejs.org/
- **Express.js:** https://expressjs.com/

## License

MIT

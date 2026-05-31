from fastapi import FastAPI, HTTPException
from uuid import UUID
from .schemas import SmartShuffleRequest, SmartShuffleResponse

app = FastAPI(title="Music Player AI Bridge")

# Placeholder neighbor map for demo and local testing.
# Replace this with real ChromaDB queries and vector similarity when ready.
# To integrate ChromaDB, add 'chromadb' to requirements.txt and import:
#   import chromadb
#   client = chromadb.Client()
#   collection = client.get_or_create_collection(name="songs")

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
    # Anti-fatigue filter placeholder (skip same artist/album logic when available)
    response = SmartShuffleResponse(song_ids=neighbor_ids)
    return response

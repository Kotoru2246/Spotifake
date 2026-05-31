# BackendAI Service

This FastAPI service is the AI bridge for the modern music player.

## Purpose

- Accept a seed `SongID` from the desktop client.
- Query ChromaDB vector data for nearest neighbor tracks.
- Apply anti-fatigue rules.
- Return a list of recommended `SongID` values.

## Run

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn BackendAI.main:app --reload --port 8000

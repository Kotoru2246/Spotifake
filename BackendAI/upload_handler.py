import shutil
from pathlib import Path
from fastapi import UploadFile
from .models import SongCreate
from .audio_features import extract_audio_features, categorize_genre_and_mood


UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file to disk and return the file path."""
    file_path = UPLOAD_DIR / upload_file.filename
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return str(file_path)
    except Exception as e:
        print(f"Error saving file: {e}")
        raise


async def process_uploaded_song(
    upload_file: UploadFile,
    title: str,
    artist: str,
    album: str = ""
) -> SongCreate:
    """
    Process an uploaded song file:
    1. Save it
    2. Extract features
    3. Categorize
    4. Return SongCreate object ready to save to DB
    """
    # Save file
    file_path = await save_upload_file(upload_file)
    
    # Extract features
    features = extract_audio_features(file_path)
    
    # Categorize with ML classifier
    genre, mood = categorize_genre_and_mood(features)
    
    # Create song object
    song = SongCreate(
        source="upload",
        title=title,
        artist=artist,
        album=album,
        duration_ms=features.get("duration_ms", 0),
        file_path=file_path,
        storage_url=file_path,
        tempo=features.get("tempo", 0.0),
        energy=features.get("energy", 0.0),
        danceability=features.get("danceability", 0.0),
        valence=features.get("valence", 0.0),
        acousticness=features.get("acousticness", 0.0),
        instrumentalness=features.get("instrumentalness", 0.0),
        key=features.get("key", 0),
        mode=features.get("mode", 0),
        genre=genre,
        mood=mood,
        tags=f"{genre},{mood}",
    )
    
    return song

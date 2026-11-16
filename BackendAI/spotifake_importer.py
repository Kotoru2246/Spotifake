import os
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Union, Dict, Any
from uuid import UUID, uuid4

import mutagen
from sqlmodel import Session, select

from BackendAI.db import engine
from BackendAI.models import Song, Album, ArtistProfile
from BackendAI.artist_scraper import update_or_create_artist_profile
from BackendAI.lyrics_service import fetch_synced_lyrics
try:
    from BackendAI.audio_features import extract_audio_features, categorize_genre_and_mood
except Exception:
    extract_audio_features = None
    categorize_genre_and_mood = None

try:
    from BackendAI.cnn_spectrogram_classifier import CnnSpectrogramClassifier
    _cnn_classifier = CnnSpectrogramClassifier()
except Exception:
    _cnn_classifier = None

logger = logging.getLogger("spotifake_importer")
logging.basicConfig(level=logging.INFO)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
COVERS_DIR = UPLOAD_DIR / "covers"
COVERS_DIR.mkdir(exist_ok=True)


def import_audio_file_to_db(
    file_path: Union[str, Path],
    song_metadata: Optional[Dict[str, Any]] = None,
    copy_to_uploads: bool = True,
    extract_features: bool = True,
) -> Song:
    """
    Import a downloaded audio file into the Spotifake database:
    1. Copies the file into uploads/
    2. Extracts ID3 tags, lyrics, and embedded album art
    3. Analyzes audio features (tempo, energy, mood, genre) via librosa
    4. Creates or updates Album in the Albums table
    5. Saves or updates the Song in the Songs table with full binary FileData and CoverArtData
    """
    src_path = Path(file_path).resolve()
    if not src_path.exists():
        raise FileNotFoundError(f"File not found: {src_path}")

    filename = src_path.name

    # 1. Copy/move into uploads/
    if copy_to_uploads:
        dest_path = UPLOAD_DIR / filename
        if src_path.resolve() != dest_path.resolve():
            shutil.copy2(src_path, dest_path)
        final_file_path = dest_path
    else:
        final_file_path = src_path

    relative_file_path = f"uploads/{filename}" if copy_to_uploads else str(final_file_path)

    # Read binary file data
    with open(final_file_path, "rb") as f:
        file_data = f.read()

    # 2. Extract ID3 metadata from mutagen
    title = ""
    artist = ""
    album = ""
    collab_artists = ""
    genre = ""
    lyrics = ""
    release_date = None
    cover_art_data: Optional[bytes] = None
    cover_art_url = ""
    source_url = ""
    duration_seconds = 0

    try:
        audio = mutagen.File(str(final_file_path))
        if audio is not None:
            if audio.info and hasattr(audio.info, "length"):
                duration_seconds = int(audio.info.length)

            if hasattr(audio, "tags") and audio.tags:
                tags = audio.tags

                # Title
                if "TIT2" in tags:
                    title = str(tags["TIT2"])

                # Artist
                if "TPE1" in tags:
                    artist = str(tags["TPE1"])

                # Album
                if "TALB" in tags:
                    album = str(tags["TALB"])

                # Genre
                if "TCON" in tags:
                    genre = str(tags["TCON"])

                # Release date / year
                if "TDRC" in tags:
                    try:
                        release_date = datetime.fromisoformat(str(tags["TDRC"]))
                    except Exception:
                        pass
                elif "TYER" in tags:
                    try:
                        release_date = datetime(int(str(tags["TYER"])), 1, 1)
                    except Exception:
                        pass

                # Lyrics
                for k in tags.keys():
                    if k.startswith("USLT") or k.startswith("SYLT"):
                        lyrics = str(tags[k])
                        break

                # Album Art (APIC frame)
                for k in tags.keys():
                    if k.startswith("APIC"):
                        cover_art_data = bytes(tags[k].data)
                        break

                # Source url / WOAS
                if "WOAS" in tags:
                    source_url = str(tags["WOAS"])
    except Exception as exc:
        logger.warning("Error reading mutagen tags from %s: %s", final_file_path, exc)

    # Fallback to filename if title is missing
    if not title:
        stem = final_file_path.stem
        if " - " in stem:
            parts = stem.split(" - ", 1)
            title, artist = parts[0].strip(), parts[1].strip()
        else:
            title = stem

    # Merge metadata if provided from SpotDL Song object / dict
    if song_metadata:
        if song_metadata.get("name"):
            title = song_metadata["name"]
        if song_metadata.get("artist"):
            artist = song_metadata["artist"]
        if song_metadata.get("artists") and len(song_metadata["artists"]) > 1:
            collab_artists = ", ".join(song_metadata["artists"][1:])
        if song_metadata.get("album_name"):
            album = song_metadata["album_name"]
        if song_metadata.get("cover_url"):
            cover_art_url = song_metadata["cover_url"]
        if song_metadata.get("lyrics") and not lyrics:
            lyrics = song_metadata["lyrics"]
        if song_metadata.get("url"):
            source_url = song_metadata["url"]
        if song_metadata.get("duration") and duration_seconds == 0:
            duration_seconds = int(song_metadata["duration"])

    # If lyrics still missing, fetch synced / plain lyrics automatically
    if not lyrics and title:
        try:
            logger.info("Auto-fetching synced lyrics for '%s' - '%s'...", title, artist)
            lyrics = fetch_synced_lyrics(title, artist) or ""
            if lyrics:
                logger.info("Successfully fetched lyrics for '%s'", title)
        except Exception as _lyr_err:
            logger.warning("Lyrics fetch error for '%s': %s", title, _lyr_err)

    # If cover art data was extracted, optionally save image to uploads/covers
    saved_cover_rel_path = ""
    if cover_art_data:
        cover_filename = f"{src_path.stem}_cover.jpg"
        cover_dest = COVERS_DIR / cover_filename
        with open(cover_dest, "wb") as cf:
            cf.write(cover_art_data)
        saved_cover_rel_path = f"uploads/covers/{cover_filename}"
        if not cover_art_url:
            cover_art_url = saved_cover_rel_path

    # 3. Audio feature analysis
    tempo = 0.0
    energy = 0.0
    danceability = 0.0
    valence = 0.0
    acousticness = 0.0
    instrumentalness = 0.0
    key = 0
    mode = 0
    mood = "neutral"

    if extract_features and extract_audio_features:
        try:
            logger.info("Extracting audio features for %s...", title)
            features = extract_audio_features(str(final_file_path))
            tempo = float(features.get("tempo", 0.0))
            energy = float(features.get("energy", 0.0))
            danceability = float(features.get("danceability", 0.0))
            valence = float(features.get("valence", 0.0))
            acousticness = float(features.get("acousticness", 0.0))
            instrumentalness = float(features.get("instrumentalness", 0.0))
            key = int(features.get("key", 0))
            mode = int(features.get("mode", 0))
            if duration_seconds == 0 and "duration_ms" in features:
                duration_seconds = int(features["duration_ms"] / 1000)

            if not genre and _cnn_classifier:
                try:
                    pred = _cnn_classifier.predict(str(target_path))
                    genre = pred['genre'].capitalize()
                except Exception as _cnn_err:
                    logger.debug("CNN classifier failed for %s: %s", title, _cnn_err)

            if categorize_genre_and_mood:
                extracted_genre, extracted_mood = categorize_genre_and_mood(features)
                if not genre:
                    genre = extracted_genre
                mood = extracted_mood
        except Exception as exc:
            logger.warning("Feature extraction skipped/failed for %s: %s", title, exc)

    tags_str = f"{genre},{mood}".strip(",")

    # 4. Save to Database
    with Session(engine) as session:
        # Manage Artist Profile (Avatar and Banner scraper)
        if artist:
            try:
                spotify_artist_id = song_metadata.get("artist_id") if song_metadata else None
                update_or_create_artist_profile(artist_name=artist, spotify_url_or_id=spotify_artist_id)
            except Exception as _art_err:
                logger.warning("Artist profile update/scrape failed for '%s': %s", artist, _art_err)

        # Manage Album
        album_id: Optional[UUID] = None
        if album:
            db_album = session.exec(select(Album).where(Album.title == album)).first()
            if not db_album:
                db_album = Album(
                    id=uuid4(),
                    title=album,
                    cover_art_url=cover_art_url,
                    cover_art_data=cover_art_data,
                    artist_id=uuid4(), # placeholder artist id
                    created_at=datetime.utcnow()
                )
                session.add(db_album)
                session.commit()
                session.refresh(db_album)
            album_id = db_album.id

        # Check if song already exists by Title and Artist
        existing_song = session.exec(
            select(Song).where(Song.title == title, Song.artist == artist)
        ).first()

        if existing_song:
            logger.info("Updating existing song in DB: '%s' by '%s'", title, artist)
            existing_song.album = album
            existing_song.album_id = album_id
            existing_song.collab_artists = collab_artists
            existing_song.duration_ms = duration_seconds * 1000
            existing_song.file_path = relative_file_path
            existing_song.storage_url = relative_file_path
            existing_song.file_data = file_data
            existing_song.cover_art_url = cover_art_url
            if cover_art_data:
                existing_song.cover_art_data = cover_art_data
            existing_song.lyrics = lyrics
            existing_song.genre = genre
            existing_song.mood = mood
            existing_song.tags = tags_str
            existing_song.tempo = tempo
            existing_song.energy = energy
            existing_song.danceability = danceability
            existing_song.valence = valence
            existing_song.acousticness = acousticness
            existing_song.instrumentalness = instrumentalness
            existing_song.key = key
            existing_song.mode = mode
            if source_url:
                existing_song.source_id = source_url
            session.add(existing_song)
            session.commit()
            session.refresh(existing_song)
            return existing_song
        else:
            logger.info("Inserting new song into DB: '%s' by '%s'", title, artist)
            new_song = Song(
                id=uuid4(),
                source="spotdl",
                source_id=source_url,
                title=title,
                artist=artist,
                collab_artists=collab_artists,
                album=album,
                album_id=album_id,
                duration_ms=duration_seconds * 1000,
                file_path=relative_file_path,
                storage_url=relative_file_path,
                file_data=file_data,
                cover_art_url=cover_art_url,
                cover_art_data=cover_art_data,
                release_date=release_date or datetime.utcnow(),
                lyrics=lyrics,
                genre=genre,
                mood=mood,
                tags=tags_str,
                tempo=tempo,
                energy=energy,
                danceability=danceability,
                valence=valence,
                acousticness=acousticness,
                instrumentalness=instrumentalness,
                key=key,
                mode=mode,
                uploaded_at=datetime.utcnow()
            )
            session.add(new_song)
            session.commit()
            session.refresh(new_song)
            return new_song

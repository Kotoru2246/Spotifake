import os
import sys
from pathlib import Path
from BackendAI.spotifake_importer import import_audio_file_to_db

def import_all_music_files(directory: str = "music"):
    music_dir = Path(directory)
    if not music_dir.exists():
        print(f"Directory {directory} does not exist.")
        return

    # Find all mp3, m4a, flac files
    files = list(music_dir.glob("**/*.mp3")) + list(music_dir.glob("**/*.m4a")) + list(music_dir.glob("**/*.flac"))
    print(f"Found {len(files)} audio files to import into Spotifake database.")

    success_count = 0
    for idx, f in enumerate(files, 1):
        try:
            print(f"[{idx}/{len(files)}] Importing {f.name}...")
            # For bulk import of existing files, don't run heavy librosa feature extraction for speed,
            # but extract ID3 tags, lyrics, cover art, and store file_data & cover_art_data in DB!
            song = import_audio_file_to_db(f, copy_to_uploads=True, extract_features=False)
            print(f"    ✓ Stored in DB: '{song.title}' by '{song.artist}' (ID: {song.id})")
            success_count += 1
        except Exception as e:
            print(f"    ✗ Failed to import {f.name}: {e}")

    print(f"\nDone! Successfully imported {success_count}/{len(files)} songs into Spotifake database.")

if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "music"
    import_all_music_files(target_dir)

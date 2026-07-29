

--- VERSION ---

"""Advanced FMA Dataset Downloader & Preprocessor

Usage:
    python fma_download_advanced.py --out-dir fma_data --download-audio

Downloads FMA metadata (which contains the massive features.csv) and maps
the 16 top-level FMA genres to our system's 18 supported genres.
"""
import os
import requests
import zipfile
import pandas as pd
import argparse

METADATA_URL = 'https://os.unil.cloud.switch.ch/fma/fma_metadata.zip'
MEDIUM_URL = 'https://os.unil.cloud.switch.ch/fma/fma_medium.zip'

# Map FMA 16 genres to our 18 Supported Genres
GENRE_MAP = {
    'Electronic': 'electronic',
    'Experimental': 'ambient',
    'Folk': 'folk',
    'Hip-Hop': 'hip-hop',
    'Instrumental': 'acoustic',
    'International': 'indie',
    'Jazz': 'jazz',
    'Classical': 'classical',
    'Historic': 'ambient',
    'Country': 'country',
    'Pop': 'pop',
    'Rock': 'rock',
    'Spoken': None,  # Discard
    'Blues': 'blues',
    'Soul-RnB': 'soul',
    'Easy Listening': 'ambient'
}

def download_file(url, dest_path):
    print(f"Downloading {url} -> {dest_path}")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        total = int(r.headers.get('content-length', 0))
        chunk_size = 8192
        with open(dest_path, 'wb') as f:
            downloaded = 0
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        pct = downloaded * 100 // total
                        print(f"\r{pct}%", end='')
    print('\nDownload complete')


def extract_zip(zip_path, extract_to):
    print(f"Extracting {zip_path} -> {extract_to}")
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(extract_to)
    print('Extracted')


def process_metadata(extract_dir, out_dir):
    """Parse tracks.csv, map genres, and save mapped labels."""
    print('Processing metadata and mapping genres...')
    
    # Locate tracks.csv
    tracks_csv = os.path.join(extract_dir, 'tracks.csv')
    if not os.path.exists(tracks_csv):
        tracks_csv = os.path.join(extract_dir, 'fma_metadata', 'tracks.csv')
        
    # Read tracks.csv with multi-index header correctly
    tracks = pd.read_csv(tracks_csv, index_col=0, header=[0, 1])
    
    # The 'track' column group contains 'genre_top'
    track_meta = tracks['track'].copy()
    
    # Keep only rows that have a top-level genre
    track_meta = track_meta.dropna(subset=['genre_top'])
    
    labels = []
    for track_id, row in track_meta.iterrows():
        fma_genre = row['genre_top']
        mapped_genre = GENRE_MAP.get(fma_genre)
        
        if mapped_genre is not None:
            labels.append({
                'track_id': track_id,
                'fma_genre': fma_genre,
                'mapped_genre': mapped_genre
            })
            
    df_labels = pd.DataFrame(labels)
    out_csv = os.path.join(out_dir, 'mapped_labels.csv')
    df_labels.to_csv(out_csv, index=False)
    
    print(f"Successfully mapped {len(df_labels)} tracks to our supported genres.")
    print(f"Mapped labels saved to {out_csv}")
    
    # Ensure features.csv exists
    features_csv = os.path.join(extract_dir, 'features.csv')
    if not os.path.exists(features_csv):
        features_csv = os.path.join(extract_dir, 'fma_metadata', 'features.csv')
        
    if os.path.exists(features_csv):
        print(f"Features file located at: {features_csv}")
    else:
        print("WARNING: features.csv not found in metadata extraction!")

    return tracks_csv, features_csv


def main(out_dir='fma_data', download_audio=False):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Download & Extract Metadata
    meta_zip = os.path.join(out_dir, 'fma_metadata.zip')
    if not os.path.exists(meta_zip):
        download_file(METADATA_URL, meta_zip)
        
    extract_dir = os.path.join(out_dir, 'metadata')
    if not os.path.exists(extract_dir):
        os.makedirs(extract_dir, exist_ok=True)
        extract_zip(meta_zip, extract_dir)

    # 2. Process Metadata & Map Genres
    process_metadata(extract_dir, out_dir)

    # 3. Optional Audio Download (For full pipeline testing later)
    if download_audio:
        medium_zip = os.path.join(out_dir, 'fma_medium.zip')
        if not os.path.exists(medium_zip):
            print("Downloading FMA Medium Audio (22GB)... This will take a while.")
            download_file(MEDIUM_URL, medium_zip)
        
        audio_extract = os.path.join(out_dir, 'fma_medium')
        if not os.path.exists(audio_extract):
            os.makedirs(audio_extract, exist_ok=True)
            extract_zip(medium_zip, audio_extract)
    else:
        print("Skipped downloading audio. (To download 22GB audio, run with --download-audio)")

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--out-dir', default='fma_data')
    p.add_argument('--download-audio', action='store_true')
    args = p.parse_args()
    main(args.out_dir, args.download_audio)


--- VERSION ---

"""Advanced FMA Dataset Downloader & Preprocessor

Usage:
    python fma_download_advanced.py --out-dir fma_data --download-audio

Downloads FMA metadata (which contains the massive features.csv) and maps
the 16 top-level FMA genres to our system's 18 supported genres.
"""
import os
import requests
import zipfile
import pandas as pd
import argparse

METADATA_URL = 'https://os.unil.cloud.switch.ch/fma/fma_metadata.zip'
MEDIUM_URL = 'https://os.unil.cloud.switch.ch/fma/fma_medium.zip'

# Map FMA 16 genres to our 18 Supported Genres
GENRE_MAP = {
    'Electronic': 'electronic',
    'Experimental': 'ambient',
    'Folk': 'folk',
    'Hip-Hop': 'hip-hop',
    'Instrumental': 'acoustic',
    'International': 'indie',
    'Jazz': 'jazz',
    'Classical': 'classical',
    'Historic': 'ambient',
    'Country': 'country',
    'Pop': 'pop',
    'Rock': 'rock',
    'Spoken': None,  # Discard
    'Blues': 'blues',
    'Soul-RnB': 'soul',
    'Easy Listening': 'ambient'
}

def download_file(url, dest_path):
    print(f"Downloading {url} -> {dest_path}")
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        total = int(r.headers.get('content-length', 0))
        chunk_size = 8192
        with open(dest_path, 'wb') as f:
            downloaded = 0
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        pct = downloaded * 100 // total
                        print(f"\r{pct}%", end='')
    print('\nDownload complete')


def extract_zip(zip_path, extract_to):
    print(f"Extracting {zip_path} -> {extract_to}")
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(extract_to)
    print('Extracted')


def process_metadata(extract_dir, out_dir):
    """Parse tracks.csv, map genres, and save mapped labels."""
    print('Processing metadata and mapping genres...')
    
    # Locate tracks.csv
    tracks_csv = os.path.join(extract_dir, 'tracks.csv')
    if not os.path.exists(tracks_csv):
        tracks_csv = os.path.join(extract_dir, 'fma_metadata', 'tracks.csv')
        
    # Read tracks.csv with multi-index header correctly
    tracks = pd.read_csv(tracks_csv, index_col=0, header=[0, 1])
    
    # The 'track' column group contains 'genre_top'
    track_meta = tracks['track'].copy()
    
    # Keep only rows that have a top-level genre
    track_meta = track_meta.dropna(subset=['genre_top'])
    
    labels = []
    for track_id, row in track_meta.iterrows():
        fma_genre = row['genre_top']
        mapped_genre = GENRE_MAP.get(fma_genre)
        
        if mapped_genre is not None:
            labels.append({
                'track_id': track_id,
                'fma_genre': fma_genre,
                'mapped_genre': mapped_genre
            })
            
    df_labels = pd.DataFrame(labels)
    out_csv = os.path.join(out_dir, 'mapped_labels.csv')
    df_labels.to_csv(out_csv, index=False)
    
    print(f"Successfully mapped {len(df_labels)} tracks to our supported genres.")
    print(f"Mapped labels saved to {out_csv}")
    
    # Ensure features.csv exists
    features_csv = os.path.join(extract_dir, 'features.csv')
    if not os.path.exists(features_csv):
        features_csv = os.path.join(extract_dir, 'fma_metadata', 'features.csv')
        
    if os.path.exists(features_csv):
        print(f"Features file located at: {features_csv}")
    else:
        print("WARNING: features.csv not found in metadata extraction!")

    return tracks_csv, features_csv


def main(out_dir='fma_data', download_audio=False):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Download & Extract Metadata
    meta_zip = os.path.join(out_dir, 'fma_metadata.zip')
    if not os.path.exists(meta_zip):
        download_file(METADATA_URL, meta_zip)
        
    extract_dir = os.path.join(out_dir, 'metadata')
    if not os.path.exists(extract_dir):
        os.makedirs(extract_dir, exist_ok=True)
        extract_zip(meta_zip, extract_dir)

    # 2. Process Metadata & Map Genres
    process_metadata(extract_dir, out_dir)

    # 3. Optional Audio Download (For full pipeline testing later)
    if download_audio:
        medium_zip = os.path.join(out_dir, 'fma_medium.zip')
        if not os.path.exists(medium_zip):
            print("Downloading FMA Medium Audio (22GB)... This will take a while.")
            download_file(MEDIUM_URL, medium_zip)
        
        audio_extract = os.path.join(out_dir, 'fma_medium')
        if not os.path.exists(audio_extract):
            os.makedirs(audio_extract, exist_ok=True)
            extract_zip(medium_zip, audio_extract)
    else:
        print("Skipped downloading audio. (To download 22GB audio, run with --download-audio)")

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--out-dir', default='fma_data')
    p.add_argument('--download-audio', action='store_true')
    args = p.parse_args()
    main(args.out_dir, args.download_audio)

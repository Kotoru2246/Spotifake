"""Download FMA metadata and (optionally) medium audio archive.

Usage:
    python fma_download.py --out-dir fma_data --download-audio

Notes:
    - Metadata download is small. Audio archive is large (~1GB+).
    - By default this script only downloads metadata; pass --download-audio to fetch audio.
"""
import os
import requests
import zipfile
import io
import pandas as pd
import argparse

METADATA_URL = 'https://os.unil.cloud.switch.ch/fma/fma_metadata.zip'
MEDIUM_URL = 'https://os.unil.cloud.switch.ch/fma/fma_medium.zip'


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


def build_labels_from_tracks(tracks_csv_path, audio_root, out_csv):
    print('Reading tracks metadata...')
    tracks = pd.read_csv(tracks_csv_path, index_col=0)
    # Use genre_top as label where available
    labels = []
    # Build a map of files by basename (without extension)
    file_map = {}
    for root, _, files in os.walk(audio_root):
        for f in files:
            if f.lower().endswith('.mp3'):
                name = os.path.splitext(f)[0]
                file_map[name] = os.path.join(root, f)

    for track_id, row in tracks.iterrows():
        try:
            gid = int(track_id)
        except Exception:
            continue
        genre = row.get('genre_top')
        if pd.isna(genre):
            continue
        # FMA files use zero-padded 6-digit names
        key = str(gid).zfill(6)
        if key in file_map:
            rel = os.path.relpath(file_map[key], audio_root)
            labels.append({'filename': rel, 'genre': genre})

    if labels:
        df = pd.DataFrame(labels)
        df.to_csv(out_csv, index=False)
        print(f'Wrote labels to {out_csv}, rows={len(df)}')
    else:
        print('No labels created (audio may not be downloaded yet)')


def main(out_dir='fma_data', download_audio=False):
    os.makedirs(out_dir, exist_ok=True)
    meta_zip = os.path.join(out_dir, 'fma_metadata.zip')
    if not os.path.exists(meta_zip):
        download_file(METADATA_URL, meta_zip)
    extract_dir = os.path.join(out_dir, 'metadata')
    os.makedirs(extract_dir, exist_ok=True)
    extract_zip(meta_zip, extract_dir)

    tracks_csv = os.path.join(extract_dir, 'tracks.csv')
    if not os.path.exists(tracks_csv):
        # some zips contain metadata/ directory
        tracks_csv = os.path.join(extract_dir, 'fma_metadata', 'tracks.csv')

    if download_audio:
        medium_zip = os.path.join(out_dir, 'fma_medium.zip')
        if not os.path.exists(medium_zip):
            download_file(MEDIUM_URL, medium_zip)
        audio_extract = os.path.join(out_dir, 'fma_medium')
        os.makedirs(audio_extract, exist_ok=True)
        extract_zip(medium_zip, audio_extract)
        # Build labels CSV from tracks and audio
        build_labels_from_tracks(tracks_csv, audio_extract, os.path.join(out_dir, 'labels.csv'))
    else:
        print('Metadata ready. To download audio, re-run with --download-audio')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--out-dir', default='fma_data')
    p.add_argument('--download-audio', action='store_true')
    args = p.parse_args()
    main(args.out_dir, args.download_audio)

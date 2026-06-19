"""Fetch tracks from Spotify per target genre and download previews.

Usage:
    python spotify_fetch_and_download.py --per-genre 300 --out-dir spotify_dataset

Requires: SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET in env.
"""
import os
import time
import csv
import argparse
from spotify_helper import _get_client

GENRES = [
    'acoustic', 'ambient', 'blues', 'classical', 'country',
    'dance', 'edm', 'electronic', 'folk', 'funk',
    'hip-hop', 'indie', 'jazz', 'metal', 'pop',
    'reggae', 'rock', 'soul'
]


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def download_preview(url, dest_path):
    import requests
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            with open(dest_path, 'wb') as f:
                f.write(r.content)
            return True
    except Exception:
        return False
    return False


def fetch_for_genre(sp, genre, per_genre, out_dir, writer):
    collected = 0
    seen_tracks = set()
    page = 0
    # strategy: search artists by genre keyword, then get their top tracks
    # use simple search queries
    while collected < per_genre:
        # search artists matching genre keyword
        try:
            # use page_size=1 and iterate offsets to avoid API limit errors
            page_size = 1
            results = sp.search(q=genre, type='artist', limit=page_size, offset=page)
        except Exception as e:
            print(f"Spotify search error for {genre}: {e}")
            break
        artists = results.get('artists', {}).get('items', [])
        if not artists:
            break
        for artist in artists:
            if collected >= per_genre:
                break
            artist_id = artist['id']
            artist_name = artist.get('name')
            try:
                top = sp.artist_top_tracks(artist_id, country='US')
            except Exception:
                continue
            for t in top.get('tracks', []):
                if collected >= per_genre:
                    break
                track_id = t['id']
                if track_id in seen_tracks:
                    continue
                seen_tracks.add(track_id)
                preview = t.get('preview_url')
                track_name = t.get('name')
                artists_list = ','.join([a['name'] for a in t.get('artists', [])])
                spotify_genres = artist.get('genres', [])
                filename = f"{genre}_{collected}_{track_id}.mp3"
                dest = os.path.join(out_dir, genre, filename)
                if preview:
                    ok = download_preview(preview, dest)
                else:
                    ok = False
                writer.writerow({
                    'genre': genre,
                    'track_id': track_id,
                    'track_name': track_name,
                    'artist': artists_list,
                    'preview_url': preview or '',
                    'downloaded': 'yes' if ok else 'no',
                    'filename': os.path.join(genre, filename) if ok else '' ,
                    'spotify_genres': ';'.join(spotify_genres)
                })
                collected += 1
                if collected % 25 == 0:
                    print(f"{genre}: collected {collected}/{per_genre}")
                if collected >= per_genre:
                    break
        page += 1
        time.sleep(0.5)


def main(per_genre, out_dir):
    sp = _get_client()
    ensure_dir(out_dir)
    csv_path = os.path.join(out_dir, 'labels.csv')
    ensure_dir(os.path.join(out_dir))
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['genre', 'track_id', 'track_name', 'artist', 'preview_url', 'downloaded', 'filename', 'spotify_genres']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for g in GENRES:
            ensure_dir(os.path.join(out_dir, g))
            print(f"Starting fetch for genre: {g}")
            try:
                fetch_for_genre(sp, g, per_genre, out_dir, writer)
            except Exception as e:
                print(f"Error fetching for {g}: {e}")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--per-genre', type=int, default=200)
    p.add_argument('--out-dir', default='BackendAI/spotify_dataset')
    args = p.parse_args()
    main(args.per_genre, args.out_dir)

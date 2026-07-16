"""Auto-label audio files in a directory using Spotify artist/track genres.

Creates a `labels.csv` with columns: filename,genre,spotify_genres

Usage:
    python auto_label_spotify.py --audio-dir ../uploads --out labels.csv

Requires environment variables: SPOTIPY_CLIENT_ID, SPOTIPY_CLIENT_SECRET
"""
import argparse
import csv
import os
from spotify_helper import search_track_genres, get_artist_genres
try:
    from mutagen import File as MutagenFile
except Exception:
    MutagenFile = None

# Simple mapping from Spotify genre keywords to the target 11-class taxonomy.
# This is a heuristic labeler, not ground truth. Manual review is still recommended.
GENRE_MAP = [
    (['hip hop', 'hip-hop', 'rap', 'trap', 'drill'], 'Hip-Hop / Rap'),
    (['pop', 'teen pop', 'dance pop', 'synthpop'], 'Pop'),
    (['rock', 'alternative', 'indie rock', 'classic rock', 'punk'], 'Rock'),
    (['edm', 'electronic', 'dance', 'house', 'techno', 'trance', 'dubstep'], 'Electronic / EDM'),
    (['r&b', 'rnb', 'rhythm and blues', 'neo soul', 'soul', 'motown', 'funk', 'disco'], 'R&B / Soul'),
    (['country', 'americana', 'country rock', 'bluegrass'], 'Country'),
    (['jazz', 'bebop', 'smooth jazz', 'vocal jazz'], 'Jazz'),
    (['classical', 'baroque', 'concerto', 'symphony', 'orchestra'], 'Classical'),
    (['reggae', 'ska', 'dub', 'dancehall'], 'Reggae'),
    (['latin', 'latino', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'merengue', 'urbano latino'], 'Latin'),
    (['blues'], 'Blues'),
]

TARGET_GENRES = [target for _, target in GENRE_MAP]


def map_spotify_to_target(genres):
    if not genres:
        return ''
    gstr = ' '.join(genres).lower()
    # direct keyword match
    for kws, target in GENRE_MAP:
        for kw in kws:
            if kw in gstr:
                return target
    # fallback heuristics
    if 'hip' in gstr or 'rap' in gstr:
        return 'Hip-Hop / Rap'
    if 'classical' in gstr:
        return 'Classical'
    if 'edm' in gstr or 'dance' in gstr or 'electronic' in gstr:
        return 'Electronic / EDM'
    # default to pop
    return 'Pop'


def parse_filename(filename: str):
    # heuristics to extract artist and title from filename
    name = os.path.splitext(os.path.basename(filename))[0]
    # common pattern: Artist - Title
    if ' - ' in name:
        parts = name.split(' - ', 1)
        return parts[0].strip(), parts[1].strip()
    if '-' in name:
        parts = name.split('-', 1)
        return parts[0].strip(), parts[1].strip()
    # fallback: no artist detected
    return None, name.strip()


def auto_label(audio_dir: str, out_csv: str, dry_run: bool = False):
    files = [f for f in os.listdir(audio_dir) if os.path.isfile(os.path.join(audio_dir, f))]
    rows = []
    for f in files:
        path = os.path.join(audio_dir, f)
        artist, title = parse_filename(f)
        spotify_genres = []
        try:
            if title and artist:
                spotify_genres = search_track_genres(title, artist)
            if not spotify_genres and artist:
                spotify_genres = get_artist_genres(artist)
            # ID3 fallback: try reading tags to get artist/title
            if not spotify_genres and MutagenFile is not None:
                try:
                    meta = MutagenFile(path)
                    if meta is not None:
                        # Common ID3 fields
                        a = None
                        t = None
                        if 'artist' in meta.tags:
                            a = meta.tags.get('artist')
                        # mutagen uses TPE1/TIT2 for ID3
                        if hasattr(meta.tags, 'get'):
                            try:
                                a = a or meta.tags.get('TPE1')
                            except Exception:
                                pass
                        try:
                            t = meta.tags.get('TIT2') or meta.tags.get('title')
                        except Exception:
                            t = None
                        # flatten if lists
                        if isinstance(a, (list, tuple)):
                            a = a[0]
                        if isinstance(t, (list, tuple)):
                            t = t[0]
                        if a or t:
                            spotify_genres = search_track_genres(t or title, a or artist)
                except Exception:
                    pass
        except Exception as e:
            print(f"Spotify lookup failed for {f}: {e}")

        mapped = map_spotify_to_target(spotify_genres)
        if not mapped:
            mapped = 'Pop'  # fallback to keep labels non-empty
        print(f"{f} -> Spotify: {spotify_genres} -> Mapped: {mapped}")
        rows.append({'filename': f, 'genre': mapped, 'spotify_genres': ';'.join(spotify_genres)})

    if dry_run:
        print('Dry run complete; not writing CSV')
        return

    # Ensure parent directory exists
    out_dir = os.path.dirname(out_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(out_csv, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['filename', 'genre', 'spotify_genres']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print(f"Wrote labels to {out_csv}")


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--audio-dir', default='../uploads', help='Directory with audio files')
    p.add_argument('--out', default='labels.csv', help='Output CSV path')
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()
    auto_label(args.audio_dir, args.out, dry_run=args.dry_run)

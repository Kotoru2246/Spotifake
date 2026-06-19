"""Minimal Spotify helper using spotipy to fetch track/artist genres.

Requires environment variables: SPOTIPY_CLIENT_ID, SPOTIPY_CLIENT_SECRET, SPOTIPY_REDIRECT_URI

Function: get_artist_genres(artist_name) and search_track_genres(track, artist)
"""
import os
try:
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
except Exception:
    spotipy = None


def _get_client():
    if spotipy is None:
        raise RuntimeError('spotipy not installed')
    client_id = os.getenv('SPOTIPY_CLIENT_ID')
    client_secret = os.getenv('SPOTIPY_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise RuntimeError('Set SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET')
    auth = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    return spotipy.Spotify(auth_manager=auth)


def get_artist_genres(artist_name: str, top_n: int = 5):
    sp = _get_client()
    results = sp.search(q=f'artist:{artist_name}', type='artist', limit=1)
    items = results.get('artists', {}).get('items', [])
    if not items:
        return []
    return items[0].get('genres', [])[:top_n]


def search_track_genres(track_name: str, artist_name: str = None):
    sp = _get_client()
    q = f'track:{track_name}'
    if artist_name:
        q += f' artist:{artist_name}'
    res = sp.search(q=q, type='track', limit=1)
    items = res.get('tracks', {}).get('items', [])
    if not items:
        return []
    artist_id = items[0]['artists'][0]['id']
    artist = sp.artist(artist_id)
    return artist.get('genres', [])

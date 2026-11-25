"""spotdl, except that an artist link downloads the artist's whole discography.

Run from the project root: python -m BackendAI.spotdl_runner download <query> ...

spotdl's Spotify library reads only the artist overview page, which stops at 10 albums, 10 singles and
10 compilations. Here the releases come from the paginated discography instead.
"""
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor

import spotapi
from spotdl.console.entry_point import console_entry_point
from spotdl.types.album import Album
from spotdl.types.artist import Artist, ArtistError
from spotdl.utils.spotify import SpotifyClient

# When a song is on several releases, the album's copy is the one kept.
_TYPE_ORDER = {"ALBUM": 0, "SINGLE": 1, "EP": 1, "COMPILATION": 2}
_SAME_RECORDING_SECONDS = 2
_READ_WORKERS = 6


def ordered_releases(pages):
    """Flatten discography pages into releases: albums, then singles, then compilations."""
    releases, seen = [], set()
    for page in pages:
        for item in page:
            for release in item.get("releases", {}).get("items", []):
                if release.get("id") and release["id"] not in seen:
                    seen.add(release["id"])
                    releases.append(release)
    return sorted(releases, key=lambda r: _TYPE_ORDER.get(r.get("type"), 1))


def _key(text):
    return re.sub(r"[\W_]+", "", unicodedata.normalize("NFKC", text).casefold()) or text


def unique_recordings(songs):
    """Drop repeats of one recording (same title, artist and length). Live versions and remixes stay."""
    kept, durations = [], {}
    for song in songs:
        lengths = durations.setdefault((_key(song.name), _key(song.artist)), [])
        if any(abs(song.duration - length) <= _SAME_RECORDING_SECONDS for length in lengths):
            continue
        lengths.append(song.duration)
        kept.append(song)
    return kept


def _with_retries(call, attempts=3, wait=2):
    for attempt in range(1, attempts + 1):
        try:
            return call()
        except Exception:
            if attempt == attempts:
                raise
            time.sleep(wait * attempt)


def full_discography(url):
    """Replacement for spotdl's Artist.get_metadata."""
    artist = SpotifyClient().artist(url)
    if artist is None:
        raise ArtistError("Couldn't get metadata, check if you have passed correct artist id")

    artist_id = url.split("?")[0].rstrip("/").split("/")[-1].split(":")[-1]
    releases = ordered_releases(_with_retries(
        lambda: list(spotapi.Artist().paginate_artist_discography(artist_id, section="all"))))
    if not releases:
        raise ArtistError("Couldn't get albums, check if you have passed correct artist id")
    print(f"{artist['name']}: reading {len(releases)} releases...", flush=True)

    def read_release(release):
        album_url = f"https://open.spotify.com/album/{release['id']}"
        try:
            return album_url, _with_retries(lambda: Album.from_url(album_url, fetch_songs=False))
        except Exception as exc:
            # "Error: " is what the downloader counts as a failure.
            print(f"Error: could not read release '{release.get('name')}' ({album_url}): {exc}", flush=True)
            return album_url, None

    albums, songs = [], []
    # One release takes several seconds to read; map() keeps the album-first order.
    with ThreadPoolExecutor(max_workers=_READ_WORKERS) as pool:
        for album_url, album in pool.map(read_release, releases):
            if album is not None:
                albums.append(album_url)
                songs.extend(album.songs)

    metadata = {"name": artist["name"], "genres": artist["genres"], "url": url, "albums": albums}
    return metadata, unique_recordings(songs)


Artist.get_metadata = staticmethod(full_discography)

if __name__ == "__main__":
    console_entry_point()

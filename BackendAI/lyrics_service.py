import sys
import logging
from typing import Optional
import syncedlyrics

logger = logging.getLogger("lyrics_fetcher")

def fetch_synced_lyrics(title: str, artist: str) -> Optional[str]:
    """
    Fetch synced (LRC formatted) or plain lyrics for a track using syncedlyrics.
    """
    if not title:
        return None

    clean_title = title.split(" (Bonus")[0].split(" (feat.")[0].split(" [feat.")[0].split(" (From ")[0].strip()
    primary_artist = artist.split("/")[0].split(",")[0].strip() if artist else ""

    queries = [
        f"{clean_title} {primary_artist}".strip(),
        f"{title} {artist}".strip(),
        clean_title
    ]

    for q in queries:
        try:
            logger.info("Searching synced lyrics for query: '%s'...", q)
            # Try synced lyrics first
            lrc = syncedlyrics.search(q, synced_only=True)
            if lrc:
                logger.info("Found synced lyrics for: '%s'", q)
                return lrc
        except Exception as e:
            logger.debug("Synced search failed for '%s': %s", q, e)

    # Fallback to plain lyrics if synced not found
    for q in queries:
        try:
            plain = syncedlyrics.search(q, synced_only=False)
            if plain:
                logger.info("Found plain lyrics for: '%s'", q)
                return plain
        except Exception as e:
            logger.debug("Plain search failed for '%s': %s", q, e)

    return None

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Testing Stay With Me:")
    print(fetch_synced_lyrics("Stay With Me", "Sam Smith")[:300])

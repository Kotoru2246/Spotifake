"""Guess a song's language from its lyrics, and fill Songs.Language where it is empty.

Lyrics decide when they can (writing system, or common words for Latin script).
Songs with no usable lyrics, including romanized ones, take their artist's usual language.

    python BackendAI/song_language.py            # report only
    python BackendAI/song_language.py --apply    # write Language where empty
"""
import argparse
import collections
import os
import re
import sqlite3

_TAGS = re.compile(r"\[[^\]]*\]|<[^>]*>")
# Credit lines ("作词 : ...") are often Chinese even for songs in other languages.
_CREDIT = re.compile(r"^.{0,12}[:：]")
_VIETNAMESE = re.compile(r"[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]")
_COMMON_WORDS = {
    "en": "the you and i'm it's my me that your for what with don't love this just know like".split(),
    "es": "que de la el yo tu mi te no es por para como pero con una".split(),
    "fr": "je le la les et tu moi toi pas est une dans mon des pour".split(),
    "pt": "que não você eu meu minha uma com para mais mas então".split(),
    "de": "ich du und nicht der die das ist mich dich mein ein wir".split(),
}


def from_lyrics(lyrics: str):
    """Return a language code, or None when the lyrics are missing or inconclusive."""
    lines = [_TAGS.sub("", line).strip() for line in (lyrics or "").splitlines()]
    text = "\n".join(l for l in lines if l and not _CREDIT.match(l)).lower()
    letters = [c for c in text if c.isalpha()]
    if len(letters) < 40:
        return None

    def share(low, high):
        return sum(low <= c <= high for c in letters) / len(letters)

    kana = share("぀", "ヿ")
    hangul = share("가", "힣")
    han = share("一", "鿿")
    # Japanese and Korean songs mix in a lot of English, so a modest share is enough.
    if kana >= 0.08:
        return "ja"
    if hangul >= 0.12:
        return "ko"
    if han >= 0.30:
        return "zh"
    if share("฀", "๿") >= 0.30:
        return "th"
    if share("Ѐ", "ӿ") >= 0.30:
        return "ru"
    if len(_VIETNAMESE.findall(text)) / len(letters) >= 0.04:
        return "vi"

    words = re.findall(r"[a-zà-ÿ']+", text.replace("’", "'"))
    if len(words) < 15:
        return None
    hits = {lang: sum(w in set(common) for w in words) / len(words) for lang, common in _COMMON_WORDS.items()}
    best = max(hits, key=hits.get)
    # "la la", "no", "me" look Spanish or French; real English words outweigh them.
    if best != "en" and hits["en"] >= 0.08:
        best = "en"
    # Romanized Japanese or Korean matches none of these well.
    return best if hits[best] >= 0.12 else None


def assign(rows):
    """rows: (song_id, artist, lyrics). Returns {song_id: (language, source)}."""
    detected = {sid: from_lyrics(lyrics) for sid, _, lyrics in rows}
    by_artist = collections.defaultdict(collections.Counter)
    for sid, artist, _ in rows:
        if detected[sid]:
            by_artist[artist][detected[sid]] += 1
    result = {}
    for sid, artist, _ in rows:
        counts = by_artist.get(artist)
        language = detected[sid]
        # A one-off third language for an established artist is almost always wrong lyrics.
        # English and Japanese are left alone: English versions and covers are real.
        if language and not (language not in ("en", "ja") and counts[language] <= 2
                             and sum(counts.values()) >= 20):
            result[sid] = (language, "lyrics")
            continue
        if counts:
            language = counts.most_common(1)[0][0]
            # An artist who writes in Japanese or Korean at all, with some songs romanized,
            # reads as English from those; prefer the native language when it is substantial.
            for native in ("ja", "ko"):
                if counts[native] >= 0.3 * sum(counts.values()):
                    language = native
            result[sid] = (language, "artist")
        else:
            result[sid] = ("", "unknown")
    return result


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.join(root, "backendai.db"))
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if hasattr(__import__("sys").stdout, "reconfigure"):  # Windows pipes default to cp1252
        __import__("sys").stdout.reconfigure(encoding="utf-8", errors="replace")

    con = sqlite3.connect(args.db, timeout=30)
    songs = con.execute("SELECT SongID, ArtistName, Lyrics, Title, IFNULL(Language, '') FROM Songs").fetchall()
    result = assign([(s[0], s[1], s[2]) for s in songs])

    print("songs:", len(songs))
    print("by language:", dict(collections.Counter(v[0] or "unknown" for v in result.values()).most_common()))
    print("decided by:", dict(collections.Counter(v[1] for v in result.values())))
    artists = collections.defaultdict(collections.Counter)
    for s in songs:
        artists[s[1]][result[s[0]][0] or "?"] += 1
    print("\nartists with mixed results (check these):")
    mixed = [(a, c) for a, c in artists.items() if len(c) > 1]
    for artist, counts in sorted(mixed, key=lambda x: -sum(x[1].values()))[:20]:
        print(f"  {artist}: {dict(counts.most_common())}")

    if args.apply:
        todo = [(result[s[0]][0], s[0]) for s in songs if not s[4] and result[s[0]][0]]
        con.executemany("UPDATE Songs SET Language = ? WHERE SongID = ? AND IFNULL(Language, '') = ''", todo)
        con.commit()
        print("\nwrote Language for", len(todo), "songs")
    con.close()


if __name__ == "__main__":
    main()

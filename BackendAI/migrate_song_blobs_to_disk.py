"""One-time migration: move audio blobs out of songs.FileData onto disk.

For every song whose FileData is set:
  * if FilePath already points to an existing, non-empty file, keep it;
  * otherwise write the blob to uploads/<SongID>.<ext> and update FilePath;
  * only then set FileData to NULL.

CoverArtData is left untouched (small; see docs/database.md).

Usage (stop the Spring Boot backend first):
    python BackendAI/migrate_song_blobs_to_disk.py [--db backendai.db] [--uploads uploads] [--dry-run] [--vacuum]
"""
import argparse
import os
import sqlite3
import sys

MAGIC = [
    (b"ID3", ".mp3"),
    (b"\xff\xfb", ".mp3"),
    (b"\xff\xf3", ".mp3"),
    (b"\xff\xf2", ".mp3"),
    (b"fLaC", ".flac"),
    (b"OggS", ".ogg"),
    (b"RIFF", ".wav"),
]


def guess_ext(blob, file_path):
    if file_path and "." in os.path.basename(file_path):
        return os.path.splitext(file_path)[1].lower()
    if blob[4:8] == b"ftyp":
        return ".m4a"
    for sig, ext in MAGIC:
        if blob.startswith(sig):
            return ext
    return ".mp3"


def resolve(file_path, repo_root, uploads_dir):
    if not file_path:
        return None
    clean = file_path.replace("\\", "/").lstrip("/")
    tail = clean[len("uploads/"):] if clean.startswith("uploads/") else clean
    for cand in (
        os.path.join(uploads_dir, tail),
        os.path.join(repo_root, clean),
        os.path.join(repo_root, "BackendSpringBoot", clean),
        os.path.join(repo_root, "BackendSpringBoot", "uploads", tail),
    ):
        if os.path.isfile(cand) and os.path.getsize(cand) > 0:
            return cand
    return None


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.join(repo_root, "backendai.db"))
    ap.add_argument("--uploads", default=os.path.join(repo_root, "uploads"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--vacuum", action="store_true")
    args = ap.parse_args()

    size_before = os.path.getsize(args.db)
    con = sqlite3.connect(args.db)
    ids = [r[0] for r in con.execute("SELECT SongID FROM songs WHERE FileData IS NOT NULL")]
    kept, written, failed = 0, 0, []

    for song_id in ids:
        file_path, blob = con.execute(
            "SELECT FilePath, FileData FROM songs WHERE SongID = ?", (song_id,)
        ).fetchone()
        if not blob:
            continue
        try:
            new_path = file_path
            if resolve(file_path, repo_root, args.uploads):
                kept += 1
            else:
                safe_id = os.path.basename(str(song_id))
                name = safe_id + guess_ext(blob, file_path)
                target = os.path.join(args.uploads, name)
                if not args.dry_run:
                    os.makedirs(args.uploads, exist_ok=True)
                    with open(target, "wb") as fh:
                        fh.write(blob)
                    if os.path.getsize(target) != len(blob):
                        raise IOError("short write for " + target)
                new_path = name
                written += 1
            if not args.dry_run:
                con.execute(
                    "UPDATE songs SET FilePath = ?, FileData = NULL WHERE SongID = ?",
                    (new_path, song_id),
                )
                con.commit()
        except Exception as exc:  # keep the blob so the row still plays
            failed.append((song_id, str(exc)))

    print(f"rows with blob: {len(ids)}  already on disk: {kept}  written: {written}  failed: {len(failed)}")
    for song_id, err in failed:
        print(f"  FAILED {song_id}: {err}")

    if args.vacuum and not args.dry_run:
        con.execute("VACUUM")
    con.close()
    size_after = os.path.getsize(args.db)
    print(f"db size: {size_before / 1e6:.1f} MB -> {size_after / 1e6:.1f} MB")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

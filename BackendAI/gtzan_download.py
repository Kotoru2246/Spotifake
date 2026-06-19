"""Download and extract the GTZAN genre collection.

Usage:
    python gtzan_download.py --out-dir gtzan_data

This downloads the standard genres.tar.gz archive, extracts it, and writes a
labels.csv with columns: filename,genre.
"""

from __future__ import annotations

import argparse
import csv
import os
import tarfile
from pathlib import Path

import requests


GTZAN_URL = "https://opihi.cs.uvic.ca/sound/genres.tar.gz"


def download_file(url: str, dest_path: Path) -> None:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists() and dest_path.stat().st_size > 0:
        print(f"Skipping existing download: {dest_path}")
        return

    print(f"Downloading {url}")
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        total = int(response.headers.get("content-length", 0))
        downloaded = 0
        with open(dest_path, "wb") as file_handle:
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if not chunk:
                    continue
                file_handle.write(chunk)
                downloaded += len(chunk)
                if total:
                    percent = int(downloaded * 100 / total)
                    print(f"\r{percent}%", end="")
    print("\nDownload complete")


def extract_tar_gz(archive_path: Path, extract_to: Path) -> None:
    extract_to.mkdir(parents=True, exist_ok=True)
    print(f"Extracting {archive_path} -> {extract_to}")
    with tarfile.open(archive_path, "r:gz") as archive:
        archive.extractall(extract_to)
    print("Extraction complete")


def build_labels(audio_root: Path, labels_csv: Path) -> None:
    rows = []
    for genre_dir in sorted(audio_root.iterdir()):
        if not genre_dir.is_dir():
            continue
        genre = genre_dir.name
        for audio_file in sorted(genre_dir.glob("*.au")):
            rows.append({"filename": str(audio_file.relative_to(audio_root)), "genre": genre})

    labels_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(labels_csv, "w", newline="", encoding="utf-8") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=["filename", "genre"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} labels to {labels_csv}")


def main(out_dir: str) -> None:
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    archive_path = out_path / "genres.tar.gz"
    download_file(GTZAN_URL, archive_path)

    extract_dir = out_path / "genres"
    if not extract_dir.exists() or not any(extract_dir.iterdir()):
        extract_tar_gz(archive_path, extract_dir)

    # GTZAN extracts into a top-level genres/ directory containing 10 genre folders.
    audio_root = extract_dir / "genres"
    if not audio_root.exists():
        # fallback if archive extracts directly into genre folders
        audio_root = extract_dir

    labels_csv = out_path / "labels.csv"
    build_labels(audio_root, labels_csv)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="gtzan_data")
    args = parser.parse_args()
    main(args.out_dir)

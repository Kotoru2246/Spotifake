"""Prepare GTZAN labels, extract features, and train a model.

This script assumes the GTZAN dataset is already extracted under:
    gtzan_data/Data/genres_original/<genre>/*.wav

It will create:
    - gtzan_data/labels.csv
    - gtzan_data/features.csv
    - models/gtzan_genre_rf.joblib
"""

from __future__ import annotations

import csv
from pathlib import Path

from data_extraction import extract_dataset
from train_genre_model import train_model


def build_labels(audio_root: Path, labels_csv: Path) -> int:
    rows = []
    for genre_dir in sorted(audio_root.iterdir()):
        if not genre_dir.is_dir():
            continue
        genre = genre_dir.name
        for audio_file in sorted(genre_dir.glob("*.wav")):
            rows.append({"filename": str(audio_file.relative_to(audio_root)), "genre": genre})

    labels_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(labels_csv, "w", newline="", encoding="utf-8") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=["filename", "genre"])
        writer.writeheader()
        writer.writerows(rows)

    return len(rows)


def main() -> None:
    base = Path(__file__).resolve().parent
    audio_root = base / "gtzan_data" / "Data" / "genres_original"
    labels_csv = base / "gtzan_data" / "labels.csv"
    features_csv = base / "gtzan_data" / "features.csv"
    model_out = base / "models" / "gtzan_genre_rf.joblib"

    if not audio_root.exists():
        raise FileNotFoundError(f"GTZAN audio root not found: {audio_root}")

    count = build_labels(audio_root, labels_csv)
    print(f"Wrote {count} GTZAN labels to {labels_csv}")

    extract_dataset(str(labels_csv), str(audio_root), str(features_csv))
    train_model(str(features_csv), str(model_out))


if __name__ == "__main__":
    main()

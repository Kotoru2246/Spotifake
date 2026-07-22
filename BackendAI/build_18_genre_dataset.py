"""Build an 11-genre training dataset from audio files.

Pipeline:
1. Auto-label audio files with Spotify heuristics into the 11-genre taxonomy.
2. Extract audio features for labeled files.
3. Save labels and features CSVs for training.
4. Optionally train a model from the generated features.

Usage:
    python build_18_genre_dataset.py --audio-dir ../uploads --workdir BackendAI/datasets/genre11

Optional:
    python build_18_genre_dataset.py --audio-dir ../uploads --workdir BackendAI/datasets/genre11 --train
"""

from __future__ import annotations

import argparse
import csv
import os
from pathlib import Path
from typing import Dict, List

try:
    from BackendAI.auto_label_spotify import auto_label, TARGET_GENRES
except Exception:
    from auto_label_spotify import auto_label, TARGET_GENRES

try:
    from BackendAI.data_extraction import extract_dataset
except Exception:
    from data_extraction import extract_dataset

try:
    from BackendAI.train_combined_model import train_model_on_combined
except Exception:
    from train_combined_model import train_model_on_combined


def normalize_genre(value: str) -> str:
    """Normalize labels into the exact target taxonomy names."""
    if not value:
        return ""
    key = value.strip().lower()
    alias_map = {
        'hip-hop': 'Hip-Hop / Rap',
        'hip hop': 'Hip-Hop / Rap',
        'rap': 'Hip-Hop / Rap',
        'edm': 'Electronic / EDM',
        'electronic': 'Electronic / EDM',
        'dance': 'Electronic / EDM',
        'electronic dance music (edm)': 'Electronic / EDM',
        'electronic / edm': 'Electronic / EDM',
        'r&b': 'R&B / Soul',
        'rnb': 'R&B / Soul',
        'rhythm and blues': 'R&B / Soul',
        'r&b (rhythm and blues)': 'R&B / Soul',
        'soul': 'R&B / Soul',
        'funk': 'R&B / Soul',
        'latin': 'Latin',
        'latin music': 'Latin',
        'reggaeton': 'Latin',
        'indie': 'Rock',
        'alternative': 'Rock',
        'metal': 'Rock',
        'folk': 'Country',
        'afrobeats': 'Reggae',
        'afrobeat': 'Reggae',
        'k-pop': 'Pop',
        'kpop': 'Pop',
        'j-pop': 'Pop',
        'jpop': 'Pop',
        'anime': 'Pop',
        'vocaloid': 'Pop',
    }
    if value in TARGET_GENRES:
        return value
    return alias_map.get(key, value)


def rebuild_labels(input_labels_csv: str, output_labels_csv: str) -> int:
    """Normalize a labels CSV to the exact 11-genre taxonomy and drop unknowns."""
    rows: List[Dict[str, str]] = []
    with open(input_labels_csv, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            genre = normalize_genre(row.get('genre', ''))
            if genre not in TARGET_GENRES:
                continue
            row['genre'] = genre
            rows.append(row)

    os.makedirs(os.path.dirname(output_labels_csv) or '.', exist_ok=True)
    with open(output_labels_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'genre', 'spotify_genres'])
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def summarize_label_distribution(labels_csv: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    with open(labels_csv, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            g = row.get('genre', '').strip()
            if not g:
                continue
            counts[g] = counts.get(g, 0) + 1
    return counts


def build_dataset(audio_dir: str, workdir: str, train: bool = False) -> Dict[str, str]:
    """Build the feature CSV and optionally train a model."""
    work = Path(workdir)
    work.mkdir(parents=True, exist_ok=True)

    audio_path = Path(audio_dir)
    if not audio_path.exists() or not audio_path.is_dir():
        raise FileNotFoundError(
            f"Audio directory not found: {audio_dir}. "
            "Pass a real folder that contains your .mp3, .wav, or .flac files."
        )

    audio_files = [p for p in audio_path.iterdir() if p.is_file()]
    if not audio_files:
        raise FileNotFoundError(
            f"No audio files found in: {audio_dir}. "
            "Put your training tracks in that folder or choose a different directory."
        )

    labels_raw = work / 'labels_raw.csv'
    labels_csv = work / 'labels_11.csv'
    features_csv = work / 'features_11.csv'
    model_out = work / 'genre11_rf.joblib'

    print(f"[1/4] Auto-labeling files in {audio_dir}")
    auto_label(audio_dir, str(labels_raw), dry_run=False)

    print(f"[2/4] Normalizing labels to the 11-genre taxonomy")
    kept = rebuild_labels(str(labels_raw), str(labels_csv))
    print(f"Kept {kept} labeled rows in {labels_csv}")

    if kept == 0:
        raise ValueError(
            "No valid 11-genre labels were produced. "
            "Set Spotify credentials (SPOTIPY_CLIENT_ID/SECRET), or manually curate labels_11.csv."
        )

    label_counts = summarize_label_distribution(str(labels_csv))
    unique_labels = len(label_counts)
    print(f"Label coverage: {unique_labels} genres -> {label_counts}")

    print(f"[3/4] Extracting features to {features_csv}")
    extract_dataset(str(labels_csv), audio_dir, str(features_csv))

    result = {
        'labels_csv': str(labels_csv),
        'features_csv': str(features_csv),
        'model_out': str(model_out),
    }

    if train:
        if unique_labels < 2:
            raise ValueError(
                "Training requires at least 2 distinct genres. "
                "Add more diverse labeled tracks before using --train."
            )
        print(f"[4/4] Training model to {model_out}")
        train_model_on_combined([str(features_csv)], str(model_out), label_col='genre')

    return result


def main() -> None:
    parser = argparse.ArgumentParser(description='Build an 11-genre training dataset path')
    parser.add_argument('--audio-dir', required=True, help='Directory containing audio files to label and extract')
    parser.add_argument('--workdir', default='BackendAI/datasets/genre11', help='Output workspace for labels/features/model')
    parser.add_argument('--train', action='store_true', help='Train a model after building features')
    args = parser.parse_args()

    outputs = build_dataset(args.audio_dir, args.workdir, train=args.train)
    print('\nDone:')
    for key, value in outputs.items():
        print(f'  {key}: {value}')


if __name__ == '__main__':
    main()
"""Extract features for a labeled dataset and save to CSV.

Usage:
    python data_extraction.py --labels labels.csv --audio-dir ../uploads --out features.csv
"""
import argparse
import csv
import os
import pandas as pd
from audio_features import extract_audio_features


def extract_dataset(labels_csv: str, audio_dir: str, out_csv: str):
    rows = []
    total = 0
    with open(labels_csv, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            filename = r.get('filename') or r.get('file') or r.get('path')
            genre = r.get('genre')
            if not filename or not genre:
                continue
            total += 1
            # Support both flat (filename.mp3) and nested (Genre_Folder/filename.mp3) paths
            path = os.path.join(audio_dir, filename)
            if not os.path.exists(path):
                # Try treating audio_dir as the parent of genre subfolders
                basename = os.path.basename(filename)
                alt_path = os.path.join(audio_dir, basename)
                if os.path.exists(alt_path):
                    path = alt_path
                else:
                    print(f"Missing file: {path}")
                    continue
            try:
                features = extract_audio_features(path)
                features['genre'] = genre
                features['file'] = filename
                rows.append(features)
            except Exception as e:
                print(f"Failed to extract {path}: {e}")

    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(out_csv, index=False)
        print(f"Saved features to {out_csv}")
    else:
        print("No features extracted.")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--labels', required=True, help='CSV with columns filename,genre')
    p.add_argument('--audio-dir', required=True, help='Directory with audio files')
    p.add_argument('--out', default='features.csv', help='Output features CSV')
    args = p.parse_args()
    extract_dataset(args.labels, args.audio_dir, args.out)

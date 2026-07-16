"""Extract features for a labeled dataset and save to CSV.

Usage:
    python data_extraction.py --labels labels.csv --audio-dir ../uploads --out features.csv
"""
import argparse
import concurrent.futures
from concurrent.futures.process import BrokenProcessPool
import csv
import os
from typing import Dict, List, Optional, Tuple

import pandas as pd
from audio_features import extract_audio_features

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None


def _resolve_audio_path(audio_dir: str, filename: str) -> Optional[str]:
    """Resolve a filename from labels.csv against possible audio locations."""
    path = os.path.join(audio_dir, filename)
    if os.path.exists(path):
        return path

    # Try treating audio_dir as the parent of genre subfolders
    basename = os.path.basename(filename)
    alt_path = os.path.join(audio_dir, basename)
    if os.path.exists(alt_path):
        return alt_path

    return None


def _extract_single_task(task: Tuple[str, str, str]) -> Optional[Dict[str, object]]:
    """Worker task: extract one audio file's features and attach labels metadata."""
    path, genre, filename = task
    try:
        features = extract_audio_features(path)
        features["genre"] = genre
        features["file"] = filename
        return features
    except Exception as exc:
        print(f"Failed to extract {path}: {exc}")
        return None


def _build_tasks(labels_csv: str, audio_dir: str, limit: Optional[int]) -> Tuple[List[Tuple[str, str, str]], int]:
    tasks: List[Tuple[str, str, str]] = []
    total_rows = 0

    with open(labels_csv, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            filename = r.get('filename') or r.get('file') or r.get('path')
            genre = r.get('genre')
            if not filename or not genre:
                continue
            total_rows += 1
            path = _resolve_audio_path(audio_dir, filename)
            if path is None:
                print(f"Missing file: {os.path.join(audio_dir, filename)}")
                continue

            tasks.append((path, genre, filename))
            if limit is not None and len(tasks) >= limit:
                break

    return tasks, total_rows


def extract_dataset(
    labels_csv: str,
    audio_dir: str,
    out_csv: str,
    workers: int = 4,
    limit: Optional[int] = None,
    backend: str = "auto",
):
    tasks, total_rows = _build_tasks(labels_csv, audio_dir, limit)
    print(f"Loaded {total_rows} labeled row(s) from {labels_csv}")
    print(f"Prepared {len(tasks)} extractable file(s)")

    if not tasks:
        print("No features extracted.")
        return

    workers = max(1, workers)
    rows: List[Dict[str, object]] = []

    if backend not in {"auto", "thread", "process"}:
        raise ValueError("backend must be one of: auto, thread, process")

    # On Windows, process pools can crash with native audio libs. Prefer threads by default.
    resolved_backend = backend
    if backend == "auto":
        resolved_backend = "thread" if os.name == "nt" else "process"

    def collect_from_mapped(mapped, total_tasks: int) -> None:
        iterable = mapped
        if tqdm is not None:
            iterable = tqdm(mapped, total=total_tasks, desc="Extracting", unit="file")
        for i, result in enumerate(iterable, 1):
            if result is not None:
                rows.append(result)
            if tqdm is None and (i % 50 == 0 or i == total_tasks):
                print(f"Progress: {i}/{total_tasks}")

    if workers == 1:
        # Keep a sequential mode for easier debugging and constrained machines.
        iterator = tasks
        if tqdm is not None:
            iterator = tqdm(tasks, total=len(tasks), desc="Extracting", unit="file")
        for task in iterator:
            result = _extract_single_task(task)
            if result is not None:
                rows.append(result)
    else:
        print(f"Extracting in parallel with {workers} worker(s) using {resolved_backend} backend...")
        if resolved_backend == "thread":
            with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
                mapped = executor.map(_extract_single_task, tasks)
                collect_from_mapped(mapped, len(tasks))
        else:
            try:
                with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as executor:
                    mapped = executor.map(_extract_single_task, tasks)
                    collect_from_mapped(mapped, len(tasks))
            except BrokenProcessPool:
                print("Process pool crashed. Falling back to thread backend automatically...")
                with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
                    mapped = executor.map(_extract_single_task, tasks)
                    collect_from_mapped(mapped, len(tasks))

    if rows:
        df = pd.DataFrame(rows)
        df.to_csv(out_csv, index=False)
        print(f"Saved {len(rows)} row(s) of features to {out_csv}")
    else:
        print("No features extracted.")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--labels', required=True, help='CSV with columns filename,genre')
    p.add_argument('--audio-dir', required=True, help='Directory with audio files')
    p.add_argument('--out', default='features.csv', help='Output features CSV')
    p.add_argument(
        '--workers',
        type=int,
        default=1,
        help='Number of parallel worker processes (default: 1).',
    )
    p.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Optional limit on how many valid files to extract.',
    )
    p.add_argument(
        '--backend',
        choices=['auto', 'thread', 'process'],
        default='auto',
        help='Parallel backend: auto (default), thread, or process.',
    )
    args = p.parse_args()
    extract_dataset(
        args.labels,
        args.audio_dir,
        args.out,
        workers=args.workers,
        limit=args.limit,
        backend=args.backend,
    )

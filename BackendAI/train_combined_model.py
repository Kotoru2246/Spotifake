"""Train a genre classifier from multiple feature CSVs (GTZAN + Spotify + uploads).

Usage:
    python train_combined_model.py --inputs a.csv b.csv --out models/combined_genre_rf.joblib
"""
import argparse
import os
from typing import List
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib


def load_and_merge(csv_paths: List[str]) -> pd.DataFrame:
    dfs = []
    for p in csv_paths:
        if not os.path.exists(p):
            print(f"⚠ Warning: input file not found: {p}")
            continue
        df = pd.read_csv(p)
        print(f"Loaded {p} -> {len(df)} rows")
        dfs.append(df)
    if not dfs:
        raise ValueError("No input CSVs found")
    # Concatenate and reset index
    combined = pd.concat(dfs, ignore_index=True)
    print(f"Combined dataset rows: {len(combined)}")
    return combined


def prepare_features(df: pd.DataFrame, label_col: str = None):
    if label_col is None:
        if 'genre' in df.columns:
            label_col = 'genre'
        elif 'label' in df.columns:
            label_col = 'label'
        else:
            raise ValueError('features CSVs must contain a "genre" or "label" column')

    # Drop obvious non-feature columns
    drop_cols = [c for c in ['genre', 'label', 'filename', 'file', 'path'] if c in df.columns]
    X = df.drop(columns=drop_cols, errors='ignore').select_dtypes(include=["number"]).fillna(0)
    y = df[label_col].fillna('unknown')
    print(f"Feature matrix: {X.shape}, Labels: {y.shape}")
    return X, y


def train_model_on_combined(csv_inputs: List[str], out_path: str, label_col: str = None, epochs: int = 10):
    df = load_and_merge(csv_inputs)
    X, y = prepare_features(df, label_col)

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)

    total_trees = 300
    epochs = max(1, int(epochs))
    trees_per_epoch = max(1, total_trees // epochs)
    clf = RandomForestClassifier(
        n_estimators=trees_per_epoch,
        random_state=42,
        n_jobs=-1,
        warm_start=True,
    )

    print(f"Training for {epochs} epoch(s) with {total_trees} total trees")
    for epoch in range(1, epochs + 1):
        clf.set_params(n_estimators=min(total_trees, trees_per_epoch * epoch))
        clf.fit(X_train, y_train)
        print(f"Epoch {epoch}/{epochs} - trained {clf.n_estimators} trees")

    if clf.n_estimators != total_trees:
        clf.set_params(n_estimators=total_trees)
        clf.fit(X_train, y_train)
        print(f"Epoch {epochs}/{epochs} - trained {clf.n_estimators} trees (final)")

    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')
    print(f"Cross-val accuracy: {scores.mean():.3f} ± {scores.std():.3f}")
    y_pred = clf.predict(X_test)
    print(f"Test accuracy: {clf.score(X_test, y_test):.3f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump({'model': clf, 'label_encoder': le}, out_path)
    print(f"Saved combined model to {out_path}")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--inputs', nargs='+', required=True, help='Input feature CSVs')
    p.add_argument('--out', default='BackendAI/models/combined_genre_rf.joblib')
    p.add_argument('--label-col', default=None)
    p.add_argument('--epochs', type=int, default=10, help='Number of progress epochs to display during training')
    args = p.parse_args()
    train_model_on_combined(args.inputs, args.out, args.label_col, args.epochs)

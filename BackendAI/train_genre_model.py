"""Train a genre classifier from a features CSV.

Usage:
    python train_genre_model.py --features features.csv --out models/genre_rf.joblib
"""
import argparse
import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib


def train_model(features_csv: str, out_path: str, label_col: str = None):
    df = pd.read_csv(features_csv)
    if label_col is None:
        if 'genre' in df.columns:
            label_col = 'genre'
        elif 'label' in df.columns:
            label_col = 'label'
        else:
            raise ValueError('features CSV must contain a "genre" or "label" column')

    # Drop non-numeric columns and the target column from features
    drop_cols = [c for c in ['genre', 'label', 'filename', 'file', 'path'] if c in df.columns]
    X = df.drop(columns=drop_cols, errors='ignore').select_dtypes(include=["number"]).fillna(0)
    y = df[label_col].fillna('unknown')

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')
    print(f"Cross-val accuracy: {scores.mean():.3f} ± {scores.std():.3f}")
    y_pred = clf.predict(X_test)
    print(f"Test accuracy: {clf.score(X_test, y_test):.3f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump({'model': clf, 'label_encoder': le}, out_path)
    print(f"Saved model to {out_path}")


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--features', required=True)
    p.add_argument('--out', default='models/genre_rf.joblib')
    p.add_argument('--label-col', default=None)
    args = p.parse_args()
    train_model(args.features, args.out, args.label_col)

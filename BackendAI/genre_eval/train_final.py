"""Train the shipped genre model: PANNs Cnn14 embeddings + LogisticRegression on every labelled library song.

Uses the 11-class labels (first acceptable label per artist; j-pop included) and the cached embeddings from
extract_embeddings.py. C is picked by grouped CV over artists (same as the LOAO checkpoint).
Writes BackendAI/ml_models/genre_panns_lr.joblib.
"""
import os, sys, json, warnings
import numpy as np, joblib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from run_new import best_C, GROUP
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
warnings.filterwarnings('ignore')

# Stored genre names (Title Case, as the rest of the app uses).
DISPLAY = {'electronic': 'Electronic', 'hip-hop': 'Hip-Hop', 'pop': 'Pop', 'rock': 'Rock',
           'soul-rnb': 'R&B', 'j-pop': 'J-Pop', 'folk': 'Folk', 'country': 'Country',
           'jazz': 'Jazz', 'blues': 'Blues', 'classical': 'Classical'}

if __name__ == '__main__':
    lib = library()
    X, y, g = [], [], []
    for s in lib:
        f = os.path.join(CACHE, 'emb', 'panns', s['id'] + '.npy')
        if not os.path.exists(f) or s['labels11'] == ['exclude']: continue
        X.append(np.load(f)); y.append(s['labels11'][0]); g.append(GROUP.get(s['artist'], s['artist']))
    X, y, g = np.array(X), np.array(y), np.array(g)
    C = best_C(X, y, g)
    pipe = make_pipeline(StandardScaler(), LogisticRegression(C=C, class_weight='balanced', max_iter=3000)).fit(X, y)
    out = os.path.join(REPO, 'BackendAI', 'ml_models', 'genre_panns_lr.joblib')
    meta = dict(classes=list(pipe.classes_), display=DISPLAY, C=C, n=int(len(y)),
                per_class={c: int((y == c).sum()) for c in pipe.classes_}, artists=sorted(set(g)),
                embedding='PANNs Cnn14 (Cnn14_mAP=0.431.pth), 3 x 10 s crops (loudest + 25% + 75%), 32 kHz, mean',
                loao_checkpoint='genre_eval/RESULTS.md (panns-lr-11)')
    joblib.dump(dict(pipeline=pipe, **meta), out)
    json.dump(meta, open(out.replace('.joblib', '.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('saved', out, 'C=', C, meta['per_class'])

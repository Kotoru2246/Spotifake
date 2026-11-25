"""CLAP zero-shot + LogisticRegression (leave-one-artist-out) on cached embeddings. Writes preds + results JSON."""
import os, sys, json, warnings
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from evaluate import evaluate
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import GroupKFold
from sklearn.metrics import balanced_accuracy_score
warnings.filterwarnings('ignore')

lib = library()
def load(b):
    X, keep = [], []
    for i, s in enumerate(lib):
        f = os.path.join(CACHE, 'emb', b, s['id'] + '.npy')
        if os.path.exists(f): X.append(np.load(f)); keep.append(i)
    return np.array(X), keep
TAX = {'10': (G10, 'labels10'), '11': (G11, 'labels11')}
PROMPT_NAME = {'hip-hop': 'hip hop', 'soul-rnb': 'soul and R&B', 'j-pop': 'J-pop (Japanese pop)'}
Cs = [0.001, 0.01, 0.1, 1, 10]
# Held out together with their main artist so the same voice never sits on both sides of the split.
GROUP = {'Dreamville': 'J. Cole', 'Huncho Jack': 'Travis Scott'}

def zero_shot():
    import torch
    from transformers import ClapModel, ClapProcessor
    m = ClapModel.from_pretrained('laion/larger_clap_music').eval(); p = ClapProcessor.from_pretrained('laion/larger_clap_music')
    X, keep = load('clap'); X = X / np.linalg.norm(X, axis=1, keepdims=True)
    out = {}
    for tax, (classes, key) in TAX.items():
        texts = [f'a {PROMPT_NAME.get(c, c)} song' for c in classes]
        with torch.no_grad():
            T = m.get_text_features(**p(text=texts, return_tensors='pt', padding=True))
        if not torch.is_tensor(T): T = T.pooler_output
        T = T.numpy(); T /= np.linalg.norm(T, axis=1, keepdims=True)
        pred = (X @ T.T).argmax(1)
        P = [dict(id=lib[k]['id'], title=lib[k]['title'], artist=lib[k]['artist'], acceptable=lib[k][key], pred=classes[j])
             for k, j in zip(keep, pred) if lib[k][key] != ['exclude']]
        out[tax] = P
    return out

def best_C(X, y, g):
    if len(set(y)) < 2: return 1.0
    ng = len(set(g)); k = min(3, ng)
    if k < 2: return 1.0
    sc = {}
    for C in Cs:
        s = []
        for tr, te in GroupKFold(k).split(X, y, g):
            if len(set(y[tr])) < 2: continue
            mdl = make_pipeline(StandardScaler(), LogisticRegression(C=C, class_weight='balanced', max_iter=2000)).fit(X[tr], y[tr])
            s.append(balanced_accuracy_score(y[te], mdl.predict(X[te])))
        sc[C] = np.mean(s) if s else -1
    return max(sc, key=sc.get)

def loao(backbone):
    X, keep = load(backbone); out = {}
    for tax, (classes, key) in TAX.items():
        idx = [j for j, k in enumerate(keep) if lib[k][key] != ['exclude']]
        Xs = X[idx]; ks = [keep[j] for j in idx]
        y = np.array([lib[k][key][0] for k in ks]); g = np.array([GROUP.get(lib[k]['artist'], lib[k]['artist']) for k in ks])
        pred = np.empty(len(y), dtype=object); Cused = {}
        for a in sorted(set(g)):
            te = g == a; tr = ~te
            if len(set(y[tr])) < 2: pred[te] = y[tr][0]; continue
            C = best_C(Xs[tr], y[tr], g[tr]); Cused[a] = C
            mdl = make_pipeline(StandardScaler(), LogisticRegression(C=C, class_weight='balanced', max_iter=3000)).fit(Xs[tr], y[tr])
            pred[te] = mdl.predict(Xs[te])
        out[tax] = (dict(Cused=Cused, artists_per_class={c: sorted(set(g[y == c])) for c in classes if (y == c).any()}),
                    [dict(id=lib[k]['id'], title=lib[k]['title'], artist=lib[k]['artist'], acceptable=lib[k][key], pred=pred[i]) for i, k in enumerate(ks)])
    return out

if __name__ == '__main__':
    R = {}
    zs = zero_shot()
    for tax, P in zs.items():
        R[f'clap-zeroshot-{tax}'] = P
    meta = {}
    for b in ('clap', 'panns'):
        for tax, (m, P) in loao(b).items():
            R[f'{b}-lr-{tax}'] = P; meta[f'{b}-lr-{tax}'] = m
    json.dump(R, open(os.path.join(CACHE, 'new_preds.json'), 'w'))
    json.dump(meta, open(os.path.join(HERE, 'lr_meta.json'), 'w'), indent=1)
    summ = {}
    for name, P in R.items():
        tax = name.split('-')[-1]
        r = evaluate(P, TAX[tax][0], name, os.path.join(HERE, f'result_{name}.json'))

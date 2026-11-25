"""evaluate.py: score predictions. API: evaluate(preds, classes, name) ; preds = list of dict(artist, acceptable[list], pred)"""
import json, sys
import numpy as np
from collections import defaultdict

def evaluate(preds, classes, name='model', out_json=None, quiet=False):
    n = len(preds)
    correct = [p['pred'] in p['acceptable'] for p in preds]
    acc = float(np.mean(correct))
    gold = [p['acceptable'][0] for p in preds]
    # macro-F1 with first acceptable label as gold; a hit on another acceptable label counts as gold for scoring
    yt = [p['pred'] if c else g for p, c, g in zip(preds, correct, gold)]
    yp = [p['pred'] for p in preds]
    f1s, recall, support = {}, {}, {}
    for c in classes:
        tp = sum(1 for t, q in zip(yt, yp) if t == c and q == c)
        fp = sum(1 for t, q in zip(yt, yp) if t != c and q == c)
        fn = sum(1 for t, q in zip(yt, yp) if t == c and q != c)
        sup = sum(1 for t in yt if t == c)
        support[c] = sup
        recall[c] = tp / (tp + fn) if tp + fn else None
        f1s[c] = 2 * tp / (2 * tp + fp + fn) if (2 * tp + fp + fn) and sup else None
    present = [c for c in classes if f1s[c] is not None]
    macro = float(np.mean([f1s[c] for c in present])) if present else 0.0
    art = defaultdict(list)
    for p, c in zip(preds, correct): art[p['artist']].append(c)
    per_artist = {a: (float(np.mean(v)), len(v)) for a, v in art.items()}
    cm = defaultdict(lambda: defaultdict(int))
    for t, q in zip(yt, yp): cm[t][q] += 1
    # every artist weighs the same, so big catalogues (Ado, The Weeknd) don't dominate
    artist_balanced = float(np.mean([v[0] for v in per_artist.values()])) if per_artist else 0.0
    res = dict(name=name, n=n, accuracy=acc, artist_balanced_accuracy=artist_balanced, macro_f1=macro, recall=recall, f1=f1s, support=support,
               per_artist=per_artist, confusion={t: dict(v) for t, v in cm.items()},
               pred_distribution={c: yp.count(c) for c in classes})
    if out_json: json.dump(res, open(out_json, 'w', encoding='utf-8'), indent=1)
    if not quiet: print(report(res, classes))
    return res

def report(r, classes):
    L = [f"== {r['name']}  n={r['n']}  acc={r['accuracy']:.3f}  macroF1={r['macro_f1']:.3f}"]
    L.append('recall: ' + ', '.join(f"{c}={'-' if r['recall'][c] is None else format(r['recall'][c],'.2f')}({r['support'][c]})" for c in classes))
    L.append('per-artist: ' + ', '.join(f"{a}={v[0]:.2f}({v[1]})" for a, v in sorted(r['per_artist'].items(), key=lambda x: -x[1][1])))
    return '\n'.join(L)

def confusion_md(r, classes):
    cols = [c for c in classes if any(c in r['confusion'].get(t, {}) for t in classes) or c in r['confusion']]
    s = '| gold / pred | ' + ' | '.join(cols) + ' |\n|---|' + '---|' * len(cols) + '\n'
    for t in cols:
        row = r['confusion'].get(t, {})
        s += f'| {t} | ' + ' | '.join(str(row.get(c, 0)) for c in cols) + ' |\n'
    return s

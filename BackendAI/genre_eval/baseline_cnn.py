import os, sys, json, time, tempfile, io, contextlib, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from evaluate import evaluate
sys.path.insert(0, REPO)
from BackendAI.cnn_spectrogram_classifier import CnnSpectrogramClassifier
clf = CnnSpectrogramClassifier()
lib = library()
out = os.path.join(CACHE, 'cnn_preds.json')
res = json.load(open(out)) if os.path.exists(out) else {}
t0 = time.time()
for i, s in enumerate(lib):
    if s['id'] in res: continue
    try:
        y = decode(s['path'], 22050)
    except Exception as e:
        print('skip', s['title'], e); continue
    tmp = os.path.join(CACHE, 'tmp_cnn.wav')
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
    with contextlib.redirect_stdout(io.StringIO()):
        p = clf.predict(tmp)
    res[s['id']] = p['genre']
    if i % 50 == 0:
        print(i, len(lib), round(time.time() - t0), flush=True); json.dump(res, open(out, 'w'))
json.dump(res, open(out, 'w'))
for tax, classes, key in (('10', G10, 'labels10'), ('11', G11, 'labels11')):
    P = [dict(artist=s['artist'], acceptable=s[key], pred=res[s['id']]) for s in lib
         if s['id'] in res and s[key] != ['exclude']]
    evaluate(P, classes, 'cnn-' + tax, os.path.join(HERE, f'result_cnn_{tax}.json'))

import os, sys, json, random, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from evaluate import confusion_md
lib = {s['id']: s for s in library()}
R = {}
for n in ['cnn-10', 'cnn-11', 'clap-zeroshot-10', 'clap-zeroshot-11', 'clap-lr-10', 'clap-lr-11', 'panns-lr-10', 'panns-lr-11']:
    f = os.path.join(HERE, 'result_' + n.replace('cnn-', 'cnn_') + '.json')
    R[n] = json.load(open(f))
meta = json.load(open(os.path.join(HERE, 'lr_meta.json')))
tim = json.load(open(os.path.join(CACHE, 'timings.json')))
cnn = json.load(open(os.path.join(CACHE, 'cnn_preds.json')))
new = json.load(open(os.path.join(CACHE, 'new_preds.json')))
def cell(n): return f"{R[n]['accuracy']:.3f} / {R[n].get('artist_balanced_accuracy', float('nan')):.3f} / {R[n]['macro_f1']:.3f}"
rows = [('CNN baseline (current)', 'cnn'), ('CLAP zero-shot', 'clap-zeroshot'), ('CLAP + LogReg (LOAO)', 'clap-lr'), ('PANNs Cnn14 + LogReg (LOAO)', 'panns-lr')]
L = ['# Genre classifier evaluation checkpoint', '',
     'All labels are artist-level and UNREVIEWED (see `artist_genre_map.csv`). Accuracy = top-1 in acceptable set; macro-F1 uses first acceptable label as gold (over classes with support).', '',
     '## Headline (accuracy / artist-balanced accuracy / macro-F1)', '', 'Acceptance bar: 75% accuracy. Artist-balanced = mean of per-artist accuracy, so large catalogues do not dominate.', '', '| model | 10-class | 11-class |', '|---|---|---|']
for t, k in rows: L.append(f'| {t} | {cell(k+"-10")} | {cell(k+"-11")} (n={R[k+"-11"]["n"]}) |')
L.append(f'\nn(10-class)={R["cnn-10"]["n"]} (j-pop artists DECO*27, Ado, YOASOBI excluded), n(11-class)={R["cnn-11"]["n"]}. CNN has no j-pop output, so it scores 0 on every j-pop song in the 11-class set. CLAP zero-shot is broken with laion/larger_clap_music on transformers 5.24 (predicts jazz for almost everything even through the model own logits; weights load cleanly), so ignore that row.')
best = max([k for k in R if not k.startswith('cnn') and 'zeroshot' not in k], key=lambda k: R[k]['accuracy'])
L += ['', f'## Best new model: `{best}` (acc {R[best]["accuracy"]:.3f})', '', '### Per-artist accuracy (best vs CNN)', '', '| artist | n | best | CNN |', '|---|---|---|---|']
cn = R['cnn-' + best.split('-')[-1]]
for a, (v, n) in sorted(R[best]['per_artist'].items(), key=lambda x: -x[1][1]):
    L.append(f'| {a} | {n} | {v:.2f} | {cn["per_artist"].get(a, [float("nan")])[0]:.2f} |')
L += ['', '### Confusion matrix (rows gold, cols predicted)', '', confusion_md(R[best], G11 if best.endswith('11') else G10)]
L += ['### All configs: per-artist accuracy', '']
for n, r in R.items():
    L.append(f'- **{n}**: ' + ', '.join(f'{a} {v[0]:.2f}' for a, v in sorted(r['per_artist'].items(), key=lambda x: -x[1][1])))
L += ['', '### Artists per gold class (first acceptable label) and classes untestable artist-disjointly', '']
for n in ('clap-lr-10', 'clap-lr-11'):
    ap = meta[n]['artists_per_class']
    L.append(f'- {n}: ' + '; '.join(f'{c}: {", ".join(a)}' for c, a in ap.items()))
    L.append(f'  - classes with <2 artists (cannot be tested artist-disjointly; LOAO test of their only artist is necessarily wrong because the class is absent from training): ' + ', '.join(c for c, a in ap.items() if len(a) < 2))
    L.append(f'  - classes with no library artist at all (never trainable/testable): ' + ', '.join(c for c in (G11 if n.endswith('11') else G10) if c not in ap))
random.seed(7)
P = {p['id']: p for p in new[best]}
sel = random.sample(sorted(P), 30)
L += ['', f'## 30 random songs (seed 7), best = {best}', '', '| title | artist | CNN | best-new | acceptable |', '|---|---|---|---|---|']
for i in sel:
    p = P[i]; L.append(f"| {p['title'].replace('|','/')} | {p['artist']} | {cnn.get(i)} | {p['pred']} | {'/'.join(p['acceptable'])} |")
L += ['', '## Timings (CPU, per song)', '',
      f"- ffmpeg decode (48 kHz mono, full track) + crop selection: {tim['decode'][0]:.2f} s",
      f"- CLAP-music embedding (3 x 10 s crops): {tim['clap'][0]:.2f} s", f"- PANNs Cnn14 embedding (3 x 10 s crops, 32 kHz): {tim['panns'][0]:.2f} s",
      f"- (averaged over {tim['clap'][1]} songs; CNN baseline ~0.5 s/song incl. decode, measured in an earlier run)", '',
      '## Caveats', '',
      '- Labels are artist-level guesses, unreviewed; many songs of an artist will not match the artist label (Joji, Jamie Paige, Taylor Swift, Drake, SZA, Thang, Thinh Suy are multi-genre).',
      '- Classes with no library artist (blues, classical, jazz; country/folk only as secondary labels) can never be learned or tested here.',
      '- Leave-one-artist-out: Dreamville is held out with J. Cole and Huncho Jack with Travis Scott (same voices).',
      '- Library-only training, no external labelled clips; the CNN is evaluated as-is (trained on FMA).',
      '- Crops: loudest 10 s window + windows at 25% / 75% of track, embeddings averaged. Zero-shot prompts: "a {genre} song" (hip-hop -> "hip hop", soul-rnb -> "soul and R&B", j-pop -> "J-pop (Japanese pop)").']
open(os.path.join(HERE, 'RESULTS.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('ok', best)

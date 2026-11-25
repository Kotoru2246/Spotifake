import os, sys, csv, subprocess, io
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = r'E:\SpotifakeCache\genre_eval'
os.makedirs(CACHE, exist_ok=True)
os.environ.setdefault('HF_HOME', r'E:\SpotifakeCache\hf')
FFMPEG = r'C:\Users\jacky\.spotdl\ffmpeg.exe'
G10 = ['blues','classical','country','electronic','folk','hip-hop','jazz','pop','rock','soul-rnb']
G11 = G10 + ['j-pop']
sys.path.insert(0, HERE)

def library():
    """list of dict(id,title,artist,path,labels10,labels11) for labelled songs"""
    import build_library_labels as b
    songs = {r[0]: r for r in b.load()}
    out = []
    for r in csv.DictReader(open(os.path.join(HERE, 'library_labels.csv'), encoding='utf-8')):
        s = songs[r['song_id']]
        out.append(dict(id=s[0], title=s[1], artist=r['artist'], path=os.path.join(REPO, s[3]),
                        labels10=r['labels10'].split('|'), labels11=r['labels11'].split('|')))
    return out

def decode(path, sr, retries=1):
    for a in range(retries + 1):
        p = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if p.returncode == 0 and p.stdout: return np.frombuffer(p.stdout, dtype=np.float32)
    raise RuntimeError('decode failed ' + path + ' ' + p.stderr.decode(errors='ignore')[:200])

def crops(y, sr, n=3, sec=10):
    """loudest 10s window + windows at 25% / 75% of the track (3 crops total)"""
    L = sec * sr
    if len(y) < L: return [np.pad(y, (0, L - len(y)))] * n
    hop = sr
    rms = np.array([np.sqrt(np.mean(y[i:i+L]**2)) for i in range(0, len(y) - L + 1, hop)])
    starts = [int(rms.argmax()) * hop]
    for f in (0.25, 0.75):
        starts.append(int(f * (len(y) - L)))
    return [y[s:s+L] for s in starts[:n]]

"""Embed labelled library songs with CLAP-music and PANNs Cnn14. Cache: E:\SpotifakeCache\genre_eval\emb\{clap,panns}\{id}.npy"""
import os, sys, time, json
import numpy as np, torch, librosa
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
torch.set_num_threads(os.cpu_count() or 4)
from transformers import ClapModel, ClapProcessor
clap = ClapModel.from_pretrained('laion/larger_clap_music').eval()
proc = ClapProcessor.from_pretrained('laion/larger_clap_music')
from panns_inference import AudioTagging
panns = AudioTagging(checkpoint_path=r'E:\SpotifakeCache\panns_data\Cnn14_mAP=0.431.pth', device='cpu')
for b in ('clap', 'panns'): os.makedirs(os.path.join(CACHE, 'emb', b), exist_ok=True)

def clap_emb(cr48):
    inp = proc(audio=cr48, sampling_rate=48000, return_tensors='pt')
    with torch.no_grad():
        e = clap.get_audio_features(**inp)
    if not torch.is_tensor(e): e = e.pooler_output
    return e.mean(0).numpy()

def panns_emb(cr32):
    with torch.no_grad():
        _, emb = panns.inference(np.stack(cr32))
    return emb.mean(0)

if __name__ == '__main__':
    lib = library()
    tim = dict(decode=[], clap=[], panns=[])
    for i, s in enumerate(lib):
        fc = os.path.join(CACHE, 'emb', 'clap', s['id'] + '.npy'); fp = os.path.join(CACHE, 'emb', 'panns', s['id'] + '.npy')
        if os.path.exists(fc) and os.path.exists(fp): continue
        t0 = time.time()
        try: y = decode(s['path'], 48000)
        except Exception as e: print('skip', s['title'], e, flush=True); continue
        c48 = crops(y, 48000)
        c32 = [librosa.resample(c, orig_sr=48000, target_sr=32000) for c in c48]
        t1 = time.time(); np.save(fc, clap_emb(c48)); t2 = time.time(); np.save(fp, panns_emb(c32)); t3 = time.time()
        tim['decode'].append(t1 - t0); tim['clap'].append(t2 - t1); tim['panns'].append(t3 - t2)
        if i % 25 == 0:
            print(i, len(lib), {k: round(float(np.mean(v)), 2) for k, v in tim.items() if v}, flush=True)
            json.dump({k: [float(np.mean(v)), len(v)] for k, v in tim.items() if v}, open(os.path.join(CACHE, 'timings.json'), 'w'))
    json.dump({k: [float(np.mean(v)), len(v)] for k, v in tim.items() if v}, open(os.path.join(CACHE, 'timings.json'), 'w'))
    print('done')

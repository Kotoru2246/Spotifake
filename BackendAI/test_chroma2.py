

--- VERSION ---

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMBA_DISABLE_JIT"] = "1"

import librosa
import numpy as np

file_path = "C:/Music/APT..mp3"
y, sr = librosa.load(file_path, sr=22050, offset=85, duration=5, mono=True)

print("Starting STFT...")
S = np.abs(librosa.stft(y))**2
print("STFT done.")

print("Starting filter bank...")
chromfb = librosa.filters.chroma(sr=sr, n_fft=2048)
print("Filter bank done.")

print("Starting dot product...")
c = np.dot(chromfb, S)
print("Dot product done.")

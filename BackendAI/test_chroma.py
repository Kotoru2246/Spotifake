

--- VERSION ---

import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMBA_DISABLE_JIT"] = "1"

import librosa
import numpy as np

file_path = "C:/Music/APT..mp3"
print(f"Loading {file_path}...")
y, sr = librosa.load(file_path, sr=22050, offset=85, duration=5, mono=True)
print("Loaded.")

print("Testing chroma_stft...")
try:
    c_stft = librosa.feature.chroma_stft(y=y, sr=sr)
    print(f"chroma_stft success: {c_stft.shape}")
except Exception as e:
    print(f"chroma_stft failed: {e}")

print("Testing chroma_cqt...")
try:
    c_cqt = librosa.feature.chroma_cqt(y=y, sr=sr)
    print(f"chroma_cqt success: {c_cqt.shape}")
except Exception as e:
    print(f"chroma_cqt failed: {e}")

print("Testing chroma_cens...")
try:
    c_cens = librosa.feature.chroma_cens(y=y, sr=sr)
    print(f"chroma_cens success: {c_cens.shape}")
except Exception as e:
    print(f"chroma_cens failed: {e}")

print("Done testing.")
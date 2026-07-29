

--- VERSION ---

import librosa
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("Loading real audio file...")
try:
    y, sr = librosa.load("gtzan_data/Data/genres_original/blues/blues.00000.wav", sr=22050, duration=10)
    
    print("Testing chroma_stft (The Crasher)...")
    try:
        chroma1 = librosa.feature.chroma_stft(y=y, sr=sr)
        print("Success stft!")
    except Exception as e:
        print(f"Failed stft: {e}")
        
    print("Testing chroma_cqt (The Alternative)...")
    try:
        chroma2 = librosa.feature.chroma_cqt(y=y, sr=sr)
        print("Success cqt!")
    except Exception as e:
        print(f"Failed cqt: {e}")
        
    print("Testing chroma_cens (Another Alternative)...")
    try:
        chroma3 = librosa.feature.chroma_cens(y=y, sr=sr)
        print("Success cens!")
    except Exception as e:
        print(f"Failed cens: {e}")
except Exception as e:
    print(f"Failed to load audio: {e}")

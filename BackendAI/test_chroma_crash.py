

--- VERSION ---

import librosa
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("Generating dummy audio...")
y = np.random.randn(22050 * 30) # 30 seconds of noise
sr = 22050

print("Extracting default chroma (NO tuning=0)...")
try:
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    print(f"Success! Chroma shape: {chroma.shape}")
except Exception as e:
    print(f"Failed default chroma: {e}")

print("Extracting chroma with tuning=0 (The suspected crasher)...")
try:
    chroma_tuning = librosa.feature.chroma_stft(y=y, sr=sr, tuning=0)
    print(f"Success! Chroma shape: {chroma_tuning.shape}")
except Exception as e:
    print(f"Failed tuning=0 chroma: {e}")


--- VERSION ---

import librosa
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("Generating dummy audio...")
y = np.random.randn(22050 * 30) # 30 seconds of noise
sr = 22050

print("Extracting default chroma (NO tuning=0)...")
try:
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    print(f"Success! Chroma shape: {chroma.shape}")
except Exception as e:
    print(f"Failed default chroma: {e}")

print("Extracting chroma with tuning=0 (The suspected crasher)...")
try:
    chroma_tuning = librosa.feature.chroma_stft(y=y, sr=sr, tuning=0)
    print(f"Success! Chroma shape: {chroma_tuning.shape}")
except Exception as e:
    print(f"Failed tuning=0 chroma: {e}")

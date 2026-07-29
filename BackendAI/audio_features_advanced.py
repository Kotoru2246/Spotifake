import os
# Prevent OpenBLAS/MKL C-level segfaults on Windows during FFT
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
# Prevent Numba/LLVM silent JIT compilation crashes
os.environ["NUMBA_DISABLE_JIT"] = "1"

import librosa
import numpy as np
import tempfile
import subprocess

# Maximum seconds of audio to load for fast inference
_ANALYSIS_CLIP_SECONDS = 30

def extract_audio_features(file_path: str, offset_pct: float = 0.50) -> dict:
    """
    Extracts advanced audio features mirroring the FMA dataset using librosa.
    This replaces the old synthetic feature calculations.
    """
    # 1. Load a 30s clip from the target percentage of the song
    print(f"  [DEBUG] Trying to load audio metadata...")
    try:
        import soundfile as sf
        info = sf.info(file_path)
        full_duration_s = info.duration
        print(f"  [DEBUG] Audio duration: {full_duration_s}s")
    except Exception as e:
        print(f"  [DEBUG] Metadata load failed: {e}")
        full_duration_s = 180.0
        
    # Jump to the target percentage mark of the song
    clip_start = max(0.0, (full_duration_s * offset_pct))
    sr = 22050
    
    # Fast load via soundfile if possible, else librosa
    print(f"  [DEBUG] Loading audio wave via librosa...")
    try:
        y, _ = librosa.load(file_path, sr=sr, offset=clip_start, duration=_ANALYSIS_CLIP_SECONDS, mono=True)
        print(f"  [DEBUG] Audio loaded successfully. Extracting features...")
    except Exception as e:
        print(f"Failed to load audio {file_path}: {e}")
        return {}
        
    if y is None or len(y) == 0:
        return {}

    features = {}

    print("    [DEBUG] Extracting MFCCs...")
    # 1. MFCCs (20 coefficients)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)
    for i in range(20):
        features[f'mfcc_mean_{i+1:02d}'] = float(mfcc_mean[i])
        features[f'mfcc_std_{i+1:02d}'] = float(mfcc_std[i])
        
    # 2. Chroma Features (Pitch/Melody)
    try:
        print("    [DEBUG] Extracting Chroma (Pitch/Melody)...")
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        features['chroma_mean'] = float(np.mean(chroma))
        features['chroma_std'] = float(np.std(chroma))
    except Exception as e:
        print(f"      [WARNING] Chroma failed: {e}")
        features['chroma_mean'] = 0.0
        features['chroma_std'] = 0.0

    print("    [DEBUG] Extracting Spectral Centroid...", flush=True)
    # 5. Spectral Centroid
    sc = librosa.feature.spectral_centroid(y=y, sr=sr)
    features['spectral_centroid_mean_01'] = float(np.mean(sc))
    features['spectral_centroid_std_01'] = float(np.std(sc))
    
    print("    [DEBUG] Extracting Spectral Bandwidth...")
    # 6. Spectral Bandwidth
    sb = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    features['spectral_bandwidth_mean_01'] = float(np.mean(sb))
    features['spectral_bandwidth_std_01'] = float(np.std(sb))
    
    print("    [DEBUG] Extracting Spectral Contrast...")
    # 7. Spectral Contrast (7 bands)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    contrast_mean = np.mean(contrast, axis=1)
    contrast_std = np.std(contrast, axis=1)
    for i in range(7):
        features[f'spectral_contrast_mean_{i+1:02d}'] = float(contrast_mean[i])
        features[f'spectral_contrast_std_{i+1:02d}'] = float(contrast_std[i])
        
    print("    [DEBUG] Extracting Spectral Rolloff...")
    # 8. Spectral Rolloff
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    features['spectral_rolloff_mean_01'] = float(np.mean(rolloff))
    features['spectral_rolloff_std_01'] = float(np.std(rolloff))
    
    print("    [DEBUG] Extracting Zero Crossing Rate...")
    # 9. Zero Crossing Rate (ZCR)
    zcr = librosa.feature.zero_crossing_rate(y=y)
    features['zcr_mean_01'] = float(np.mean(zcr))
    features['zcr_std_01'] = float(np.std(zcr))

    print(f"  [DEBUG] Feature extraction complete!")
    return features

# Test
if __name__ == '__main__':
    # Add a dummy test if needed
    pass


--- VERSION ---

import librosa
import numpy as np
import tempfile
import os
import subprocess

# Maximum seconds of audio to load for fast inference
_ANALYSIS_CLIP_SECONDS = 30

def extract_audio_features(file_path: str) -> dict:
    """
    Extracts advanced audio features mirroring the FMA dataset using librosa.
    This replaces the old synthetic feature calculations.
    """
    # 1. Load a 30s clip from the middle of the song
    try:
        import soundfile as sf
        info = sf.info(file_path)
        full_duration_s = info.duration
    except Exception:
        full_duration_s = 180.0
        
    clip_start = max(0.0, (full_duration_s * 0.25))
    sr = 22050
    
    # Fast load via soundfile if possible, else librosa
    try:
        y, _ = librosa.load(file_path, sr=sr, offset=clip_start, duration=_ANALYSIS_CLIP_SECONDS, mono=True)
    except Exception as e:
        print(f"Failed to load audio {file_path}: {e}")
        return {}
        
    if y is None or len(y) == 0:
        return {}

    features = {}

    # 1. MFCCs (20 coefficients)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    mfcc_mean = np.mean(mfcc, axis=1)
    for i, val in enumerate(mfcc_mean, 1):
        features[f'mfcc_mean_{i:02d}'] = float(val)
        
    # 2. Chroma STFT (12 pitch classes)
    chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma_stft, axis=1)
    for i, val in enumerate(chroma_mean, 1):
        features[f'chroma_stft_mean_{i:02d}'] = float(val)
        
    # 3. Chroma CQT (12 pitch classes)
    try:
        chroma_cqt = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_cqt_mean = np.mean(chroma_cqt, axis=1)
        for i, val in enumerate(chroma_cqt_mean, 1):
            features[f'chroma_cqt_mean_{i:02d}'] = float(val)
    except Exception:
        for i in range(1, 13):
            features[f'chroma_cqt_mean_{i:02d}'] = 0.0

    # 4. Chroma CENS (12 pitch classes)
    try:
        chroma_cens = librosa.feature.chroma_cens(y=y, sr=sr)
        chroma_cens_mean = np.mean(chroma_cens, axis=1)
        for i, val in enumerate(chroma_cens_mean, 1):
            features[f'chroma_cens_mean_{i:02d}'] = float(val)
    except Exception:
        for i in range(1, 13):
            features[f'chroma_cens_mean_{i:02d}'] = 0.0
            
    # 5. Spectral Centroid
    sc = librosa.feature.spectral_centroid(y=y, sr=sr)
    features['spectral_centroid_mean_01'] = float(np.mean(sc))
    
    # 6. Spectral Bandwidth
    sb = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    features['spectral_bandwidth_mean_01'] = float(np.mean(sb))
    
    # 7. Spectral Contrast (7 bands)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    contrast_mean = np.mean(contrast, axis=1)
    for i, val in enumerate(contrast_mean, 1):
        features[f'spectral_contrast_mean_{i:02d}'] = float(val)
        
    # 8. Spectral Rolloff
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    features['spectral_rolloff_mean_01'] = float(np.mean(rolloff))
    
    # 9. Zero Crossing Rate (ZCR)
    zcr = librosa.feature.zero_crossing_rate(y=y)
    features['zcr_mean_01'] = float(np.mean(zcr))

    return features

# Test
if __name__ == '__main__':
    # Add a dummy test if needed
    pass

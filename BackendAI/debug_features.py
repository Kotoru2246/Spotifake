"""Debug script to check audio features"""
import librosa
import numpy as np

def debug_extract_features(file_path: str):
    """Extract and display all features with details"""
    y, sr = librosa.load(file_path, sr=22050, mono=True)
    
    # Basic info
    duration_s = librosa.get_duration(y=y, sr=sr)
    print(f"\n📊 Audio Analysis for: {file_path}")
    print(f"   Duration: {duration_s:.1f}s")
    print(f"   Sample rate: {sr} Hz")
    print(f"   Samples: {len(y)}")
    
    # Energy calculation methods
    rms = librosa.feature.rms(y=y)
    energy_mean = float(np.mean(rms))
    energy_max = float(np.max(rms))
    energy_std = float(np.std(rms))
    
    # Alternative energy: use spectral centroid as brightness/energy indicator
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    sc_mean = float(np.mean(spectral_centroid))
    
    # Alternative: sum of absolute values (loudness)
    loudness = float(np.mean(np.abs(y)))
    
    # Alternative: MFCC-based energy
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_energy = float(np.mean(np.abs(mfcc)))
    
    print(f"\n   Energy Metrics:")
    print(f"     RMS Mean: {energy_mean:.3f} (TOO LOW!)")
    print(f"     RMS Max: {energy_max:.3f}")
    print(f"     RMS Std: {energy_std:.3f}")
    print(f"     Loudness (abs mean): {loudness:.4f}")
    print(f"     MFCC energy: {mfcc_energy:.3f}")
    print(f"     Spectral centroid: {sc_mean:.0f} Hz (brightness)")
    
    # Tempo
    try:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(tempo)
    except:
        tempo = 0
    print(f"\n   Tempo: {tempo:.1f} BPM")
    
    # Danceability proxy (onset strength)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_mean = float(np.mean(onset_env))
    print(f"   Onset strength (danceability proxy): {onset_mean:.3f}")
    
    # Acousticness proxy
    zcr = librosa.feature.zero_crossing_rate(y)
    zcr_mean = float(np.mean(zcr))
    print(f"   Zero crossing rate: {zcr_mean:.4f} (low = electronic, high = acoustic)")

    # Additional features for deeper inspection
    rmse = librosa.feature.rms(y=y)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    tempogram = librosa.feature.tempogram(y=y, sr=sr)
    tonnetz = librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr)

    print(f"\n   RMSE: {float(np.mean(rmse)):.3f}")
    print(f"   Chroma mean: {float(np.mean(chroma)):.3f}")
    print(f"   Spectral contrast: {float(np.mean(spectral_contrast)):.3f}")
    print(f"   Spectral rolloff: {float(np.mean(spectral_rolloff)):.0f} Hz")
    print(f"   Spectral bandwidth: {float(np.mean(spectral_bandwidth)):.0f} Hz")
    print(f"   Tempogram strength: {float(np.mean(np.abs(tempogram))):.3f}")
    print(f"   Tonnetz mean: {float(np.mean(tonnetz)):.3f}")
    
    print("\n" + "="*50)
    print(f"\n💡 Recommendation: For this file, use LOUDNESS instead of RMS!")
    print(f"   Adjusted energy would be ~{loudness*5:.2f} (loudness * 5)")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        debug_extract_features(sys.argv[1])
    else:
        print("Usage: python debug_features.py <audio_file>")
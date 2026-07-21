import librosa
import numpy as np
from pathlib import Path
from typing import Dict
from .essentia_client import classify_with_features


def to_native_python(value):
    """Convert numpy types to native Python types."""
    if isinstance(value, np.ndarray):
        # For numpy arrays, extract the scalar value
        return float(value.item())
    elif isinstance(value, (np.integer, np.floating)):
        return value.item()
    elif isinstance(value, (int, float)):
        return value
    else:
        return float(value)


def extract_audio_features(file_path: str) -> Dict[str, float]:
    """
    Extract audio features from a file using librosa.
    Returns a dictionary of features that can be stored in the Song model.
    """
    try:
        # Load audio file (22050 Hz, mono)
        y, sr = librosa.load(file_path, sr=22050, mono=True)
        
        # Duration
        duration_ms = int(librosa.get_duration(y=y, sr=sr) * 1000)
        
        # Tempo and beat tracking - with fallback
        try:
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            tempo = to_native_python(tempo)
            # If beat tracking fails, estimate from onset peaks
            if tempo == 0 or tempo < 60:
                onset_env = librosa.onset.onset_strength(y=y, sr=sr)
                # Estimate BPM from onset strength peaks
                estimated_tempo = 120  # Default fallback
                print(f"⚠ Beat tracking failed, using default tempo: {estimated_tempo}")
                tempo = float(estimated_tempo)
        except Exception as e:
            print(f"⚠ Beat tracking error: {e}, using default tempo 120")
            tempo = 120.0
        
        # Spectral features
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        
        # IMPROVED ENERGY: Use loudness instead of RMS for modern compressed audio
        loudness = float(np.mean(np.abs(y)))
        energy = float(np.clip(loudness * 5, 0, 1))  # Scale and clip to 0-1
        
        # Zero crossing rate (related to noise/articulation)
        zcr = librosa.feature.zero_crossing_rate(y)
        
        # MFCC (Mel-frequency cepstral coefficients) - compute 20 to match GTZAN features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        # Additional features
        rmse = librosa.feature.rms(y=y)
        chroma_mean = float(np.mean(chroma))
        chroma_var = float(np.var(chroma))
        spectral_contrast_mean = float(np.mean(spectral_contrast))
        spectral_rolloff_mean = float(np.mean(spectral_rolloff))
        spectral_rolloff_var = float(np.var(spectral_rolloff))
        spectral_bandwidth_mean = float(np.mean(spectral_bandwidth))
        spectral_bandwidth_var = float(np.var(spectral_bandwidth))
        tempogram = librosa.feature.tempogram(y=y, sr=sr)
        tempogram_strength = float(np.mean(np.abs(tempogram)))
        # Harmonic / percussive components
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        harmony_mean = float(np.mean(y_harmonic))
        harmony_var = float(np.var(y_harmonic))
        perceptr_mean = float(np.mean(y_percussive))
        perceptr_var = float(np.var(y_percussive))
        tonnetz = librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr)
        tonnetz_mean = float(np.mean(tonnetz))
        
        # Compute derived features
        danceability = compute_danceability(y, sr, tempo)
        acousticness = compute_acousticness(spectral_centroid, zcr)
        valence = compute_valence(mfcc, spectral_centroid)
        instrumentalness = compute_instrumentalness(zcr, energy)
        
        # Pitch / Key
        key = int(np.argmax(np.mean(chroma, axis=1)))
        mode = int(1 if np.mean(y) >= 0 else 0)
        
        # Print debug info
        print(f"📊 Extracted features:")
        print(f"   Tempo: {tempo:.1f} BPM")
        print(f"   Energy: {energy:.2f}")
        print(f"   Danceability: {danceability:.2f}")
        print(f"   Acousticness: {acousticness:.2f}")
        print(f"   Valence: {valence:.2f}")
        print(f"   Instrumentalness: {instrumentalness:.2f}")
        print(f"   RMSE: {float(np.mean(rmse)):.3f}")
        print(f"   Chroma mean: {chroma_mean:.3f}")
        print(f"   Spectral contrast: {spectral_contrast_mean:.3f}")
        print(f"   Spectral rolloff: {spectral_rolloff_mean:.0f} Hz")
        print(f"   Spectral bandwidth: {spectral_bandwidth_mean:.0f} Hz")
        print(f"   Tempogram strength: {tempogram_strength:.3f}")
        print(f"   Tonnetz mean: {tonnetz_mean:.3f}")
        
        # Build a feature dict that aligns with GTZAN-style features when possible
        feature_dict = {
            "duration_ms": int(duration_ms),
            "length": float(librosa.get_duration(y=y, sr=sr)),
            "tempo": float(tempo),
            "energy": float(np.clip(float(energy), 0, 1)),
            "danceability": float(np.clip(float(danceability), 0, 1)),
            "valence": float(np.clip(float(valence), 0, 1)),
            "acousticness": float(np.clip(float(acousticness), 0, 1)),
            "instrumentalness": float(np.clip(float(instrumentalness), 0, 1)),
            "key": int(key),
            "mode": int(mode),
            # GTZAN / numeric features
            "chroma_stft_mean": float(np.clip(float(chroma_mean), -1, 1)),
            "chroma_stft_var": float(np.clip(float(chroma_var), 0, 10)),
            "rms_mean": float(np.clip(float(np.mean(rmse)), 0, 1)),
            "rms_var": float(np.clip(float(np.var(rmse)), 0, 1)),
            "spectral_centroid_mean": float(np.mean(spectral_centroid)),
            "spectral_centroid_var": float(np.var(spectral_centroid)),
            "spectral_bandwidth_mean": float(spectral_bandwidth_mean),
            "spectral_bandwidth_var": float(spectral_bandwidth_var),
            "rolloff_mean": float(spectral_rolloff_mean),
            "rolloff_var": float(spectral_rolloff_var),
            "zero_crossing_rate_mean": float(np.mean(zcr)),
            "zero_crossing_rate_var": float(np.var(zcr)),
            "harmony_mean": float(harmony_mean),
            "harmony_var": float(harmony_var),
            "perceptr_mean": float(perceptr_mean),
            "perceptr_var": float(perceptr_var),
            "spectral_contrast": float(np.clip(float(spectral_contrast_mean), 0, 1)),
            "tempogram_strength": float(np.clip(float(tempogram_strength), 0, 1)),
            "tonnetz": float(np.clip(float(tonnetz_mean), -1, 1)),
        }

        # MFCC mean/var features (1..20)
        for i in range(20):
            mean_name = f"mfcc{i+1}_mean"
            var_name = f"mfcc{i+1}_var"
            vals = mfcc[i] if i < mfcc.shape[0] else np.zeros(1)
            feature_dict[mean_name] = float(np.mean(vals))
            feature_dict[var_name] = float(np.var(vals))

        # Return feature dictionary
        return feature_dict
    except Exception as e:
        print(f"Error extracting features from {file_path}: {e}")
        import traceback
        traceback.print_exc()
        raise


def compute_danceability(y: np.ndarray, sr: int, tempo: float) -> float:
    """
    Compute danceability based on tempo, onset strength, and energy regularity.
    Higher tempo + regular beats = more danceable.
    """
    # Onset strength (beat regularity)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_mean = to_native_python(np.mean(onset_env))
    
    # Normalize tempo (assuming 60-180 BPM is typical)
    tempo_norm = to_native_python(np.clip(tempo / 120.0, 0.5, 1.5))
    
    # Combine tempo and onset strength
    danceability = to_native_python((tempo_norm * 0.6) + (onset_mean * 0.4))
    return danceability


def compute_acousticness(spectral_centroid: np.ndarray, zcr: np.ndarray) -> float:
    """
    Compute acousticness based on zero crossing rate.
    High ZCR = acoustic (percussive, natural instruments like drums, guitars, vocals).
    Low ZCR = electronic/synthetic (smooth synths, EDM, drum machines).
    """
    zcr_mean = float(np.mean(zcr))
    zcr_norm = float(np.clip(zcr_mean, 0, 1))
    
    # Direct relationship: higher ZCR = more acoustic
    acousticness = float(zcr_norm)
    return acousticness


def compute_valence(mfcc: np.ndarray, spectral_centroid: np.ndarray) -> float:
    """
    Compute valence (musical positivity) based on MFCC and spectral brightness.
    High spectral centroid + certain MFCC patterns = more positive/valent.
    """
    # Spectral brightness (higher = brighter/happier)
    sc_mean = float(np.mean(spectral_centroid))
    sc_norm = float(np.clip(sc_mean / 5000.0, 0, 1))
    
    # MFCC-based brightness (higher MFCC coefficients suggest brightness)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_val = float(mfcc_mean[1])
    mfcc_brightness = float(np.clip(mfcc_val / 100.0, 0, 1))
    
    valence = float((sc_norm * 0.5) + (mfcc_brightness * 0.5))
    return valence


def compute_instrumentalness(zcr: np.ndarray, energy: float) -> float:
    """
    Compute instrumentalness based on zero crossing rate.
    High ZCR = vocals present = low instrumentalness.
    Low ZCR = no clear vocals (could be instrumental or electronic synths).
    """
    zcr_mean = float(np.mean(zcr))
    zcr_norm = float(np.clip(zcr_mean, 0, 1))
    
    # High ZCR = vocals = less instrumental
    # Low ZCR = no vocals = more instrumental, but cap it so synths aren't too instrumental
    # Range: 0.3 (high ZCR/vocals) to 0.8 (low ZCR/no vocals)
    instrumentalness = float((1 - zcr_norm) * 0.5 + 0.3)
    
    return float(np.clip(instrumentalness, 0, 1))


def categorize_genre_and_mood(features: Dict[str, float], file_path: str = None) -> tuple:
    """
    Categorize genre and mood using ML-based classification.
    
    Uses trained ML models to classify audio into genres with confidence scores.
    
    Args:
        features: Dictionary of audio features from librosa
        file_path: Path to audio file (optional, for logging)
        
    Returns:
        Tuple of (genre, mood)
    """
    try:
        # Use ML-based classification
        genre, classification_data = classify_with_features(features)
        
        # Extract mood from tags
        mood = extract_mood_from_tags(classification_data.get('tags', []))
        
        print(f"✓ ML Classified: genre={genre}, mood={mood}, confidence={classification_data.get('confidence', 0):.2%}")
        return genre, mood
        
    except Exception as e:
        print(f"⚠ ML classification error: {e}, falling back to rule-based")
        return categorize_genre_and_mood_rule_based(features)


def extract_mood_from_tags(tags: list) -> str:
    """
    Extract primary mood from Essentia tags.
    
    Args:
        tags: List of tags from Essentia
        
    Returns:
        Mood category
    """
    # Map Essentia tags to mood categories
    mood_priority = ['happy', 'sad', 'calm', 'aggressive', 'energetic', 'acoustic', 'instrumental']
    
    for mood in mood_priority:
        if mood in tags:
            return mood
    
    # Default mood
    return 'neutral'


def categorize_genre_and_mood_rule_based(features: Dict[str, float]) -> tuple:
    """
    Rule-based genre and mood categorization based on features.
    This is the fallback when Essentia service is unavailable.
    """
    tempo = features.get("tempo", 0)
    energy = features.get("energy", 0)
    danceability = features.get("danceability", 0)
    valence = features.get("valence", 0)
    acousticness = features.get("acousticness", 0)
    
    # Genre categorization
    if acousticness > 0.7:
        genre = "acoustic"
    elif tempo > 140 and danceability > 0.6:
        genre = "edm" if energy > 0.7 else "dance"
    elif tempo < 90:
        genre = "ambient" if energy < 0.4 else "hip-hop"
    elif acousticness < 0.3 and energy > 0.7:
        genre = "rock"
    else:
        genre = "pop"
    
    # Mood categorization
    if valence > 0.6 and energy > 0.5:
        mood = "happy"
    elif valence < 0.4 and energy < 0.5:
        mood = "sad"
    elif valence > 0.6 and energy < 0.4:
        mood = "calm"
    elif valence < 0.4 and energy > 0.6:
        mood = "aggressive"
    else:
        mood = "neutral"
    
    return genre, mood

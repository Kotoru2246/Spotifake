"""
Genre Classification Client

Loads a trained ML model (if available) and classifies incoming
feature dictionaries. Falls back to rule-based classification
from `genre_classifier_v3` when the model is missing or low-confidence.
"""

import os
import joblib
from typing import Dict, Tuple, Optional

try:
    # Prefer package-relative import when running as package
    from BackendAI.genre_classifier_v3 import classify_genre as rule_classify_genre, detect_mood, get_supported_genres
except Exception:
    from genre_classifier_v3 import classify_genre as rule_classify_genre, detect_mood, get_supported_genres

# Model globals
MODEL = None
LABEL_ENCODER = None
FEATURE_NAMES = None


def _load_model():
    global MODEL, LABEL_ENCODER, FEATURE_NAMES
    if MODEL is not None:
        return
    base = os.path.dirname(__file__)
    candidates = [os.path.join(base, 'models', 'combined_genre_rf.joblib'),
                  os.path.join(base, 'models', 'gtzan_genre_rf.joblib'),
                  os.path.join(base, 'models', 'genre_rf.joblib')]
    for p in candidates:
        if os.path.exists(p):
            try:
                obj = joblib.load(p)
                MODEL = obj.get('model')
                LABEL_ENCODER = obj.get('label_encoder')
                FEATURE_NAMES = list(getattr(MODEL, 'feature_names_in_', []))
                print(f"✓ Loaded ML model from {p} with {len(FEATURE_NAMES)} features")
                return
            except Exception as e:
                print(f"⚠ Failed loading model {p}: {e}")
    print("ℹ No trained ML model found; using rule-based classifier only")



def classify_audio(file_path: str) -> Tuple[Optional[str], Optional[Dict]]:
    """
    Classify audio file for genre and mood.
    
    Args:
        file_path: Path to audio file (used for logging only)
        
    Returns:
        Tuple of (genre, classification_data)
        Where classification_data contains:
        - genre: Primary genre
        - confidence: Confidence score (0-1)
        - genre_scores: Top genre scores
        - tags: Mood/feature tags
    """
    # Note: features should be passed separately by the caller
    # This function is a convenience wrapper that extracts features
    # then calls `classify_with_features`.
    try:
        # delayed import to avoid circular imports
        try:
            from audio_features import extract_audio_features
        except Exception:
            from BackendAI.audio_features import extract_audio_features
        features = extract_audio_features(file_path)
        return classify_with_features(features)
    except Exception as e:
        print(f"⚠ classify_audio error: {e}")
        return None, None


def classify_with_features(features: Dict[str, float]) -> Tuple[str, Dict]:
    """
    Classify audio using extracted features (primary method).
    
    Args:
        features: Dictionary of audio features from librosa
        
    Returns:
        Tuple of (genre, classification_data)
    """
    _load_model()

    # If we have a trained model, try ML prediction first
    if MODEL is not None and FEATURE_NAMES:
        try:
            import numpy as _np

            def _get_val(name: str):
                # Map feature names expected by the model to our extractor keys
                if name == 'length':
                    return float(features.get('length', features.get('duration_ms', 0) / 1000.0))
                if name in ('chroma_stft_mean',):
                    return float(features.get('chroma_stft_mean', features.get('chroma_mean', 0)))
                if name == 'chroma_stft_var':
                    return float(features.get('chroma_stft_var', 0))
                if name in ('rms_mean',):
                    return float(features.get('rms_mean', features.get('rmse', 0)))
                if name == 'rms_var':
                    return float(features.get('rms_var', 0))
                if name == 'spectral_centroid_mean':
                    return float(features.get('spectral_centroid_mean', 0))
                if name == 'spectral_centroid_var':
                    return float(features.get('spectral_centroid_var', 0))
                if name == 'spectral_bandwidth_mean':
                    return float(features.get('spectral_bandwidth_mean', features.get('spectral_bandwidth', 0)))
                if name == 'spectral_bandwidth_var':
                    return float(features.get('spectral_bandwidth_var', 0))
                if name in ('rolloff_mean',):
                    return float(features.get('rolloff_mean', features.get('spectral_rolloff', 0)))
                if name == 'rolloff_var':
                    return float(features.get('rolloff_var', features.get('spectral_rolloff_var', 0)))
                if name == 'zero_crossing_rate_mean':
                    return float(features.get('zero_crossing_rate_mean', 0))
                if name == 'zero_crossing_rate_var':
                    return float(features.get('zero_crossing_rate_var', 0))
                if name in ('harmony_mean', 'harmony_var'):
                    return float(features.get(name, 0))
                if name in ('perceptr_mean', 'perceptr_var'):
                    return float(features.get(name, 0))
                if name == 'tempo':
                    return float(features.get('tempo', 120))
                # MFCCs
                if name.startswith('mfcc'):
                    return float(features.get(name, 0))
                # default fallback
                return float(features.get(name, features.get(name.replace('_mean',''), 0)))

            x = _np.array([[_get_val(n) for n in FEATURE_NAMES]], dtype=float)
            probs = MODEL.predict_proba(x)[0]
            class_indices = list(MODEL.classes_)
            class_names = [LABEL_ENCODER.classes_[int(i)] for i in class_indices]
            scores = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
            sorted_scores = dict(sorted(scores.items(), key=lambda x: x[1], reverse=True)[:5])
            primary = max(scores, key=scores.get)
            confidence = float(scores[primary])
            mood_tags = detect_mood(features)

            return primary, {
                'genre': primary,
                'confidence': confidence,
                'genre_scores': sorted_scores,
                'all_scores': scores,
                'tags': mood_tags,
                'features': {k: features.get(k) for k in ['tempo','energy','danceability','acousticness','valence','instrumentalness','key','mode']}
            }
        except Exception as e:
            print(f"⚠ ML prediction failed: {e}, falling back to rules")

    # Fallback to rule-based classifier
    primary, data = rule_classify_genre(features)
    tags = detect_mood(features)
    data['tags'] = tags
    return primary, data


def get_supported_genres_list() -> list:
    """Get list of supported genres"""
    return get_supported_genres()


def is_service_available() -> bool:
    """Check if classification service is available (always true for Python version)"""
    return True


if __name__ == '__main__':
    # Test the classifier
    print("Testing ML Genre Classifier...")
    
    test_features = {
        'tempo': 130,
        'energy': 0.75,
        'danceability': 0.8,
        'acousticness': 0.1,
        'valence': 0.6,
        'instrumentalness': 0.2,
        'key': 7,
        'mode': 1,
        'duration_ms': 240000
    }
    
    genre, data = classify_with_features(test_features)
    print(f"✓ Genre: {genre}")
    print(f"✓ Confidence: {data['confidence']:.2%}")
    print(f"✓ Genres: {data['genre_scores']}")
    print(f"✓ Mood: {data['tags']}")

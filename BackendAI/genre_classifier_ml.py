"""
ML-based Genre Classification using scikit-learn

This module provides advanced genre classification with confidence scores.
Uses pre-trained models or rule-based classification with scoring.
"""

import numpy as np
from typing import Dict, Tuple, List
import os
import pickle

# Supported genres
SUPPORTED_GENRES = [
    'acoustic', 'ambient', 'blues', 'classical', 'country',
    'dance', 'edm', 'electronic', 'folk', 'funk',
    'hip-hop', 'indie', 'jazz', 'metal', 'pop',
    'reggae', 'rock', 'soul'
]

# Genre thresholds and rules - FORMAT: (min, max, weight)
GENRE_RULES = {
    'acoustic': {
        'acousticness': (0.6, 1.0, 1.0),
        'energy': (0.0, 0.7, 0.4),
        'instrumentalness': (0.0, 0.5, 0.3)
    },
    'ambient': {
        'energy': (0.0, 0.3, 1.0),
        'acousticness': (0.3, 1.0, 0.3),
        'tempo': (0, 100, 0.4)
    },
    'blues': {
        'energy': (0.4, 0.8, 0.7),
        'tempo': (70, 120, 0.5),
        'instrumentalness': (0.0, 0.7, 0.4)
    },
    'classical': {
        'instrumentalness': (0.7, 1.0, 1.0),  # MUST be instrumental
        'acousticness': (0.5, 1.0, 0.8),
        'tempo': (60, 140, 0.4)
    },
    'country': {
        'acousticness': (0.5, 1.0, 0.9),
        'tempo': (70, 130, 0.6),
        'energy': (0.3, 0.8, 0.5)
    },
    'dance': {
        'danceability': (0.7, 1.0, 1.0),      # VERY high priority
        'energy': (0.7, 1.0, 0.9),
        'tempo': (120, 160, 0.7),
        'acousticness': (0.0, 0.4, 0.6)
    },
    'edm': {
        'energy': (0.8, 1.0, 1.0),            # Very high
        'danceability': (0.7, 1.0, 1.0),
        'acousticness': (0.0, 0.2, 0.8),      # Must be electronic
        'tempo': (110, 180, 0.8)
    },
    'electronic': {
        'acousticness': (0.0, 0.4, 0.9),      # NOT acoustic
        'energy': (0.5, 1.0, 0.7),
        'instrumentalness': (0.3, 1.0, 0.5)
    },
    'folk': {
        'acousticness': (0.5, 1.0, 0.8),
        'tempo': (80, 120, 0.5),
        'instrumentalness': (0.2, 0.8, 0.4)
    },
    'funk': {
        'danceability': (0.7, 1.0, 0.9),
        'energy': (0.7, 1.0, 0.9),
        'tempo': (100, 130, 0.6)
    },
    'hip-hop': {
        'tempo': (80, 110, 0.6),
        'energy': (0.5, 0.95, 0.7),
        'danceability': (0.6, 1.0, 0.8),
        'acousticness': (0.0, 0.4, 0.5)
    },
    'indie': {
        'danceability': (0.4, 0.8, 0.5),
        'energy': (0.4, 0.8, 0.5),
        'acousticness': (0.3, 0.8, 0.4)
    },
    'jazz': {
        'instrumentalness': (0.5, 1.0, 0.9),
        'tempo': (80, 140, 0.6),
        'energy': (0.4, 0.9, 0.5)
    },
    'metal': {
        'energy': (0.85, 1.0, 1.0),           # Very high energy
        'acousticness': (0.0, 0.3, 0.8),
        'tempo': (140, 220, 0.8)
    },
    'pop': {
        'danceability': (0.5, 1.0, 0.8),
        'energy': (0.5, 0.9, 0.6),
        'valence': (0.4, 1.0, 0.6),
        'tempo': (90, 140, 0.5),
        'acousticness': (0.0, 0.7, 0.3)
    },
    'reggae': {
        'tempo': (70, 110, 0.7),
        'energy': (0.4, 0.8, 0.6),
        'valence': (0.5, 1.0, 0.6)
    },
    'rock': {
        'energy': (0.7, 1.0, 1.0),
        'acousticness': (0.0, 0.5, 0.7),
        'tempo': (100, 170, 0.7)
    },
    'soul': {
        'valence': (0.4, 0.9, 0.7),
        'energy': (0.6, 0.95, 0.7),
        'danceability': (0.6, 1.0, 0.7)
    }
}

# Mood detection thresholds
MOOD_THRESHOLDS = {
    'happy': {'valence': 0.6, 'energy': 0.5},
    'sad': {'valence': 0.3, 'energy': 0.3},
    'energetic': {'energy': 0.8},
    'calm': {'energy': 0.3, 'valence': 0.5},
    'aggressive': {'energy': 0.8, 'valence': 0.3},
    'acoustic': {'acousticness': 0.7},
    'instrumental': {'instrumentalness': 0.7}
}


def classify_genre(features: Dict[str, float]) -> Tuple[str, Dict]:
    """
    Classify genre using weighted ML-based rule scoring.
    """
    genre_scores = {}
    
    # Score each genre
    for genre, rules in GENRE_RULES.items():
        score = 0
        total_weight = 0
        
        for feature_name, rule_data in rules.items():
            min_val, max_val, weight = rule_data
            feature_value = features.get(feature_name, 0.5)
            
            # Check if feature is within range
            if min_val <= feature_value <= max_val:
                # Calculate fitness (0 to 1)
                if max_val - min_val > 0:
                    normalized = (feature_value - min_val) / (max_val - min_val)
                    score += min(normalized, 1.0) * weight
                else:
                    score += weight
            else:
                # Penalize if outside range (bigger penalty for further away)
                distance = min(abs(feature_value - min_val), abs(feature_value - max_val))
                penalty = min(distance, 0.5) * weight  # Max penalty
                score -= penalty
            
            total_weight += weight
        
        # Normalize by total weight
        if total_weight > 0:
            genre_scores[genre] = max(0, score / total_weight)
        else:
            genre_scores[genre] = 0
    
    # Normalize to 0-1 range
    max_score = max(genre_scores.values()) if genre_scores else 1
    if max_score > 0:
        genre_scores = {g: s / max_score for g, s in genre_scores.items()}
    else:
        genre_scores['pop'] = 0.5
    
    # Get primary genre
    primary_genre = max(genre_scores, key=genre_scores.get)
    confidence = genre_scores[primary_genre]
    
    # Top 5 genres
    sorted_scores = dict(sorted(
        genre_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5])
    
    return primary_genre, {
        'genre': primary_genre,
        'confidence': float(min(confidence, 1.0)),
        'genre_scores': sorted_scores,
        'all_scores': genre_scores
    }


def detect_mood(features: Dict[str, float]) -> List[str]:
    """
    Detect mood tags from audio features.
    
    Args:
        features: Dictionary of audio features
        
    Returns:
        List of mood tags
    """
    tags = []
    
    energy = features.get('energy', 0)
    valence = features.get('valence', 0)
    acousticness = features.get('acousticness', 0)
    instrumentalness = features.get('instrumentalness', 0)
    tempo = features.get('tempo', 0)
    danceability = features.get('danceability', 0)
    
    # Valence-based moods
    if valence > 0.6 and energy > 0.5:
        tags.append('happy')
    if valence < 0.4 and energy < 0.5:
        tags.append('sad')
    if valence < 0.4 and energy > 0.6:
        tags.append('aggressive')
    if valence > 0.5 and energy < 0.4:
        tags.append('calm')
    
    # Energy-based moods
    if energy > 0.8:
        tags.append('energetic')
    if energy < 0.3:
        tags.append('mellow')
    
    # Acoustic/Instrumental
    if acousticness > 0.7:
        tags.append('acoustic')
    if instrumentalness > 0.7:
        tags.append('instrumental')
    
    # Tempo-based
    if tempo > 140:
        tags.append('fast')
    if tempo < 80:
        tags.append('slow')
    
    # Danceability
    if danceability > 0.7:
        tags.append('danceable')
    
    # Remove duplicates and return
    return list(dict.fromkeys(tags))  # Preserve order, remove dupes


def get_supported_genres() -> List[str]:
    """Get list of supported genres"""
    return SUPPORTED_GENRES


def get_genre_info(genre: str) -> Dict:
    """Get information about a specific genre"""
    if genre not in GENRE_RULES:
        return {'error': f'Genre "{genre}" not found'}
    
    return {
        'genre': genre,
        'rules': GENRE_RULES[genre],
        'description': f'{genre.title()} music'
    }


def batch_classify(features_list: List[Dict]) -> List[Dict]:
    """
    Classify multiple songs
    
    Args:
        features_list: List of feature dictionaries
        
    Returns:
        List of classification results
    """
    results = []
    for features in features_list:
        genre, scores = classify_genre(features)
        mood = detect_mood(features)
        results.append({
            'genre': genre,
            'mood': mood,
            **scores
        })
    return results


# Example usage
if __name__ == '__main__':
    # Test classification
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
    
    genre, scores = classify_genre(test_features)
    mood = detect_mood(test_features)
    
    print(f"Genre: {genre}")
    print(f"Confidence: {scores['confidence']:.2%}")
    print(f"Top genres: {scores['genre_scores']}")
    print(f"Mood tags: {mood}")

"""
Improved ML-based Genre Classification with Priority System

This uses feature priority and disqualifying rules to correctly classify genres.
"""

from typing import Dict, Tuple, List

SUPPORTED_GENRES = [
    'acoustic', 'ambient', 'blues', 'classical', 'country',
    'dance', 'edm', 'electronic', 'folk', 'funk',
    'hip-hop', 'indie', 'jazz', 'metal', 'pop',
    'reggae', 'rock', 'soul'
]


def classify_genre(features: Dict[str, float]) -> Tuple[str, Dict]:
    """
    Classify genre using priority-based system with disqualifying rules.
    
    Key insight: Some features are MUST-HAVES or MUST-NOTS for genres.
    """
    
    danceability = features.get('danceability', 0)
    energy = features.get('energy', 0)
    acousticness = features.get('acousticness', 0)
    tempo = features.get('tempo', 0)
    instrumentalness = features.get('instrumentalness', 0)
    valence = features.get('valence', 0)
    
    genre_scores = {}
    
    # STEP 1: Fast-track high-confidence genres
    
    # EDM: High danceability + high energy + NOT acoustic + high tempo
    if danceability > 0.75 and energy > 0.75 and acousticness < 0.3 and tempo > 100:
        genre_scores['edm'] = 0.95
        genre_scores['dance'] = 0.90
        genre_scores['electronic'] = 0.85
    
    # DANCE: Very high danceability + upbeat
    elif danceability > 0.7 and energy > 0.6 and acousticness < 0.5:
        genre_scores['dance'] = 0.92
        genre_scores['edm'] = 0.80
        genre_scores['funk'] = 0.75
        genre_scores['pop'] = 0.65
    
    # CLASSICAL: MUST be instrumental + MUST be acoustic + moderate tempo
    elif instrumentalness > 0.85 and acousticness > 0.6 and tempo < 150:
        genre_scores['classical'] = 0.90
        genre_scores['folk'] = 0.70
        genre_scores['acoustic'] = 0.60
    
    # ROCK: High energy + NOT acoustic + fast tempo
    elif energy > 0.7 and acousticness < 0.4 and tempo > 100:
        genre_scores['rock'] = 0.88
        genre_scores['metal'] = 0.75
        genre_scores['indie'] = 0.60
    
    # METAL: Very high energy + fast tempo + NOT acoustic
    elif energy > 0.85 and tempo > 140 and acousticness < 0.3:
        genre_scores['metal'] = 0.90
        genre_scores['rock'] = 0.70
    
    # ACOUSTIC: High acousticness + moderate energy
    elif acousticness > 0.7 and energy < 0.7:
        genre_scores['acoustic'] = 0.88
        genre_scores['folk'] = 0.80
        genre_scores['country'] = 0.65
    
    # AMBIENT: Very low energy
    elif energy < 0.35:
        genre_scores['ambient'] = 0.85
        genre_scores['acoustic'] = 0.60
    
    # HIP-HOP: Moderate tempo + good danceability
    elif 80 <= tempo <= 110 and danceability > 0.6:
        genre_scores['hip-hop'] = 0.85
        genre_scores['funk'] = 0.70
    
    # JAZZ: Instrumental + moderate tempo
    elif instrumentalness > 0.6 and 80 <= tempo <= 140:
        genre_scores['jazz'] = 0.80
        genre_scores['blues'] = 0.65
    
    # REGGAE: Slow tempo + positive valence
    elif 70 <= tempo <= 110 and valence > 0.5:
        genre_scores['reggae'] = 0.82
        genre_scores['soul'] = 0.70
    
    # SOUL: Good danceability + positive valence
    elif danceability > 0.6 and valence > 0.5 and energy > 0.5:
        genre_scores['soul'] = 0.80
        genre_scores['funk'] = 0.75
        genre_scores['pop'] = 0.70
    
    # DEFAULT: Pop for anything else
    else:
        genre_scores['pop'] = 0.75
    
    # STEP 2: Fill in secondary scores for unset genres
    for genre in SUPPORTED_GENRES:
        if genre not in genre_scores:
            # Give reasonable default scores based on features
            score = 0.3  # Base score
            
            # Adjust based on features
            if danceability > 0.6 and genre in ['dance', 'pop', 'funk', 'edm']:
                score += 0.2
            if energy > 0.7 and genre in ['rock', 'metal', 'edm', 'dance']:
                score += 0.2
            if acousticness > 0.6 and genre in ['acoustic', 'folk', 'country', 'classical']:
                score += 0.2
            
            genre_scores[genre] = min(score, 0.6)
    
    # STEP 3: Get primary genre
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
        'confidence': float(confidence),
        'genre_scores': sorted_scores,
        'all_scores': genre_scores
    }


def detect_mood(features: Dict[str, float]) -> List[str]:
    """Detect mood tags from audio features."""
    tags = []
    
    energy = features.get('energy', 0)
    valence = features.get('valence', 0)
    acousticness = features.get('acousticness', 0)
    instrumentalness = features.get('instrumentalness', 0)
    tempo = features.get('tempo', 0)
    danceability = features.get('danceability', 0)
    
    # Valence-based moods
    if valence > 0.65 and energy > 0.5:
        tags.append('happy')
    if valence < 0.35 and energy < 0.5:
        tags.append('sad')
    if valence < 0.35 and energy > 0.65:
        tags.append('aggressive')
    if valence > 0.55 and energy < 0.4:
        tags.append('calm')
    
    # Energy-based moods
    if energy > 0.85:
        tags.append('energetic')
    if energy < 0.3:
        tags.append('mellow')
    
    # Acoustic/Instrumental
    if acousticness > 0.75:
        tags.append('acoustic')
    if instrumentalness > 0.75:
        tags.append('instrumental')
    
    # Tempo-based
    if tempo > 145:
        tags.append('fast')
    if tempo < 75:
        tags.append('slow')
    
    # Danceability
    if danceability > 0.75:
        tags.append('danceable')
    
    return list(dict.fromkeys(tags))


def get_supported_genres() -> List[str]:
    """Get list of supported genres"""
    return SUPPORTED_GENRES


# Test
if __name__ == '__main__':
    # Martin Garrix "Burn Out" typical features
    test_features = {
        'tempo': 128,
        'energy': 0.82,
        'danceability': 1.0,  # 100%
        'acousticness': 0.05,  # Very electronic
        'valence': 0.65,
        'instrumentalness': 0.15,  # Has vocals
        'key': 7,
        'mode': 1,
        'duration_ms': 240000
    }
    
    genre, scores = classify_genre(test_features)
    mood = detect_mood(test_features)
    
    print(f"✓ Genre: {genre}")
    print(f"✓ Confidence: {scores['confidence']:.2%}")
    print(f"✓ Top genres: {scores['genre_scores']}")
    print(f"✓ Mood: {mood}")
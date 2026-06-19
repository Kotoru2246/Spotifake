"""Genre Classifier v3 - Fixed for edge cases"""
from typing import Dict, Tuple, List

SUPPORTED_GENRES = [
    'acoustic', 'ambient', 'blues', 'classical', 'country',
    'dance', 'edm', 'electronic', 'folk', 'funk',
    'hip-hop', 'indie', 'jazz', 'metal', 'pop',
    'reggae', 'rock', 'soul'
]

def classify_genre(features: Dict[str, float]) -> Tuple[str, Dict]:
    """Classify genre with high danceability priority"""
    
    danceability = features.get('danceability', 0)
    energy = features.get('energy', 0)
    acousticness = features.get('acousticness', 0)
    tempo = features.get('tempo', 120)
    instrumentalness = features.get('instrumentalness', 0)
    valence = features.get('valence', 0)
    
    genre_scores = {}
    
    # PRIORITY 1: Very high danceability = EDM/Dance (even with moderate energy)
    if danceability > 0.75:
        if acousticness < 0.3:  # Electronic
            genre_scores['edm'] = 0.95
            genre_scores['dance'] = 0.92
            genre_scores['electronic'] = 0.88
        else:  # Acoustic but danceable
            genre_scores['dance'] = 0.90
            genre_scores['pop'] = 0.85
    
    # High danceability + good energy
    elif danceability > 0.7 and energy > 0.5:
        genre_scores['dance'] = 0.90
        genre_scores['edm'] = 0.85
        genre_scores['pop'] = 0.80
    
    # Classical: MUST be instrumental AND acoustic
    elif instrumentalness > 0.85 and acousticness > 0.65:
        genre_scores['classical'] = 0.90
        genre_scores['folk'] = 0.70
    
    # Rock/Metal: High energy + not acoustic
    elif energy > 0.75 and acousticness < 0.4:
        genre_scores['rock'] = 0.88
        genre_scores['metal'] = 0.75 if tempo > 140 else 0.65
    
    # Acoustic: High acousticness
    elif acousticness > 0.7:
        genre_scores['acoustic'] = 0.88
        genre_scores['folk'] = 0.80
    
    # Ambient: Very low energy
    elif energy < 0.35:
        genre_scores['ambient'] = 0.85
    
    # Default
    else:
        genre_scores['pop'] = 0.75
    
    # Fill remaining
    for genre in SUPPORTED_GENRES:
        if genre not in genre_scores:
            genre_scores[genre] = 0.3
    
    primary_genre = max(genre_scores, key=genre_scores.get)
    confidence = genre_scores[primary_genre]
    
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
    """Detect mood tags"""
    tags = []
    energy = features.get('energy', 0)
    valence = features.get('valence', 0)
    danceability = features.get('danceability', 0)
    acousticness = features.get('acousticness', 0)
    
    if valence > 0.6 and energy > 0.5:
        tags.append('happy')
    if valence < 0.4 and energy < 0.5:
        tags.append('sad')
    if energy > 0.8:
        tags.append('energetic')
    if danceability > 0.75:
        tags.append('danceable')
    if acousticness > 0.7:
        tags.append('acoustic')
    
    return list(dict.fromkeys(tags))

def get_supported_genres() -> List[str]:
    return SUPPORTED_GENRES
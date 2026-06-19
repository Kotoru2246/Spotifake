from genre_classifier_v3 import classify_genre, detect_mood

# Test with Martin Garrix "Burn Out" features
test_features = {
    'tempo': 120,
    'energy': 0.98,
    'danceability': 0.95,
    'acousticness': 0.1,
    'valence': 0.65,
    'instrumentalness': 0.15,
    'key': 7,
    'mode': 1,
    'duration_ms': 240000
}

genre, scores = classify_genre(test_features)
mood = detect_mood(test_features)

print(f"\n✓ Genre: {genre}")
print(f"✓ Confidence: {scores['confidence']:.2%}")
print(f"✓ Top genres: {scores['genre_scores']}")
print(f"✓ Mood: {mood}")
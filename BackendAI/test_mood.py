import sys
import os

# Add BackendAI to path if running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from audio_features import extract_audio_features, categorize_genre_and_mood

def test_mood_detection():
    songs = [
        r"C:\Music\APT..mp3",
        r"C:\Music\SON TUNG M-TP x TYGA  COME MY WAY  OFFICIAL MUSIC VIDEO.mp3",
        r"C:\Music\Faded.mp3"
    ]
    
    for song in songs:
        print(f"\n--- Testing Mood Detection ---")
        print(f"Song: {os.path.basename(song)}")
        
        if not os.path.exists(song):
            print("File not found.")
            continue
            
        try:
            print("Extracting features (this might take a few seconds)...")
            features = extract_audio_features(song)
            
            print(f"Raw Features - Valence: {features.get('valence', 0):.2f}, Energy: {features.get('energy', 0):.2f}")
            
            genre, mood = categorize_genre_and_mood(features, song)
            print(f"Result -> Genre: {genre} | Mood: {mood}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_mood_detection()

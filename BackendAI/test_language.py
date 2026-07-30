import sys
import os

# Add BackendAI to path if running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from language_detector import detect_language

def test_songs():
    songs = [
        r"C:\Music\APT..mp3",
        r"C:\Music\SON TUNG M-TP x TYGA  COME MY WAY  OFFICIAL MUSIC VIDEO.mp3",
        r"C:\Music\Faded.mp3"
    ]
    
    for song in songs:
        print(f"\nDetecting language for: {song}")
        if os.path.exists(song):
            lang = detect_language(song)
            print(f"Result: {lang}")
        else:
            print("File not found.")

if __name__ == "__main__":
    test_songs()

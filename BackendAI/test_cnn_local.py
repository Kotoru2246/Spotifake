import os
import glob
from cnn_spectrogram_classifier import CnnSpectrogramClassifier

def test_cnn_on_uploads():
    print("🤖 Loading CNN Spectrogram Model...")
    try:
        clf = CnnSpectrogramClassifier()
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return

    # Find all mp3 files in the uploads folder
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    test_files = glob.glob(os.path.join(upload_dir, '*.mp3'))

    if not test_files:
        print(f"⚠️ No .mp3 files found in {upload_dir} to test!")
        return

    print(f"\n🎵 Found {len(test_files)} songs in 'uploads' to test. Starting predictions...\n")

    for filepath in test_files:
        filename = os.path.basename(filepath)
        print(f"---------------------------------------------------")
        print(f"🎶 Analyzing: {filename}")
        
        try:
            result = clf.predict(filepath)
            
            # Print the Top Prediction
            print(f"🏆 Top Prediction: {result['genre'].upper()} ({result['confidence']*100:.1f}%)")
            
            # Print Top 3 alternative probabilities
            print("📊 Top 3 Scores:")
            top_3 = list(result['all_probs'].items())[:3]
            for genre, prob in top_3:
                bar = '█' * int(prob * 20)
                print(f"   {genre:<12} {prob*100:5.1f}% {bar}")
                
        except Exception as e:
            print(f"❌ Error analyzing {filename}: {e}")
            
    print(f"---------------------------------------------------")
    print("✅ Testing complete!")

if __name__ == "__main__":
    test_cnn_on_uploads()

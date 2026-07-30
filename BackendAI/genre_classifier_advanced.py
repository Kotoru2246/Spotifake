import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from .audio_features_advanced import extract_audio_features

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'genre_best_model.joblib')

class GenreClassifierV4:
    def __init__(self):
        self.model = None
        self.le = None
        self.scaler = None
        self.feature_cols = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            print(f"Warning: Model not found at {MODEL_PATH}. Cannot classify.")
            return
            
        data = joblib.load(MODEL_PATH)
        self.model = data.get('model')
        self.le = data.get('label_encoder')
        self.scaler = data.get('scaler')
        self.feature_cols = data.get('feature_cols')

    def classify_genre(self, file_path: str) -> Tuple[str, Dict]:
        """
        Classifies an audio file using the trained XGBoost/RF FMA model.
        Returns the primary genre and confidence scores.
        """
        if not self.model:
            return "unknown", {"error": "Model not loaded"}

        # 1. Extract raw features from audio at 3 different points
        percentages = [0.25, 0.50, 0.75]
        all_probas = []
        
        for pct in percentages:
            print(f"  [DEBUG] Extracting features at {pct*100}% mark...")
            raw_features = extract_audio_features(file_path, offset_pct=pct)
            if not raw_features:
                continue
                
            # 2. Format into exactly what the model expects
            X_dict = {col: raw_features.get(col, 0.0) for col in self.feature_cols}
            X_df = pd.DataFrame([X_dict])
            
            # 3. Scale features
            X_scaled = self.scaler.transform(X_df)
            
            # 4. Predict probabilities
            probas = self.model.predict_proba(X_scaled)[0]
            all_probas.append(probas)
            
        if not all_probas:
            return "unknown", {"error": "Failed to extract features from any segment"}
            
        # Average the probabilities across all 3 segments
        print(f"  [DEBUG] Averaging probabilities across {len(all_probas)} segments...")
        avg_probas = np.mean(all_probas, axis=0)
        
        # 5. Format results
        print(f"  [DEBUG] Formatting results...")
        class_names = self.le.classes_
        genre_scores = {class_names[i]: float(avg_probas[i]) for i in range(len(class_names))}
        
        # Sort by confidence
        sorted_scores = dict(sorted(genre_scores.items(), key=lambda item: item[1], reverse=True))
        
        primary_genre = list(sorted_scores.keys())[0]
        confidence = sorted_scores[primary_genre]
        
        return primary_genre, {
            'genre': primary_genre,
            'confidence': confidence,
            'genre_scores': dict(list(sorted_scores.items())[:5]), # Top 5
            'all_scores': sorted_scores
        }

# Singleton instance
classifier_service = GenreClassifierV4()

def classify_genre(file_path: str) -> Tuple[str, Dict]:
    return classifier_service.classify_genre(file_path)

if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python genre_classifier_advanced.py <path_to_audio_file>")
        sys.exit(1)
        
    test_file = sys.argv[1]
    if not os.path.exists(test_file):
        print(f"Error: File not found -> {test_file}")
        sys.exit(1)
        
    print(f"Extracting features and classifying: {test_file} ...\n")
    primary_genre, details = classify_genre(test_file)
    
    print(f"== PREDICTED GENRE: {primary_genre.upper()} ==\n")
    print("Full Confidence Scores:")
    print(json.dumps(details.get('genre_scores', details), indent=2))

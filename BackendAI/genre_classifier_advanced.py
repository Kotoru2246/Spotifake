

--- VERSION ---

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from audio_features_advanced import extract_audio_features

MODEL_PATH = 'ml_models/genre_best_model.joblib'

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

        # 1. Extract raw features from audio
        raw_features = extract_audio_features(file_path)
        if not raw_features:
            return "unknown", {"error": "Failed to extract features"}

        # 2. Format into exactly what the model expects
        # Any missing features will be filled with 0.0
        X_dict = {col: raw_features.get(col, 0.0) for col in self.feature_cols}
        X_df = pd.DataFrame([X_dict])
        
        # 3. Scale features
        X_scaled = self.scaler.transform(X_df)
        
        # 4. Predict probabilities
        probas = self.model.predict_proba(X_scaled)[0]
        
        # 5. Format results
        class_names = self.le.classes_
        genre_scores = {class_names[i]: float(probas[i]) for i in range(len(class_names))}
        
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

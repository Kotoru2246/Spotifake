import os
import pandas as pd
from pathlib import Path
from tqdm import tqdm

import sys
sys.path.append("BackendAI")
from audio_features_advanced import extract_audio_features

def extract_gtzan_features(gtzan_labels_csv="gtzan_data/labels.csv", output_csv="gtzan_data/gtzan_unified_features.csv"):
    if not os.path.exists(gtzan_labels_csv):
        print(f"Error: {gtzan_labels_csv} not found. Ensure GTZAN is downloaded.")
        return
        
    labels_df = pd.read_csv(gtzan_labels_csv)
    gtzan_root = Path("gtzan_data/Data/genres_original")
        
    print(f"Found {len(labels_df)} GTZAN tracks. Extracting features...")
    
    rows = []
    
    for idx, row in tqdm(labels_df.iterrows(), total=len(labels_df), desc="Extracting"):
        rel_path = row['filename']
        genre = row['genre']
        
        full_path = gtzan_root / rel_path
        if not full_path.exists():
            continue
            
        features = extract_audio_features(str(full_path))
        if features:
            features['track_id'] = f"gtzan_{idx}"
            features['mapped_genre'] = genre
            rows.append(features)
            
    if not rows:
        print("No features extracted.")
        return
        
    features_df = pd.DataFrame(rows)
    # Set track_id as index to match FMA format
    features_df.set_index('track_id', inplace=True)
    
    features_df.to_csv(output_csv)
    print(f"Successfully extracted {len(features_df)} songs and saved to {output_csv}")
    
if __name__ == "__main__":
    extract_gtzan_features()

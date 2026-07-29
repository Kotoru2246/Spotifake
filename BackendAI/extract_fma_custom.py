import os
import glob
import warnings
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed

# Ignore audio warnings to keep the progress bar clean
warnings.filterwarnings("ignore")

from audio_features_advanced import extract_audio_features

def process_file(file_path):
    import sys, os
    sys.stdout = open(os.devnull, 'w') # Suppress all debug prints from audio_features_advanced
    try:
        track_id = int(Path(file_path).stem)
        features = extract_audio_features(file_path, offset_pct=0.5)
        if features:
            features['track_id'] = track_id
            return features
    except Exception as e:
        pass
    return None

def main():
    print("Loading mapped_labels.csv...")
    labels_df = pd.read_csv("fma_data/mapped_labels.csv")
    valid_track_ids = set(labels_df['track_id'])
    
    print("Scanning FMA mp3 files...")
    all_files = glob.glob("fma_data/fma_medium/**/*.mp3", recursive=True)
    
    files_to_process = []
    for f in all_files:
        try:
            tid = int(Path(f).stem)
            if tid in valid_track_ids:
                files_to_process.append(f)
        except Exception:
            pass
            
    print(f"Found {len(files_to_process)} FMA tracks to extract.")
    
    results = []
    
    # Use max_workers=8 to not completely kill the computer, or os.cpu_count()
    workers = min(os.cpu_count() or 4, 12)
    print(f"Starting ProcessPoolExecutor with {workers} workers...")
    
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process_file, f): f for f in files_to_process}
        
        # Use smoothing in tqdm for better ETA estimation
        for future in tqdm(as_completed(futures), total=len(futures), desc="Extracting FMA Features", smoothing=0.1):
            res = future.result()
            if res:
                results.append(res)
                
    if not results:
        print("No features extracted.")
        return
        
    print("Formatting dataframe...")
    df = pd.DataFrame(results)
    df.set_index('track_id', inplace=True)
    
    output_csv = "fma_data/fma_custom_features.csv"
    df.to_csv(output_csv)
    print(f"Successfully extracted {len(df)} tracks and saved to {output_csv}")

if __name__ == "__main__":
    main()

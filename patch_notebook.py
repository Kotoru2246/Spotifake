import json

def patch_notebook():
    path = "BackendAI/FMA_Model_Competition.ipynb"
    with open(path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    new_source = [
        "# Paths to our generated files\n",
        "FEATURES_PATH = 'fma_data/metadata/fma_metadata/features.csv'\n",
        "LABELS_PATH = 'fma_data/mapped_labels.csv'\n",
        "GTZAN_FEATURES_PATH = 'gtzan_data/gtzan_unified_features.csv'\n",
        "\n",
        "print(\"Loading FMA features...\")\n",
        "features = pd.read_csv(FEATURES_PATH, index_col=0, header=[0, 1, 2])\n",
        "features.columns = ['_'.join(col).strip() for col in features.columns.values]\n",
        "labels = pd.read_csv(LABELS_PATH)\n",
        "labels.set_index('track_id', inplace=True)\n",
        "df_fma = features.join(labels, how='inner')\n",
        "\n",
        "print(\"Loading GTZAN features...\")\n",
        "df_gtzan = pd.read_csv(GTZAN_FEATURES_PATH, index_col='track_id')\n",
        "\n",
        "print(f\"FMA tracks: {len(df_fma)} | GTZAN tracks: {len(df_gtzan)}\")\n",
        "\n",
        "# Find intersection of columns to safely merge them\n",
        "common_cols = list(set(df_fma.columns) & set(df_gtzan.columns))\n",
        "df = pd.concat([df_fma[common_cols], df_gtzan[common_cols]], ignore_index=True)\n",
        "print(f\"Combined dataset shape: {df.shape}\")\n",
        "\n",
        "target = 'mapped_genre'\n",
        "selected_cols = [c for c in df.columns if any(x in c for x in ['mfcc', 'spectral', 'zcr', 'chroma']) and ('mean' in c or 'std' in c)]\n",
        "print(f\"Selected {len(selected_cols)} feature columns for training.\")\n",
        "\n",
        "X = df[selected_cols].fillna(0)\n",
        "y = df[target]\n",
        "\n",
        "le = LabelEncoder()\n",
        "y_enc = le.fit_transform(y)\n",
        "\n",
        "X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)\n",
        "\n",
        "scaler = StandardScaler()\n",
        "X_train_scaled = scaler.fit_transform(X_train)\n",
        "X_test_scaled = scaler.transform(X_test)\n",
        "\n",
        "print(\"Data preprocessing complete!\")\n"
    ]
    
    # Update cell 3 (index 3)
    nb['cells'][3]['source'] = new_source
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)

if __name__ == "__main__":
    patch_notebook()

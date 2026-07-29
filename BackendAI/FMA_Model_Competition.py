#!/usr/bin/env python
# coding: utf-8

# # FMA Medium Genre Classification - Model Competition
# 
# This notebook trains three different models (Random Forest, XGBoost, and LightGBM) on the massive pre-computed FMA `features.csv` file. It evaluates their performance, runs Hyperparameter Tuning on the winner, and saves the final model.

# In[ ]:


import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier

import xgboost as xgb
import lightgbm as lgb

import warnings
warnings.filterwarnings('ignore')


# ## 1. Data Loading & Preprocessing

# In[ ]:


# Paths to our generated files
FEATURES_PATH = 'fma_data/fma_custom_features.csv'
LABELS_PATH = 'fma_data/mapped_labels.csv'
GTZAN_FEATURES_PATH = 'gtzan_data/gtzan_unified_features.csv'

print("Loading FMA features...")
features = pd.read_csv(FEATURES_PATH, index_col='track_id')
labels = pd.read_csv(LABELS_PATH)
labels.set_index('track_id', inplace=True)
df_fma = features.join(labels, how='inner')

print("Loading GTZAN features...")
df_gtzan = pd.read_csv(GTZAN_FEATURES_PATH, index_col='track_id')

print(f"FMA tracks: {len(df_fma)} | GTZAN tracks: {len(df_gtzan)}")

# Find intersection of columns to safely merge them
common_cols = list(set(df_fma.columns) & set(df_gtzan.columns))

# Unify 'hip-hop' (FMA) and 'hiphop' (GTZAN) so the AI doesn't double-count them!
df_fma['mapped_genre'] = df_fma['mapped_genre'].replace({'hip-hop': 'hiphop'})

# Cap FMA at 2000 tracks per genre to prevent massive imbalance
df_fma = df_fma.groupby('mapped_genre').head(2000)
print(f"FMA tracks after capping: {len(df_fma)}")

# Check for custom training data contributed by users
custom_path = 'fma_data/custom_training_data.csv'

# Always ensure sample_weight is available
if 'sample_weight' not in common_cols:
    common_cols.append('sample_weight')

df_fma['sample_weight'] = 1.0
df_gtzan['sample_weight'] = 10.0 # 10x multiplier for pure GTZAN tracks!

if os.path.exists(custom_path):
    print("Loading user-contributed custom training data...")
    df_custom = pd.read_csv(custom_path)
    df_custom['sample_weight'] = 5.0 # Give custom data a boost too
    df = pd.concat([df_fma[common_cols], df_gtzan[common_cols], df_custom[common_cols]], ignore_index=True)
else:
    df = pd.concat([df_fma[common_cols], df_gtzan[common_cols]], ignore_index=True)

print(f"Combined dataset shape: {df.shape}")

target = 'mapped_genre'
selected_cols = [c for c in df.columns if any(x in c for x in ['mfcc', 'spectral', 'zcr']) and ('mean' in c or 'std' in c)]
print(f"Selected {len(selected_cols)} feature columns for training.")

X = df[selected_cols].fillna(0)
y = df[target]

le = LabelEncoder()
y_enc = le.fit_transform(y)

if 'sample_weight' in df.columns:
    w = df['sample_weight'].fillna(1.0).values
else:
    w = np.ones(len(y_enc))

X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
    X, y_enc, w, test_size=0.2, random_state=42, stratify=y_enc
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Data preprocessing complete!")


# ## 2. Model Arena: Training Models

# In[ ]:


models = {
    "Random Forest": RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42, n_jobs=-1),
    "XGBoost": xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, eval_metric='mlogloss'),
    "LightGBM": lgb.LGBMClassifier(n_estimators=100, learning_rate=0.1, class_weight='balanced', random_state=42, n_jobs=-1)
}

results = {}
best_model_name = None
best_model_score = 0
best_model_obj = None

for name, model in models.items():
    print(f"Training {name}...")
    try:
        model.fit(X_train_scaled, y_train, sample_weight=w_train)
    except TypeError:
        model.fit(X_train_scaled, y_train) # Fallback if model doesn't support sample_weight
    y_pred = model.predict(X_test_scaled)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')

    results[name] = {'Model': model, 'Accuracy': acc, 'F1': f1, 'Predictions': y_pred}

    if f1 > best_model_score:
        best_model_score = f1
        best_model_name = name
        best_model_obj = model

print("\n--- Model Training Complete ---")


# ## 3. Leaderboard & Visualizations

# In[ ]:


print("========== LEADERBOARD ==========")
for name, res in sorted(results.items(), key=lambda x: x[1]['F1'], reverse=True):
    print(f"{name}: Accuracy = {res['Accuracy']:.4f}, F1-Score = {res['F1']:.4f}")
print("=================================")
print(f"WINNER: {best_model_name}!")

# Confusion Matrix for the winner
plt.figure(figsize=(10, 8))
cm = confusion_matrix(y_test, results[best_model_name]['Predictions'])
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=le.classes_, yticklabels=le.classes_)
plt.title(f"{best_model_name} Confusion Matrix")
plt.ylabel('True Genre')
plt.xlabel('Predicted Genre')
plt.tight_layout()
# plt.show()


# ## 4. Hyperparameter Tuning

# In[ ]:


print("Running RandomizedSearchCV on LightGBM to squeeze out more performance...")
lgb_model = lgb.LGBMClassifier(class_weight='balanced', random_state=42, n_jobs=2)

param_dist = {
    'learning_rate': [0.01, 0.05, 0.1, 0.2],
    'n_estimators': [100, 200, 300],
    'num_leaves': [31, 50, 100],
    'max_depth': [-1, 10, 20]
}

# n_iter=5 for a quick but effective search
random_search = RandomizedSearchCV(lgb_model, param_distributions=param_dist, n_iter=5, 
                                   cv=3, scoring='f1_weighted', random_state=42, n_jobs=2, verbose=1)

random_search.fit(X_train_scaled, y_train, sample_weight=w_train)
print(f"Best params found: {random_search.best_params_}")

best_tuned_model = random_search.best_estimator_
y_pred_tuned = best_tuned_model.predict(X_test_scaled)
tuned_f1 = f1_score(y_test, y_pred_tuned, average='weighted')
tuned_acc = accuracy_score(y_test, y_pred_tuned)

print(f"Tuned LightGBM F1: {tuned_f1:.4f} | Accuracy: {tuned_acc:.4f}")

# Override if tuned model is better
if tuned_f1 > best_model_score:
    print("Tuned model is better! Overriding the winner...")
    best_model_score = tuned_f1
    best_model_obj = best_tuned_model
    best_model_name = "Tuned LightGBM"
else:
    print("Original model remained the best.")


# ## 5. Saving the Best Model

# In[ ]:


# We save the model, the label encoder (to map indices back to genre names), 
# the scaler (to scale new uploads), and the exact list of feature columns.

out_path = 'ml_models/genre_best_model.joblib'
os.makedirs('ml_models', exist_ok=True)

save_data = {
    'model': best_model_obj,
    'label_encoder': le,
    'scaler': scaler,
    'feature_cols': selected_cols
}

joblib.dump(save_data, out_path)
print(f"Successfully saved the winning model ({best_model_name}) and assets to {out_path}!")



--- VERSION ---

# Find intersection of columns to safely merge them
common_cols = list(set(df_fma.columns) & set(df_gtzan.columns))

# Check for custom training data contributed by users
custom_path = 'fma_data/custom_training_data.csv'
if os.path.exists(custom_path):
    print("Loading user-contributed custom training data...")
    df_custom = pd.read_csv(custom_path)
    # Ensure sample_weight column is available in df if it wasn't
    if 'sample_weight' not in common_cols:
        common_cols.append('sample_weight')
        df_fma['sample_weight'] = 1.0
        df_gtzan['sample_weight'] = 1.0
    df = pd.concat([df_fma[common_cols], df_gtzan[common_cols], df_custom[common_cols]], ignore_index=True)
else:
    df = pd.concat([df_fma[common_cols], df_gtzan[common_cols]], ignore_index=True)

print(f"Combined dataset shape: {df.shape}")
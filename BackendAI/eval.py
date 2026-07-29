import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

FEATURES_PATH = 'fma_data/metadata/fma_metadata/features.csv'
LABELS_PATH = 'fma_data/mapped_labels.csv'
GTZAN_FEATURES_PATH = 'gtzan_data/gtzan_unified_features.csv'

features = pd.read_csv(FEATURES_PATH, index_col=0, header=[0, 1, 2])
features.columns = ['_'.join(col).strip() for col in features.columns.values]
labels = pd.read_csv(LABELS_PATH)
labels.set_index('track_id', inplace=True)
df_fma = features.join(labels, how='inner')

df_gtzan = pd.read_csv(GTZAN_FEATURES_PATH, index_col='track_id')

common_cols = list(set(df_fma.columns) & set(df_gtzan.columns))
df = pd.concat([df_fma[common_cols], df_gtzan[common_cols]], ignore_index=True)

target = 'mapped_genre'
selected_cols = [c for c in df.columns if any(x in c for x in ['mfcc', 'spectral', 'zcr', 'chroma']) and ('mean' in c or 'std' in c)]

X = df[selected_cols].fillna(0)
y = df[target]

model_data = joblib.load('ml_models/genre_best_model.joblib')
clf = model_data['model']
le = model_data['label_encoder']
scaler = model_data['scaler']

y_enc = le.transform(y)
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

X_test = X_test[scaler.feature_names_in_]
X_test_scaled = scaler.transform(X_test)
y_pred = clf.predict(X_test_scaled)

print(classification_report(y_test, y_pred, target_names=le.classes_))


--- VERSION ---

import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

FEATURES_PATH = 'fma_data/metadata/fma_metadata/features.csv'
LABELS_PATH = 'fma_data/mapped_labels.csv'
GTZAN_FEATURES_PATH = 'gtzan_data/gtzan_unified_features.csv'

features = pd.read_csv(FEATURES_PATH, index_col=0, header=[0, 1, 2])
features.columns = ['_'.join(col).strip() for col in features.columns.values]
labels = pd.read_csv(LABELS_PATH)
labels.set_index('track_id', inplace=True)
df_fma = features.join(labels, how='inner')

df_gtzan = pd.read_csv(GTZAN_FEATURES_PATH, index_col='track_id')

common_cols = list(set(df_fma.columns) & set(df_gtzan.columns))
df = pd.concat([df_fma[common_cols], df_gtzan[common_cols]], ignore_index=True)

target = 'mapped_genre'
selected_cols = [c for c in df.columns if any(x in c for x in ['mfcc', 'spectral', 'zcr', 'chroma']) and ('mean' in c or 'std' in c)]

X = df[selected_cols].fillna(0)
y = df[target]

model_data = joblib.load('ml_models/genre_best_model.joblib')
clf = model_data['model']
le = model_data['label_encoder']
scaler = model_data['scaler']

y_enc = le.transform(y)
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

X_test = X_test[scaler.feature_names_in_]
X_test_scaled = scaler.transform(X_test)
y_pred = clf.predict(X_test_scaled)

print(classification_report(y_test, y_pred, target_names=le.classes_))
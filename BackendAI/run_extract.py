from data_extraction import extract_dataset
import os

extract_dataset('labels.csv', 'uploads', 'features.csv')
print('exists', os.path.exists('features.csv'))
if os.path.exists('features.csv'):
    import pandas as pd
    df = pd.read_csv('features.csv')
    print('rows', len(df))

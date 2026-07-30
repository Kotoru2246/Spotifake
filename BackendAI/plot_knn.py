import sys
import os
import matplotlib.pyplot as plt
import numpy as np
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors

def generate_knn_plot():
    np.random.seed(42)
    # Generate 5 playlist songs that are tightly clustered in dimensions 0, 1 but varied in 2, 3, 4, 5
    playlist_vectors = np.random.rand(5, 6)
    playlist_vectors[:, 0] = np.random.normal(0.8, 0.05, 5) # High, tight
    playlist_vectors[:, 1] = np.random.normal(0.2, 0.05, 5) # Low, tight
    # 2-5 are high variance (0 to 1 uniform)

    # Generate 100 candidate songs randomly
    candidate_vectors = np.random.rand(100, 6)
    
    # 1. Unweighted Space
    unweighted_vibe = np.mean(playlist_vectors, axis=0).reshape(1, -1)
    knn1 = NearestNeighbors(metric='cosine', algorithm='brute')
    knn1.fit(candidate_vectors)
    uw_distances, uw_indices = knn1.kneighbors(unweighted_vibe, n_neighbors=3)
    uw_recs = uw_indices[0]
    
    # 2. Weighted Space
    variances = np.var(playlist_vectors, axis=0)
    epsilon = 1e-5
    weights = 1.0 / (variances + epsilon)
    weights = weights / np.sum(weights) * len(weights)
    
    weighted_playlist = playlist_vectors * weights
    weighted_candidates = candidate_vectors * weights
    weighted_vibe = np.mean(weighted_playlist, axis=0).reshape(1, -1)
    
    knn2 = NearestNeighbors(metric='cosine', algorithm='brute')
    knn2.fit(weighted_candidates)
    w_distances, w_indices = knn2.kneighbors(weighted_vibe, n_neighbors=3)
    w_recs = w_indices[0]
    
    # Plotting with PCA to 2D
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # PCA on unweighted
    pca1 = PCA(n_components=2)
    all_unweighted = np.vstack([playlist_vectors, candidate_vectors, unweighted_vibe])
    pca1_res = pca1.fit_transform(all_unweighted)
    
    ax1.scatter(pca1_res[5:-1, 0], pca1_res[5:-1, 1], c='gray', alpha=0.5, label='Candidates')
    ax1.scatter(pca1_res[:5, 0], pca1_res[:5, 1], c='blue', s=100, label='Playlist Seeds')
    ax1.scatter(pca1_res[-1, 0], pca1_res[-1, 1], c='green', s=150, marker='X', label='Vibe (Mean)')
    # Highlight recommended
    for rec_idx in uw_recs:
        ax1.scatter(pca1_res[5+rec_idx, 0], pca1_res[5+rec_idx, 1], c='red', s=120, edgecolors='black', label='Recommended (Unweighted)' if rec_idx==uw_recs[0] else '')
        
    ax1.set_title('Standard KNN (Equal Weights)')
    ax1.legend()
    
    # PCA on weighted
    pca2 = PCA(n_components=2)
    all_weighted = np.vstack([weighted_playlist, weighted_candidates, weighted_vibe])
    pca2_res = pca2.fit_transform(all_weighted)
    
    ax2.scatter(pca2_res[5:-1, 0], pca2_res[5:-1, 1], c='gray', alpha=0.5, label='Candidates')
    ax2.scatter(pca2_res[:5, 0], pca2_res[:5, 1], c='blue', s=100, label='Playlist Seeds')
    ax2.scatter(pca2_res[-1, 0], pca2_res[-1, 1], c='green', s=150, marker='X', label='Vibe (Weighted Mean)')
    # Highlight recommended
    for rec_idx in w_recs:
        ax2.scatter(pca2_res[5+rec_idx, 0], pca2_res[5+rec_idx, 1], c='magenta', s=120, edgecolors='black', label='Recommended (Weighted)' if rec_idx==w_recs[0] else '')
        
    ax2.set_title('Smart Shuffle KNN (Variance-Weighted)')
    ax2.legend()
    
    plt.suptitle('KNN Acoustic Feature Space Projection (PCA)')
    plt.tight_layout()
    out_path = r'C:\Users\jacky\.gemini\antigravity-ide\brain\2df181a7-0794-45ae-a5e9-dfd1b9ee367c\knn_visualization.png'
    plt.savefig(out_path)
    print(f'Saved plot to {out_path}')

if __name__ == '__main__':
    generate_knn_plot()

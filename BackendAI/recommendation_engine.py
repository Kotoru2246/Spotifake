import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.cluster import KMeans

class AcousticRecommendationEngine:
    def __init__(self):
        """
        Initializes the Recommendation Engine.
        Uses Cosine Similarity (via NearestNeighbors with cosine metric) 
        because magnitude doesn't matter as much as the directional angle of the acoustic features.
        """
        self.knn = NearestNeighbors(metric='cosine', algorithm='brute')
        
    def _fit_model(self, candidate_vectors: np.ndarray):
        """Helper to fit the KNN model on the candidate pool."""
        self.knn.fit(candidate_vectors)

    def get_smart_shuffle(self, playlist_vectors: np.ndarray, candidate_vectors: np.ndarray, candidate_ids: list, n_recommendations: int = 1):
        """
        Smart Shuffle: Given the features of all songs in a playlist, 
        finds unplayed songs in the database that are most acoustically similar to the playlist vibe.
        Applies feature weighting based on variance: highly consistent traits get higher weight.
        """
        if len(playlist_vectors) == 0 or len(candidate_vectors) == 0:
            return []
            
        # Calculate variances for each feature across the playlist
        # If variance is low, the trait is common/consistent, so weight should be higher.
        variances = np.var(playlist_vectors, axis=0)
        epsilon = 1e-5
        weights = 1.0 / (variances + epsilon)
        
        # Normalize weights
        weights = weights / np.sum(weights) * len(weights)
        
        # Apply weights to scale the acoustic space
        weighted_playlist_vectors = playlist_vectors * weights
        weighted_candidate_vectors = candidate_vectors * weights
            
        # Calculate the "Vibe" (average weighted feature vector of the playlist)
        playlist_vibe = np.mean(weighted_playlist_vectors, axis=0).reshape(1, -1)
        
        # Find nearest neighbors in the candidate pool
        self._fit_model(weighted_candidate_vectors)
        distances, indices = self.knn.kneighbors(playlist_vibe, n_neighbors=n_recommendations)
        
        recommendations = [candidate_ids[i] for i in indices[0]]
        return recommendations

    def get_similar_artists(self, target_artist_vector: np.ndarray, all_artist_vectors: np.ndarray, all_artist_names: list, n_recommendations: int = 3):
        """
        Similar Artists: Given the average feature vector of an artist's discography,
        find other artists with similar overall acoustic textures.
        """
        if len(all_artist_vectors) == 0:
            return []
            
        target = target_artist_vector.reshape(1, -1)
        self._fit_model(all_artist_vectors)
        
        # n_neighbors + 1 to account for the artist themselves if they are in the pool
        distances, indices = self.knn.kneighbors(target, n_neighbors=n_recommendations + 1)
        
        similar_artists = []
        for i in indices[0]:
            # Don't recommend the artist themselves
            if distances[0][list(indices[0]).index(i)] > 1e-6:
                similar_artists.append(all_artist_names[i])
                if len(similar_artists) == n_recommendations:
                    break
                    
        return similar_artists

    def generate_daily_mixes(self, user_history_vectors: np.ndarray, candidate_vectors: np.ndarray, candidate_ids: list, n_mixes: int = 3, songs_per_mix: int = 10):
        """
        Daily Mixes: Clusters a user's listening history into distinct "vibes" (e.g. Mix 1 = EDM, Mix 2 = Acoustic),
        and then finds new songs matching each vibe.
        """
        if len(user_history_vectors) < n_mixes or len(candidate_vectors) < songs_per_mix * n_mixes:
            return []
            
        # 1. Cluster the user's history into `n_mixes` distinct clusters
        kmeans = KMeans(n_clusters=n_mixes, random_state=42, n_init=10)
        kmeans.fit(user_history_vectors)
        
        cluster_centers = kmeans.cluster_centers_
        
        # 2. For each cluster center (Vibe), find nearest neighbors in the candidate pool
        self._fit_model(candidate_vectors)
        
        daily_mixes = []
        for i in range(n_mixes):
            center = cluster_centers[i].reshape(1, -1)
            distances, indices = self.knn.kneighbors(center, n_neighbors=songs_per_mix)
            
            mix_songs = [candidate_ids[idx] for idx in indices[0]]
            daily_mixes.append({
                "mix_id": i + 1,
                "songs": mix_songs
            })
            
        return daily_mixes

# Singleton Service
recommendation_service = AcousticRecommendationEngine()

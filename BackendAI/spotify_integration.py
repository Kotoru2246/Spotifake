import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth

load_dotenv()

class SpotifyIntegration:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        # Use a simple redirect URI that doesn't require HTTPS
        self.redirect_uri = "http://127.0.0.1:8888/callback"
        
        self.sp_oauth = SpotifyOAuth(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri,
            scope="user-library-read playlist-read-private playlist-read-collaborative streaming",
            cache_path=".spotifycache"  # Cache the token locally
        )
        self.sp = None

    def get_auth_url(self):
        """Get the Spotify authorization URL for the user to visit."""
        return self.sp_oauth.get_authorize_url()

    def authenticate_with_code(self, auth_code: str):
        """Authenticate with Spotify using the authorization code."""
        try:
            print(f"Attempting to exchange auth code: {auth_code[:20]}...")
            
            # Exchange the auth code for an access token
            token_info = self.sp_oauth.get_access_token(auth_code, as_dict=False, check_cache=False)
            
            print(f"Token info obtained: {token_info is not None}")
            
            if token_info:
                # Create Spotipy instance with the new token
                self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)
                
                # Test the connection by getting current user
                try:
                    user = self.sp.current_user()
                    print(f"Successfully authenticated as: {user.get('display_name', 'Unknown')}")
                    return True
                except Exception as test_err:
                    print(f"Failed to verify authentication: {test_err}")
                    return False
        except Exception as e:
            print(f"Spotify authentication failed: {e}")
            import traceback
            traceback.print_exc()
        
        return False

    def is_authenticated(self):
        """Check if we have a valid token."""
        if self.sp:
            try:
                self.sp.current_user()
                return True
            except:
                return False
        return False

    def get_current_user_tracks(self, limit: int = 50):
        """Fetch user's liked tracks."""
        if not self.sp:
            print("ERROR: Spotify client not initialized. Not authenticated?")
            return []
        
        try:
            print(f"Fetching {limit} liked tracks...")
            results = self.sp.current_user_saved_tracks(limit=limit)
            print(f"Got results: {results is not None}")
            
            tracks = []
            if 'items' in results:
                for item in results['items']:
                    if item and 'track' in item:
                        track = item['track']
                        if track:
                            tracks.append({
                                'id': track.get('id', ''),
                                'name': track.get('name', 'Unknown'),
                                'artist': track.get('artists', [{}])[0].get('name', 'Unknown') if track.get('artists') else 'Unknown',
                                'album': track.get('album', {}).get('name', 'Unknown'),
                                'uri': track.get('uri', ''),
                                'popularity': track.get('popularity', 0),
                                'duration_ms': track.get('duration_ms', 0)
                            })
            
            print(f"Successfully fetched {len(tracks)} tracks")
            return tracks
        except Exception as e:
            print(f"Failed to fetch user tracks: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_playlists(self, limit: int = 20):
        """Fetch user's playlists."""
        if not self.sp:
            return []
        
        try:
            results = self.sp.current_user_playlists(limit=limit)
            playlists = []
            for item in results['items']:
                playlists.append({
                    'id': item['id'],
                    'name': item['name'],
                    'uri': item['uri'],
                    'track_count': item['tracks']['total']
                })
            return playlists
        except Exception as e:
            print(f"Failed to fetch playlists: {e}")
            return []

    def get_playlist_tracks(self, playlist_id: str):
        """Fetch tracks from a specific playlist."""
        if not self.sp:
            return []
        
        try:
            results = self.sp.playlist_tracks(playlist_id)
            tracks = []
            for item in results['items']:
                track = item['track']
                if track:
                    tracks.append({
                        'id': track['id'],
                        'name': track['name'],
                        'artist': track['artists'][0]['name'] if track['artists'] else 'Unknown',
                        'album': track['album']['name'],
                        'uri': track['uri'],
                        'popularity': track['popularity']
                    })
            return tracks
        except Exception as e:
            print(f"Failed to fetch playlist tracks: {e}")
            return []

    def get_track_audio_features(self, track_id: str):
        """Get audio features for a track (used for Smart Shuffle)."""
        if not self.sp:
            return None
        
        try:
            features = self.sp.audio_features(track_id)[0]
            return {
                'energy': features['energy'],
                'danceability': features['danceability'],
                'valence': features['valence'],
                'tempo': features['tempo'],
                'acousticness': features['acousticness'],
                'instrumentalness': features['instrumentalness'],
                'key': features['key'],
                'mode': features['mode']
            }
        except Exception as e:
            print(f"Failed to fetch audio features: {e}")
            return None

    def search_spotify(self, query: str, search_type: str = 'track', limit: int = 20):
        """Search Spotify's entire catalog for tracks, artists, playlists, etc."""
        if not self.sp:
            print("ERROR: Not authenticated")
            return []
        
        try:
            print(f"Searching Spotify for: {query} (type: {search_type})")
            # Spotify search API has a max limit of 50 but sometimes has issues with larger values
            # Use max 20 to ensure compatibility
            safe_limit = min(limit, 20)
            results = self.sp.search(q=query, type=search_type, limit=safe_limit)
            
            if search_type == 'track':
                tracks = []
                for item in results.get('tracks', {}).get('items', []):
                    tracks.append({
                        'id': item.get('id', ''),
                        'name': item.get('name', 'Unknown'),
                        'artist': item.get('artists', [{}])[0].get('name', 'Unknown') if item.get('artists') else 'Unknown',
                        'album': item.get('album', {}).get('name', 'Unknown'),
                        'uri': item.get('uri', ''),
                        'popularity': item.get('popularity', 0),
                        'duration_ms': item.get('duration_ms', 0)
                    })
                return tracks
            
        except Exception as e:
            print(f"Failed to search Spotify: {e}")
            import traceback
            traceback.print_exc()
        
        return []

using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace DesktopClient.Services
{
    public class SpotifyTrack
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Album { get; set; } = string.Empty;
        public string Uri { get; set; } = string.Empty;
        public int Popularity { get; set; }
        public int DurationMs { get; set; }

        public override string ToString()
        {
            return $"{Name} - {Artist}";
        }
    }

    public class SpotifyPlaylist
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Uri { get; set; } = string.Empty;
        public int TrackCount { get; set; }
    }

    public class SpotifyServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _backendUrl;

        public SpotifyServiceClient(string backendUrl = "http://127.0.0.1:8000")
        {
            _backendUrl = backendUrl;
            _httpClient = new HttpClient();
        }

        public async Task<string> GetAuthenticationUrlAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_backendUrl}/spotify/auth-url");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(content);
                    return json.RootElement.GetProperty("auth_url").GetString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting auth URL: {ex.Message}");
            }
            return string.Empty;
        }

        public async Task<bool> AuthenticateWithCodeAsync()
        {
            try
            {
                var response = await _httpClient.PostAsync(
                    $"{_backendUrl}/spotify/authenticate-with-code",
                    null);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error authenticating with code: {ex.Message}");
                return false;
            }
        }

        public async Task<List<SpotifyTrack>> GetUserTracksAsync(int limit = 50)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_backendUrl}/spotify/tracks?limit={limit}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(content);
                    var tracks = new List<SpotifyTrack>();

                    foreach (var item in json.RootElement.GetProperty("tracks").EnumerateArray())
                    {
                        tracks.Add(new SpotifyTrack
                        {
                            Id = item.GetProperty("id").GetString() ?? string.Empty,
                            Name = item.GetProperty("name").GetString() ?? string.Empty,
                            Artist = item.GetProperty("artist").GetString() ?? string.Empty,
                            Album = item.GetProperty("album").GetString() ?? string.Empty,
                            Uri = item.GetProperty("uri").GetString() ?? string.Empty,
                            Popularity = item.GetProperty("popularity").GetInt32(),
                            DurationMs = item.GetProperty("duration_ms").GetInt32()
                        });
                    }

                    return tracks;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching user tracks: {ex.Message}");
            }
            return new List<SpotifyTrack>();
        }

        public async Task<List<SpotifyPlaylist>> GetPlaylistsAsync(int limit = 20)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_backendUrl}/spotify/playlists?limit={limit}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(content);
                    var playlists = new List<SpotifyPlaylist>();

                    foreach (var item in json.RootElement.GetProperty("playlists").EnumerateArray())
                    {
                        playlists.Add(new SpotifyPlaylist
                        {
                            Id = item.GetProperty("id").GetString() ?? string.Empty,
                            Name = item.GetProperty("name").GetString() ?? string.Empty,
                            Uri = item.GetProperty("uri").GetString() ?? string.Empty,
                            TrackCount = item.GetProperty("track_count").GetInt32()
                        });
                    }

                    return playlists;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching playlists: {ex.Message}");
            }
            return new List<SpotifyPlaylist>();
        }

        public async Task<List<SpotifyTrack>> GetPlaylistTracksAsync(string playlistId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_backendUrl}/spotify/playlist/{playlistId}/tracks");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(content);
                    var tracks = new List<SpotifyTrack>();

                    foreach (var item in json.RootElement.GetProperty("tracks").EnumerateArray())
                    {
                        tracks.Add(new SpotifyTrack
                        {
                            Id = item.GetProperty("id").GetString() ?? string.Empty,
                            Name = item.GetProperty("name").GetString() ?? string.Empty,
                            Artist = item.GetProperty("artist").GetString() ?? string.Empty,
                            Album = item.GetProperty("album").GetString() ?? string.Empty,
                            Uri = item.GetProperty("uri").GetString() ?? string.Empty,
                            Popularity = item.GetProperty("popularity").GetInt32()
                        });
                    }

                    return tracks;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching playlist tracks: {ex.Message}");
            }
            return new List<SpotifyTrack>();
        }

        public async Task<List<SpotifyTrack>> SearchTracksAsync(string query, int limit = 50)
        {
            try
            {
                var encodedQuery = System.Uri.EscapeDataString(query);
                var response = await _httpClient.GetAsync($"{_backendUrl}/spotify/search?query={encodedQuery}&search_type=track&limit={limit}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var json = JsonDocument.Parse(content);
                    var tracks = new List<SpotifyTrack>();

                    foreach (var item in json.RootElement.GetProperty("results").EnumerateArray())
                    {
                        tracks.Add(new SpotifyTrack
                        {
                            Id = item.GetProperty("id").GetString() ?? string.Empty,
                            Name = item.GetProperty("name").GetString() ?? string.Empty,
                            Artist = item.GetProperty("artist").GetString() ?? string.Empty,
                            Album = item.GetProperty("album").GetString() ?? string.Empty,
                            Uri = item.GetProperty("uri").GetString() ?? string.Empty,
                            Popularity = item.GetProperty("popularity").GetInt32(),
                            DurationMs = item.GetProperty("duration_ms").GetInt32()
                        });
                    }

                    return tracks;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error searching Spotify: {ex.Message}");
            }
            return new List<SpotifyTrack>();
        }
    }
}

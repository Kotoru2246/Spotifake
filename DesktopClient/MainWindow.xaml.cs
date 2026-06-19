using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using DataAccess;
using DataAccess.Models;
using DataAccess.Services;
using DesktopClient.Services;

namespace DesktopClient
{
    public partial class MainWindow : Window
    {
        private readonly MusicPlayerContext? _context;
        private readonly AudioEngine _audioEngine;
        private readonly SmartShuffleService _smartShuffleService;
        private readonly SpotifyServiceClient _spotifyClient;
        private List<SpotifyTrack> _spotifyTracks = new();
        private List<SpotifyTrack> _searchResults = new();
        private bool _showingSpotify = false;

        public MainWindow()
        {
            InitializeComponent();
            _audioEngine = new AudioEngine();
            _smartShuffleService = new SmartShuffleService();
            _spotifyClient = new SpotifyServiceClient();

            try
            {
                _context = new MusicPlayerContext();
                
                // Force database recreation to ensure fresh data
                _context.Database.EnsureDeleted();
                _context.Database.EnsureCreated();

                // Seed songs from C:\Music directory
                var seedService = new SeedDataService(_context);
                seedService.SeedSampleSongs();
                seedService.SeedSampleUsers();

                LoadSongs();
            }
            catch (Exception ex)
            {
                SongListBox.ItemsSource = Array.Empty<Song>();
                MessageBox.Show(
                    $"Unable to connect to the music database.\n\n{ex.Message}\n\nPlease verify the SQL Server connection and database access.",
                    "Database Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
        }

        private void LoadSongs()
        {
            if (_context == null)
            {
                SongListBox.ItemsSource = Array.Empty<Song>();
                return;
            }

            var songs = _context.Songs.Where(song => !song.IsHidden).OrderBy(song => song.Title).ToList();
            SongListBox.ItemsSource = songs;
            _showingSpotify = false;
            LibraryLabel.Text = "Showing: Local Music";
        }

        private void DisplaySpotifyTracks()
        {
            SongListBox.ItemsSource = _spotifyTracks.OrderBy(t => t.Name).ToList();
            _showingSpotify = true;
            LibraryLabel.Text = $"Showing: Liked Songs ({_spotifyTracks.Count} tracks)";
        }

        private void DisplaySearchResults()
        {
            SongListBox.ItemsSource = _searchResults.OrderBy(t => t.Name).ToList();
            _showingSpotify = true;
            LibraryLabel.Text = $"Search Results ({_searchResults.Count} tracks)";
        }

        private async void BtnSearch_Click(object sender, RoutedEventArgs e)
        {
            string query = SearchBox.Text.Trim();
            if (string.IsNullOrEmpty(query) || query.Length < 2)
            {
                MessageBox.Show("Please enter at least 2 characters to search", "Search", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            try
            {
                BtnSearch.IsEnabled = false;
                BtnSearch.Content = "Searching...";

                var results = await _spotifyClient.SearchTracksAsync(query, 50);
                
                if (results.Count > 0)
                {
                    _searchResults = results;
                    DisplaySearchResults();
                    MessageBox.Show($"Found {results.Count} tracks matching '{query}'", "Search Results", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                else
                {
                    MessageBox.Show($"No tracks found matching '{query}'", "No Results", MessageBoxButton.OK, MessageBoxImage.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Search error: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                BtnSearch.IsEnabled = true;
                BtnSearch.Content = "Search";
            }
        }

        private void BtnLocalMusic_Click(object sender, RoutedEventArgs e)
        {
            LoadSongs();
            MessageBox.Show($"Showing {((List<Song>)SongListBox.ItemsSource).Count} local music files from C:\\Music", "Local Music", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void BtnSpotifyLibrary_Click(object sender, RoutedEventArgs e)
        {
            if (_spotifyTracks.Count == 0)
            {
                MessageBox.Show("Spotify library not loaded yet.\n\nClick 'Connect Spotify' first to authenticate and load your liked tracks.", "Spotify Library Empty", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            DisplaySpotifyTracks();
            MessageBox.Show($"Displaying {_spotifyTracks.Count} tracks from your Spotify liked songs.", "Spotify Library", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private async void BtnAuthSpotify_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                BtnAuthSpotify.IsEnabled = false;
                BtnAuthSpotify.Content = "Opening Browser...";

                // Get the Spotify auth URL from the backend
                var authUrl = await _spotifyClient.GetAuthenticationUrlAsync();
                if (string.IsNullOrEmpty(authUrl))
                {
                    MessageBox.Show(
                        "Failed to get Spotify auth URL from backend.\n\nMake sure the backend service is running on http://127.0.0.1:8000",
                        "Backend Error",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                    return;
                }

                // Open the auth URL in the default browser
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = authUrl,
                    UseShellExecute = true
                });

                // Show instructions
                var result = MessageBox.Show(
                    "Your browser has opened with Spotify authorization.\n\n" +
                    "1. Sign in with your Spotify account\n" +
                    "2. Click 'Agree' to authorize this app\n" +
                    "3. You'll be redirected - wait for the confirmation\n" +
                    "4. Come back here and click OK to load your library",
                    "Spotify Authorization",
                    MessageBoxButton.OKCancel,
                    MessageBoxImage.Information);

                if (result == MessageBoxResult.OK)
                {
                    BtnAuthSpotify.Content = "Authenticating...";
                    
                    // Tell the backend to complete the authentication
                    var success = await _spotifyClient.AuthenticateWithCodeAsync();
                    
                    if (success)
                    {
                        // Fetch liked tracks from Spotify
                        BtnAuthSpotify.Content = "Loading Tracks...";
                        var tracks = await _spotifyClient.GetUserTracksAsync(50);
                        
                        if (tracks.Count > 0)
                        {
                            _spotifyTracks = tracks;
                            DisplaySpotifyTracks();
                            MessageBox.Show(
                                $"Successfully loaded {tracks.Count} liked songs from Spotify!\n\nYour Spotify library is now available to browse and play.",
                                "Spotify Connected",
                                MessageBoxButton.OK,
                                MessageBoxImage.Information);
                        }
                        else
                        {
                            MessageBox.Show(
                                "Authenticated but could not load tracks.\n\nPlease try again.",
                                "Loading Error",
                                MessageBoxButton.OK,
                                MessageBoxImage.Error);
                        }
                    }
                    else
                    {
                        MessageBox.Show(
                            "Failed to authenticate with Spotify.\n\nMake sure you authorized the app in your browser.",
                            "Error",
                            MessageBoxButton.OK,
                            MessageBoxImage.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error connecting to Spotify: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                BtnAuthSpotify.IsEnabled = true;
                BtnAuthSpotify.Content = "Connect Spotify";
            }
        }

        private void BtnPlay_Click(object sender, RoutedEventArgs e)
        {
            if (_showingSpotify)
            {
                if (SongListBox.SelectedItem is SpotifyTrack spotifyTrack)
                {
                    CurrentTrackLabel.Text = $"♪ {spotifyTrack.Name} - {spotifyTrack.Artist}";
                    MessageBox.Show(
                        $"Now Playing: {spotifyTrack.Name}\nBy {spotifyTrack.Artist}\n\nNote: Streaming not yet available. To play, open in Spotify: {spotifyTrack.Uri}",
                        "Spotify Track",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information);
                }
            }
            else
            {
                if (SongListBox.SelectedItem is Song selectedSong)
                {
                    bool success = _audioEngine.PlaySong(selectedSong);
                    if (success)
                    {
                        CurrentTrackLabel.Text = $"♪ {selectedSong.Title} - {selectedSong.ArtistName}";
                    }
                    else
                    {
                        MessageBox.Show(
                            $"Could not play '{selectedSong.Title}'.\n\nAudio file not found at: {selectedSong.FilePath}",
                            "Playback Error",
                            MessageBoxButton.OK,
                            MessageBoxImage.Warning);
                    }
                }
            }
        }

        private void BtnPause_Click(object sender, RoutedEventArgs e)
        {
            _audioEngine.Pause();
        }

        private void BtnStop_Click(object sender, RoutedEventArgs e)
        {
            _audioEngine.Stop();
            CurrentTrackLabel.Text = "No track selected";
        }

        private async void BtnSmartShuffle_Click(object sender, RoutedEventArgs e)
        {
            if (SongListBox.SelectedItem is not Song selectedSong)
            {
                MessageBox.Show("Select a seed track to start Smart Shuffle.", "Smart Shuffle", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            if (_context == null)
            {
                MessageBox.Show("Database connection not available.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var recommendations = await _smartShuffleService.GetRecommendationsAsync(selectedSong.SongID);
            if (!recommendations.Any())
            {
                MessageBox.Show("No recommendations returned from Smart Shuffle.", "Smart Shuffle", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var tracks = _context.Songs.Where(song => recommendations.Contains(song.SongID) && !song.IsHidden).ToList();
            if (tracks.Any())
            {
                bool success = _audioEngine.PlaySong(tracks.First());
                if (success)
                {
                    MessageBox.Show($"Queued {tracks.Count} Smart Shuffle recommendation(s).", "Smart Shuffle", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                else
                {
                    MessageBox.Show($"Could not play recommendation. Audio file not found.", "Playback Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
        }

        private void VolumeSlider_ValueChanged(object sender, System.Windows.RoutedPropertyChangedEventArgs<double> e)
        {
            if (_audioEngine == null)
                return;
            
            float volume = (float)(e.NewValue / 100.0);
            _audioEngine.SetVolume(volume);
            VolumeLabel.Text = $"{(int)e.NewValue}%";
        }
    }
}

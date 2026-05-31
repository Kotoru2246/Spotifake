using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using DataAccess;
using DataAccess.Models;
using DataAccess.Services;

namespace DesktopClient
{
    public partial class MainWindow : Window
    {
        private readonly MusicPlayerContext? _context;
        private readonly AudioEngine _audioEngine;
        private readonly SmartShuffleService _smartShuffleService;

        public MainWindow()
        {
            InitializeComponent();
            _audioEngine = new AudioEngine();
            _smartShuffleService = new SmartShuffleService();

            try
            {
                _context = new MusicPlayerContext();
                _context.Database.EnsureCreated();

                // Seed sample data if database is empty
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
        }

        private void BtnPlay_Click(object sender, RoutedEventArgs e)
        {
            if (SongListBox.SelectedItem is Song selectedSong)
            {
                bool success = _audioEngine.PlaySong(selectedSong);
                if (!success)
                {
                    MessageBox.Show(
                        $"Could not play '{selectedSong.Title}'.\n\nAudio file not found at: {selectedSong.FilePath}",
                        "Playback Error",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
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
    }
}

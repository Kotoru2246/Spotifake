using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using TagLib;

namespace DataAccess.Services
{
    public class MusicScannerService
    {
        private readonly string[] _supportedExtensions = { ".mp3", ".wav", ".flac", ".m4a", ".aac" };

        public List<(string FilePath, string Title, string Artist, int DurationSeconds)> ScanMusicDirectory(string directoryPath)
        {
            var songs = new List<(string, string, string, int)>();

            if (!Directory.Exists(directoryPath))
            {
                return songs;
            }

            try
            {
                var files = System.IO.Directory.GetFiles(directoryPath, "*.*", SearchOption.AllDirectories)
                    .Where(file => _supportedExtensions.Contains(System.IO.Path.GetExtension(file).ToLower()))
                    .ToList();

                foreach (var filePath in files)
                {
                    try
                    {
                        var audioFile = TagLib.File.Create(filePath);
                        if (audioFile.Tag == null)
                        {
                            audioFile.Dispose();
                            continue;
                        }

                        var title = string.IsNullOrWhiteSpace(audioFile.Tag.Title)
                            ? System.IO.Path.GetFileNameWithoutExtension(filePath)
                            : audioFile.Tag.Title.Trim();

                        var artist = string.IsNullOrWhiteSpace(audioFile.Tag.FirstPerformer)
                            ? "Unknown Artist"
                            : audioFile.Tag.FirstPerformer.Trim();

                        var duration = (int)audioFile.Properties.Duration.TotalSeconds;

                        songs.Add((filePath, title, artist, duration));
                        audioFile.Dispose();
                    }
                    catch
                    {
                        // Skip files that can't be read
                        continue;
                    }
                }
            }
            catch
            {
                // Directory scan failed, return empty list
            }

            return songs;
        }
    }
}

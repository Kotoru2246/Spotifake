using System;
using System.IO;
using NAudio.Wave;
using DataAccess.Models;

namespace DesktopClient
{
    public class AudioEngine
    {
        private IWavePlayer? _outputDevice;
        private AudioFileReader? _audioReader;

        public bool PlaySong(Song song)
        {
            if (!File.Exists(song.FilePath))
            {
                return false;
            }

            try
            {
                Stop();
                _audioReader = new AudioFileReader(song.FilePath);
                _outputDevice = new WaveOutEvent();
                _outputDevice.Init(_audioReader);
                _outputDevice.Play();
                return true;
            }
            catch
            {
                Stop();
                return false;
            }
        }

        public void Pause()
        {
            if (_outputDevice?.PlaybackState == PlaybackState.Playing)
            {
                _outputDevice.Pause();
            }
        }

        public void Stop()
        {
            _outputDevice?.Stop();
            _audioReader?.Dispose();
            _outputDevice?.Dispose();
            _audioReader = null;
            _outputDevice = null;
        }

        public void SetVolume(float volume)
        {
            if (_audioReader != null)
            {
                _audioReader.Volume = Math.Clamp(volume, 0f, 1f);
            }
        }
    }
}

// Split from the former site.js (feature: history). See docs/architecture.md.
import { state } from './state.js';
import { API_BASE_URL } from './api.js';

export const HISTORY_STORAGE_KEY = 'spotifake_playback_history';

export const HISTORY_MAX_ENTRIES = 50;

export const SpotifakeHistory = {
  _load() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return { entries: [], stats: { artists: {}, albums: {}, genres: {} }, recentItems: [] };
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { entries: parsed, stats: this._computeStats(parsed), recentItems: [] };
      }
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        stats: parsed.stats || this._computeStats(parsed.entries || []),
        recentItems: Array.isArray(parsed.recentItems) ? parsed.recentItems : []
      };
    } catch (err) {
      console.warn('SpotifakeHistory: failed to read localStorage', err);
      return { entries: [], stats: { artists: {}, albums: {}, genres: {} }, recentItems: [] };
    }
  },

  _computeStats(entries) {
    const artists = {};
    const albums = {};
    const genres = {};
    (entries || []).forEach(item => {
      if (item.artist && item.artist !== 'Unknown Artist') {
        artists[item.artist] = (artists[item.artist] || 0) + 1;
      }
      if (item.album && item.album !== 'Single' && item.album !== 'Unknown Album') {
        albums[item.album] = (albums[item.album] || 0) + 1;
      }
      if (item.genre && item.genre !== 'Uncategorized' && item.genre !== 'Neutral') {
        genres[item.genre] = (genres[item.genre] || 0) + 1;
      }
    });
    return { artists, albums, genres };
  },

  _save(state) {
    try {
      state.entries = (state.entries || []).slice(0, HISTORY_MAX_ENTRIES);
      state.recentItems = (state.recentItems || []).slice(0, 30);
      state.stats = this._computeStats(state.entries);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('SpotifakeHistory: failed to write to localStorage', err);
    }
  },

  getHistory() {
    return this._load().entries;
  },

  getStats() {
    return this._load().stats;
  },

  getRecentItems(limit = 7) {
    const state = this._load();
    return (state.recentItems || []).slice(0, limit);
  },

  recordContainerPlay(container) {
    if (!container) return;
    const state = this._load();
    const now = Date.now();
    const title = (container.name || container.title || '').trim();
    if (!title || title.toLowerCase() === 'liked songs') return;

    const type = container.type === 'Album' ? 'Album' : 'Playlist';
    const key = `${type}:${title.toLowerCase()}`;

    let coverUrl = container.imageUrl || container.coverUrl || '';
    if (!coverUrl && container.songs && container.songs[0]) {
      coverUrl = container.songs[0].coverArtUrl || container.songs[0].coverUrl || '';
    }
    if (!coverUrl && typeof state.tracks !== 'undefined' && state.tracks) {
      const match = state.tracks.find(t => (t.album && t.album.toLowerCase() === title.toLowerCase()) || (t.title && t.title.toLowerCase() === title.toLowerCase()));
      if (match) coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/api/music/cover/${match.id}` : '');
    }

    const artist = container.artist || (container.songs && container.songs[0] ? container.songs[0].artist : '') || '';

    const item = {
      type: type,
      id: container.id || ('container-' + title),
      albumId: container.albumId || (type === 'Album' ? container.id : null),
      playlistId: type === 'Playlist' ? container.id : null,
      title: title,
      artist: artist,
      subtitle: type === 'Album' ? (artist ? `${artist} • Album` : 'Album') : 'Playlist',
      coverUrl: coverUrl,
      timestamp: now
    };

    if (!state.recentItems) state.recentItems = [];
    state.recentItems = state.recentItems.filter(i => `${i.type}:${(i.title || '').toLowerCase()}` !== key);
    state.recentItems.unshift(item);
    this._save(state);

    try {
      window.dispatchEvent(new CustomEvent('spotifake:playRecorded', { detail: item }));
    } catch (e) {}
  },

  getArtistCounts() {
    return this.getStats().artists || {};
  },

  getAlbumCounts() {
    return this.getStats().albums || {};
  },

  getGenreCounts() {
    return this.getStats().genres || {};
  },

  getTopArtists(limit = 5) {
    const counts = this.getArtistCounts();
    return Object.entries(counts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  getTopAlbums(limit = 5) {
    const counts = this.getAlbumCounts();
    return Object.entries(counts)
      .map(([album, count]) => ({ album, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  getTopGenres(limit = 5) {
    const counts = this.getGenreCounts();
    return Object.entries(counts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  recordPlay(track, context = {}) {
    if (!track) return null;
    const state = this._load();
    const now = Date.now();

    const songId = track.id || track.Id || track.songID || track.fileName || null;
    const title = track.title || track.Title || track.name || 'Untitled Track';
    const artist = track.artist || track.Artist || 'Unknown Artist';
    const album = track.album || track.Album || 'Single';
    const albumId = track.albumId || track.AlbumId || null;
    const artistId = track.artistId || track.ArtistId || null;
    const genre = track.genre || track.Genre || 'Uncategorized';
    const coverUrl = track.coverUrl || (songId ? `${API_BASE_URL}/api/music/cover/${songId}` : '') || track.coverArt || '';
    const playlistName = context.playlistName || (typeof state.currentQueueTitle !== 'undefined' ? state.currentQueueTitle : null) || (typeof state.currentViewedPlaylist !== 'undefined' && state.currentViewedPlaylist ? state.currentViewedPlaylist.name : null) || null;

    // Deduplication: if exact same song was recorded within the last 3 seconds, skip duplicate
    const last = state.entries[0];
    if (last && ((songId && last.id === songId) || (last.title === title && last.artist === artist))) {
      if (now - (last.timestamp || 0) < 3000) {
        return last;
      }
    }

    const entry = {
      id: songId,
      title: title,
      artist: artist,
      album: album,
      albumId: albumId,
      artistId: artistId,
      playlistName: playlistName,
      coverUrl: coverUrl,
      genre: genre,
      timestamp: now
    };

    state.entries.unshift(entry);

    // Only record single song in recentItems if playing standalone (not playing an album or playlist)
    const isFromContainer = playlistName && playlistName !== 'Library' && playlistName !== 'Queue';
    if (!isFromContainer) {
      const songKey = `Song:${(title || songId).toLowerCase()}`;
      if (!state.recentItems) state.recentItems = [];
      state.recentItems = state.recentItems.filter(i => `${i.type}:${(i.title || i.id || '').toLowerCase()}` !== songKey);
      state.recentItems.unshift({
        type: 'Song',
        id: songId,
        title: title,
        artist: artist,
        subtitle: artist,
        coverUrl: coverUrl,
        fileName: track.fileName || songId,
        timestamp: now
      });
    } else if (track.album && track.album.toLowerCase() !== 'single' && track.album.toLowerCase() !== 'unknown album') {
      // Refresh the album container in recentItems
      this.recordContainerPlay({
        type: 'Album',
        id: track.albumId || ('album-' + track.album),
        albumId: track.albumId,
        name: track.album,
        title: track.album,
        artist: artist,
        coverUrl: coverUrl
      });
    }

    this._save(state);

    try {
      window.dispatchEvent(new CustomEvent('spotifake:playRecorded', { detail: entry }));
    } catch (e) {}

    return entry;
  },

  getRecentContainers(limit = 7) {
    const history = this.getHistory();
    const seen = new Set();
    const containers = [];

    for (const entry of history) {
      if (containers.length >= limit) break;

      // 1. Playlist container if present and meaningful
      if (entry.playlistName &&
          entry.playlistName !== 'Liked Songs' &&
          entry.playlistName !== 'SQL Server DB: MusicPlayerDb' &&
          entry.playlistName !== 'Library') {
        const key = `playlist:${entry.playlistName.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          containers.push({
            type: 'Playlist',
            title: entry.playlistName,
            subtitle: 'Playlist',
            coverUrl: entry.coverUrl || '',
            id: entry.playlistId || entry.playlistName,
            playlistId: entry.playlistId,
            timestamp: entry.timestamp
          });
          if (containers.length >= limit) break;
        }
      }

      // 2. Album container if not single/unknown
      if (entry.album &&
          entry.album.toLowerCase() !== 'single' &&
          entry.album.toLowerCase() !== 'unknown album') {
        const key = `album:${entry.album.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          containers.push({
            type: 'Album',
            title: entry.album,
            subtitle: `${entry.artist && entry.artist !== 'Unknown Artist' ? entry.artist : 'Album'} • Album`,
            artist: entry.artist,
            albumId: entry.albumId,
            coverUrl: entry.coverUrl || '',
            id: entry.albumId || entry.album,
            timestamp: entry.timestamp
          });
          if (containers.length >= limit) break;
        }
      }

      // 3. Artist container if known
      if (entry.artist && entry.artist.toLowerCase() !== 'unknown artist') {
        const key = `artist:${entry.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          containers.push({
            type: 'Artist',
            title: entry.artist,
            subtitle: 'Artist',
            artist: entry.artist,
            artistId: entry.artistId,
            coverUrl: entry.coverUrl || '',
            id: entry.artistId || entry.artist,
            timestamp: entry.timestamp
          });
          if (containers.length >= limit) break;
        }
      }
    }

    return containers;
  },

  clear() {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {}
  }
};

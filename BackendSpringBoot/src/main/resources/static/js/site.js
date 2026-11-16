// ===== Global Toast Notification =====
function showToast(type, title, description, durationMs) {
  durationMs = durationMs || 5000;
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<div class="toast-body">' +
      '<div class="toast-title">' + title + '</div>' +
      (description ? '<div class="toast-desc">' + description + '</div>' : '') +
    '</div>' +
    '<div class="toast-progress" style="animation-duration:' + durationMs + 'ms"></div>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('toast-hide');
    setTimeout(function() { toast.remove(); }, 350);
  }, durationMs);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginGate = document.getElementById('loginGate');
  const authPanel = document.getElementById('authPanel');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginStatus = document.getElementById('loginStatus');
  const loginToggleButton = document.getElementById('loginToggleButton');
  const signupToggleButton = document.getElementById('signupToggleButton');
  const logoutButton = document.getElementById('logoutButton');
  const authUserPill = document.getElementById('authUserPill');
  const authPanelTitle = document.getElementById('authPanelTitle');
  const authPanelSubtitle = document.getElementById('authPanelSubtitle');
  const signupNote = document.getElementById('signupNote');
  const credentialsBox = document.getElementById('credentialsBox');
  const accountType = document.getElementById('accountType');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');

  const groupDisplayName = document.getElementById('groupDisplayName');
  const groupEmail = document.getElementById('groupEmail');
  const groupConfirmPassword = document.getElementById('groupConfirmPassword');
  const signupDisplayName = document.getElementById('signupDisplayName');
  const signupEmail = document.getElementById('signupEmail');
  const signupConfirmPassword = document.getElementById('signupConfirmPassword');
  const tabModeLogin = document.getElementById('tabModeLogin');
  const tabModeSignup = document.getElementById('tabModeSignup');
  const authSubmitBtn = document.getElementById('authSubmitBtn');

  const appShell = document.getElementById('appShell');
  const sections = Array.from(document.querySelectorAll('.section'));
  const sidebarLinks = Array.from(document.querySelectorAll('[data-section]'));
  const adminNavLink = document.getElementById('adminNavLink');

  const queueList = document.getElementById('queueList');
  const playlistGrid = document.getElementById('playlistGrid');
  const browsePlaylistGrid = document.getElementById('browsePlaylistGrid');
  const playlistNameInput = document.getElementById('playlistNameInput');
  const createPlaylistButton = document.getElementById('createPlaylistButton');
  const playlistStatus = document.getElementById('playlistStatus');
  const userPlaylistList = document.getElementById('userPlaylistList');
  const playlistSelect = document.getElementById('playlistSelect');
  const playlistSongSelect = document.getElementById('playlistSongSelect');
  const addSongToPlaylistButton = document.getElementById('addSongToPlaylistButton');
  const playlistSongsList = document.getElementById('playlistSongsList');
  const createPlaylistModal = document.getElementById('createPlaylistModal');
  const createPlaylistName = document.getElementById('createPlaylistName');
  const createPlaylistImageUrl = document.getElementById('createPlaylistImageUrl');
  const createPlaylistSongs = document.getElementById('createPlaylistSongs');
  const cancelCreatePlaylistButton = document.getElementById('cancelCreatePlaylistButton');
  const submitCreatePlaylistButton = document.getElementById('submitCreatePlaylistButton');
  const addSongToPlaylistModal = document.getElementById('addSongToPlaylistModal');
  const addSongModalTrackLabel = document.getElementById('addSongModalTrackLabel');
  const addSongPlaylistSelect = document.getElementById('addSongPlaylistSelect');
  const cancelAddSongModalButton = document.getElementById('cancelAddSongModalButton');
  const confirmAddSongModalButton = document.getElementById('confirmAddSongModalButton');
  const libraryStatus = document.getElementById('libraryStatus');
  const trackLoader = document.getElementById('trackLoader');
  const backendUpload = document.getElementById('backendUpload');
  const uploadToBackendButton = document.getElementById('uploadToBackendButton');
  const importUrl = document.getElementById('importUrl');
  const importUrlButton = document.getElementById('importUrlButton');
  const importStatus = document.getElementById('importStatus');
  const refreshAdminDashboardButton = document.getElementById('refreshAdminDashboardButton');
  const adminDashboardStatus = document.getElementById('adminDashboardStatus');
  const adminOverviewGrid = document.getElementById('adminOverviewGrid');
  const adminMusicPath = document.getElementById('adminMusicPath');
  const adminMusicList = document.getElementById('adminMusicList');
  const adminSongDetail = document.getElementById('adminSongDetail');
  const adminUsersList = document.getElementById('adminUsersList');
  const adminArtistsList = document.getElementById('adminArtistsList');

  const audioPlayer = document.getElementById('audioPlayer');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const progressFill = document.getElementById('progressFill');
  const playPauseButton = document.getElementById('playPauseButton');
  const shuffleButton = document.getElementById('shuffleButton');
  const loopButton = document.getElementById('loopButton');
  const volumeControl = document.getElementById('volumeControl');

  const sidebarTrackTitle = document.getElementById('sidebarTrackTitle');
  const sidebarTrackArtist = document.getElementById('sidebarTrackArtist');
  const currentTrackTitle = document.getElementById('currentTrackTitle');
  const currentTrackArtist = document.getElementById('currentTrackArtist');
  const currentPlaylistName = document.getElementById('currentPlaylistName');
  const playerTrack = document.getElementById('playerTrack');
  const playerArtist = document.getElementById('playerArtist');
  const miniArt = document.getElementById('miniArt');
  const albumArt = document.getElementById('albumArt');

  const authTokenKey = 'spotifake.jwt';
  const authUserKey = 'spotifake.user';
  const authRoleKey = 'spotifake.role';

  const API_BASE_URL = window.location.origin;

  const demoUsers = {
    user: { username: 'user_test', password: 'User@123', roleName: 'User' },
    artist: { username: 'artist_test', password: 'Artist@123', roleName: 'Artist' },
    admin: { username: 'admin_test', password: 'Admin@123', roleName: 'Admin' },
  };

  window.fillCredentials = function (username, password) {
    if (usernameInput) usernameInput.value = username;
    if (passwordInput) passwordInput.value = password;
  };

  let currentInspectedTrack = null;
  let tracks = (typeof window !== 'undefined' && Array.isArray(window.tracks) && window.tracks.length > 0) ? window.tracks : [];
  try {
    Object.defineProperty(window, 'tracks', {
      get() { return tracks; },
      set(val) { tracks = Array.isArray(val) ? val : []; },
      configurable: true
    });
  } catch (e) {
    window.tracks = tracks;
  }
  let currentTrackIndex = 0;
  let isPlaying = false;
  let shuffleMode = 'off';
  let loopMode = 'off';
  let uploadedTrackUrls = [];
  let authToken = localStorage.getItem(authTokenKey) || '';
  let currentAuthRole = localStorage.getItem(authRoleKey) || '';
  let queueOrder = [];
  let activeQueue = [];
  let currentQueueTitle = 'Library';
  let currentViewedPlaylist = null;
  let lastReportedListenFileName = '';
  let currentTrackPlayRecorded = false;
  let userPlaylists = [];
  let selectedPlaylistId = '';
  let pendingAddSongFileName = '';
  let currentUser = null;
  let freeTierSongCount = parseInt(localStorage.getItem('spotifake_free_songs') || '0', 10);
  let skipTimestamps = JSON.parse(localStorage.getItem('spotifake_skips') || '[]');
  let selectedCheckoutPlan = 'Individual';
  let selectedCheckoutPrice = 4.99;
  let isPlayingAdBreak = false;
  let currentTransactionId = '';

  window.platformSettings = {
    skipLimit: 6,
    adFrequency: 3,
    bitrateCap: '128',
    lyricsMode: 'blur',
    maintenanceMode: false,
    maintenanceMessage: '',
    allowRegistration: true
  };

  async function syncPlatformRuntime() {
    try {
      const resp = await fetch('/admin/dashboard/api/public/settings');
      if (resp.ok) {
        const data = await resp.json();
        window.platformSettings = Object.assign(window.platformSettings, data);
        if (window.platformSettings.maintenanceMode) {
          const banner = document.getElementById('globalAnnouncementBanner');
          const text = document.getElementById('announcementText');
          const icon = document.getElementById('announcementIcon');
          if (banner && text) {
            banner.style.display = 'flex';
            banner.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
            banner.style.color = '#fff';
            if (icon) icon.textContent = '⚠️';
            text.textContent = window.platformSettings.maintenanceMessage || 'Platform is currently undergoing maintenance.';
          }
        }
      }
    } catch (e) {}

    try {
      const resp = await fetch('/admin/dashboard/api/public/announcements');
      if (resp.ok) {
        const announcements = await resp.json();
        if (announcements && announcements.length > 0) {
          const first = announcements[0];
          const banner = document.getElementById('globalAnnouncementBanner');
          const text = document.getElementById('announcementText');
          const icon = document.getElementById('announcementIcon');
          if (banner && text && !window.platformSettings.maintenanceMode) {
            banner.style.display = 'flex';
            if (first.level === 'warning') {
              banner.style.background = 'linear-gradient(90deg, #facc15, #f59e0b)';
              banner.style.color = '#000';
              if (icon) icon.textContent = '⚠️';
            } else if (first.level === 'promo') {
              banner.style.background = 'linear-gradient(90deg, #a855f7, #6366f1)';
              banner.style.color = '#fff';
              if (icon) icon.textContent = '🎉';
            } else {
              banner.style.background = 'linear-gradient(90deg, #1db954, #1ed760)';
              banner.style.color = '#000';
              if (icon) icon.textContent = '📢';
            }
            text.textContent = first.title + ' — ' + first.message;
          }
          const bellBadge = document.getElementById('bellBadge');
          if (bellBadge) {
            bellBadge.textContent = String(announcements.length);
            bellBadge.hidden = false;
          }
        }
      }
    } catch (e) {}
  }
  syncPlatformRuntime();

  const notifBell = document.getElementById('notificationBell');
  if (notifBell) {
    notifBell.addEventListener('click', () => {
      fetch('/admin/dashboard/api/public/announcements')
        .then(r => r.ok ? r.json() : [])
        .then(list => {
          if (list && list.length > 0) {
            const msgs = list.map(a => `🔔 ${a.title}\n${a.message}`).join('\n\n');
            alert(msgs);
          } else {
            showToast('info', "What's New", "You are all caught up! No active announcements.");
          }
        })
        .catch(() => {
          showToast('info', "What's New", "You are all caught up!");
        });
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeBackendSong(song) {
    const title = song.title || song.displayName || song.name || 'Untitled Track';
    const filePath = song.file_path || song.storage_url || song.filePath || song.storageUrl || song.fileName || (song.title ? `${song.title}.mp3` : '');
    const cover = song.coverUrl || song.cover_art_url || song.coverArtUrl || (song.id ? `${API_BASE_URL}/songs/${song.id}/cover` : '');
    return {
      id: song.id,
      Id: song.id,
      title: title,
      artist: song.artist || song.artistName || 'Unknown Artist',
      album: song.album || 'Single',
      artistId: song.artistId || song.ArtistId,
      albumId: song.albumId || song.AlbumId,
      releaseDate: song.releaseDate || song.release_date || '',
      playCount: song.playCount || song.play_count || 0,
      playlist: 'SQL Server DB: MusicPlayerDb',
      genre: song.genre || 'Uncategorized',
      mood: song.mood || 'Neutral',
      tempo: song.tempo || 0,
      energy: song.energy || 0,
      danceability: song.danceability || 0,
      valence: song.valence || 0,
      acousticness: song.acousticness || 0,
      instrumentalness: song.instrumentalness || 0,
      color: initials(title) || 'AI',
      accent: '#1db954',
      src: `${API_BASE_URL}/songs/${song.id}/stream`,
      coverUrl: cover,
      coverArt: cover,
      duration: Math.round((song.duration_ms || (song.durationSeconds ? song.durationSeconds * 1000 : 0)) / 1000),
      durationSeconds: song.durationSeconds || Math.round((song.duration_ms || 0) / 1000),
      fileName: filePath,
      lyrics: song.lyrics || '',
    };
  }

  // ===== Spotifake Playback History Tracker =====
  const HISTORY_STORAGE_KEY = 'spotifake_playback_history';
  const HISTORY_MAX_ENTRIES = 50;

  const SpotifakeHistory = {
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
        coverUrl = container.songs[0].coverUrl || '';
      }
      if (!coverUrl && typeof tracks !== 'undefined' && tracks) {
        const match = tracks.find(t => (t.album && t.album.toLowerCase() === title.toLowerCase()) || (t.title && t.title.toLowerCase() === title.toLowerCase()));
        if (match) coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/songs/${match.id}/cover` : '');
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
      const coverUrl = track.coverUrl || (songId ? `${API_BASE_URL}/songs/${songId}/cover` : '') || track.coverArt || '';
      const playlistName = context.playlistName || (typeof currentQueueTitle !== 'undefined' ? currentQueueTitle : null) || (typeof currentViewedPlaylist !== 'undefined' && currentViewedPlaylist ? currentViewedPlaylist.name : null) || null;

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

  window.SpotifakeHistory = SpotifakeHistory;


  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remaining = safeSeconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  }

  function initials(text) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  function syncLoginHint(roleKey) {
    const demo = demoUsers[roleKey];
    if (!demo) return;
    if (usernameInput && !usernameInput.value) usernameInput.value = demo.username;
    if (passwordInput && !passwordInput.value) passwordInput.value = demo.password;
  }

  function saveAuthSession(token, username, role) {
    authToken = token || '';
    currentAuthRole = role || '';
    if (authToken) {
      localStorage.setItem(authTokenKey, authToken);
      localStorage.setItem(authUserKey, username || '');
      localStorage.setItem(authRoleKey, role || '');
      document.cookie = "jwt_token=" + authToken + "; path=/; max-age=86400; SameSite=Lax";
    } else {
      localStorage.removeItem(authTokenKey);
      localStorage.removeItem(authUserKey);
      localStorage.removeItem(authRoleKey);
      document.cookie = "jwt_token=; path=/; max-age=0";
    }
  }

  let currentAuthMode = 'login';

  function setAuthPanelMode(mode) {
    currentAuthMode = mode;
    const isSignup = mode === 'signup';
    if (loginError) loginError.textContent = '';
    
    if (tabModeLogin) tabModeLogin.classList.toggle('active', !isSignup);
    if (tabModeSignup) tabModeSignup.classList.toggle('active', isSignup);

    if (authPanelTitle) authPanelTitle.textContent = isSignup ? 'Create an Account' : 'Sign in to Spotifake';
    if (authPanelSubtitle) authPanelSubtitle.textContent = isSignup
      ? 'Register a new user account with real SQL Server database storage.'
      : 'Connect with real JWT authentication & SQL Server.';

    if (groupDisplayName) groupDisplayName.hidden = !isSignup;
    if (groupEmail) groupEmail.hidden = !isSignup;
    if (groupConfirmPassword) groupConfirmPassword.hidden = !isSignup;
    if (signupNote) signupNote.hidden = !isSignup;
    if (credentialsBox) credentialsBox.hidden = isSignup;

    if (authSubmitBtn) {
      authSubmitBtn.textContent = isSignup ? 'Create Account' : 'Login';
    }
  }

  function setAuthPanelOpen(isOpen, mode = 'login') {
    if (!authPanel || !loginGate) return;
    setAuthPanelMode(mode);
    loginGate.hidden = !isOpen;
    loginGate.style.display = isOpen ? 'flex' : 'none';
  }

  function setAdminVisibility(role) {
    const roleLower = String(role || '').toLowerCase();
    const isAdmin = roleLower === 'admin';
    const isArtist = roleLower === 'artist';
    const isUser = roleLower === 'user';

    if (adminNavLink) adminNavLink.hidden = !isAdmin;
    
    const artistNavLink = document.getElementById('artistNavLink');
    if (artistNavLink) artistNavLink.hidden = !isArtist;

    const userArtistNavLink = document.getElementById('userArtistNavLink');
    if (userArtistNavLink) userArtistNavLink.hidden = !isUser;

    const adminSection = document.getElementById('admin');
    if (!isAdmin && adminSection?.classList.contains('active')) {
      showSection('home');
    }

    if (adminDashboardStatus && !isAdmin) {
      adminDashboardStatus.textContent = 'Sign in as admin to manage music, users, and artists.';
    }

    if (!isAdmin && adminSongDetail) {
      adminSongDetail.textContent = 'Select a song and click View Details to see which user IDs listened and how many times.';
    }
  }

  function updateAuthChrome(username, roleLabel, loggedIn) {
    if (authUserPill) {
      authUserPill.textContent = loggedIn ? `Logged in as ${username}` : 'Not signed in';
    }
    if (loginToggleButton) {
      loginToggleButton.hidden = loggedIn;
    }
    if (signupToggleButton) {
      signupToggleButton.hidden = loggedIn;
    }
    if (logoutButton) {
      logoutButton.hidden = !loggedIn;
    }
    if (loginStatus) {
      loginStatus.textContent = loggedIn ? `Signed in as ${username} (${roleLabel})` : '';
    }
  }

  function canManagePlaylists() {
    return Boolean(authToken);
  }

  function getSelectedPlaylist() {
    if (!selectedPlaylistId) return null;
    return userPlaylists.find((item) => item.id === selectedPlaylistId) || null;
  }

  function renderPlaylistSongOptions() {
    if (!playlistSongSelect) return;

    playlistSongSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a song';
    playlistSongSelect.appendChild(defaultOption);

    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.value = track.id || track.fileName || track.title;
      option.textContent = `${track.title} - ${track.artist}`;
      playlistSongSelect.appendChild(option);
    });
  }

  function renderCreatePlaylistSongsOptions() {
    if (!createPlaylistSongs) return;

    createPlaylistSongs.innerHTML = '';
    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.value = track.id || track.fileName || track.title;
      option.textContent = `${track.title} - ${track.artist}`;
      createPlaylistSongs.appendChild(option);
    });
  }

  function setModalOpen(modal, isOpen) {
    if (!modal) return;
    modal.hidden = !isOpen;
    modal.style.display = isOpen ? 'flex' : 'none';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function openCreatePlaylistModal() {
    if (!canManagePlaylists()) {
      showToast('info', 'Authentication Required', 'Please sign in first to create playlists.');
      setAuthPanelOpen(true, 'login');
      return;
    }

    renderCreatePlaylistSongsOptions();
    if (createPlaylistName) createPlaylistName.value = '';
    if (createPlaylistImageUrl) createPlaylistImageUrl.value = '';
    if (createPlaylistSongs) {
      Array.from(createPlaylistSongs.options).forEach((option) => {
        option.selected = false;
      });
    }
    setModalOpen(createPlaylistModal, true);
  }

  function openLikedSongsPlaylist() {
    if (!userPlaylists || userPlaylists.length === 0) {
      showToast('info', 'Not Available', 'You do not have a Liked Songs playlist yet.');
      return;
    }
    const likedPlaylist = userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
    if (likedPlaylist) {
      if (window.openPlaylistById) {
        window.openPlaylistById(likedPlaylist.id);
      }
    } else {
      showToast('info', 'Not Available', 'You do not have a Liked Songs playlist yet.');
    }
  }

  function openAddSongToPlaylistModal(identifier) {
    if (!canManagePlaylists()) {
      if (playlistStatus) playlistStatus.textContent = 'Sign in first to manage playlists.';
      return;
    }

    if (!userPlaylists.length) {
      if (playlistStatus) playlistStatus.textContent = 'Create a playlist first before adding songs.';
      return;
    }

    pendingAddSongFileName = identifier;
    const track = tracks.find((item) => item.id === identifier || item.Id === identifier || item.fileName === identifier || item.title === identifier);
    if (addSongModalTrackLabel) {
      addSongModalTrackLabel.textContent = `Song: ${track?.title || identifier}`;
    }

    if (addSongPlaylistSelect) {
      addSongPlaylistSelect.innerHTML = '';
      userPlaylists.forEach((playlist) => {
        const option = document.createElement('option');
        option.value = playlist.id;
        option.textContent = `${playlist.name} (${playlist.songs.length})`;
        addSongPlaylistSelect.appendChild(option);
      });
      addSongPlaylistSelect.value = selectedPlaylistId || userPlaylists[0]?.id || '';
    }

    setModalOpen(addSongToPlaylistModal, true);
  }

  function renderPlaylistSelect() {
    if (!playlistSelect) return;

    playlistSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a playlist';
    playlistSelect.appendChild(defaultOption);

    userPlaylists.forEach((playlist) => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = `${playlist.name} (${playlist.songs.length})`;
      playlistSelect.appendChild(option);
    });

    if (selectedPlaylistId && userPlaylists.some((item) => item.id === selectedPlaylistId)) {
      playlistSelect.value = selectedPlaylistId;
    } else {
      selectedPlaylistId = '';
      playlistSelect.value = '';
    }
  }

  function renderPlaylistSongs() {
    if (!playlistSongsList) return;
    const selected = getSelectedPlaylist();
    const titleEl = document.getElementById('playlistManagerTitle');
    const subtitleEl = document.getElementById('playlistManagerSubtitle');

    if (!selected) {
      if (titleEl) titleEl.textContent = 'Playlist Details';
      if (subtitleEl) subtitleEl.textContent = 'Select a playlist from the left to view and edit its songs.';
      playlistSongsList.innerHTML = '<div class="admin-empty-state">Select a playlist to view and manage songs.</div>';
      return;
    }

    if (titleEl) titleEl.textContent = selected.name;
    if (subtitleEl) subtitleEl.textContent = `${selected.songs ? selected.songs.length : 0} song${(selected.songs && selected.songs.length === 1) ? '' : 's'} in playlist`;

    if (!selected.songs.length) {
      playlistSongsList.innerHTML = '<div class="admin-empty-state" style="padding: 24px; text-align: center; color: #b3b3b3;">This playlist has no songs yet. Search above to add songs!</div>';
      return;
    }

    playlistSongsList.innerHTML = selected.songs.map((song, idx) => {
      const coverSrc = song.coverUrl || (song.id ? `${API_BASE_URL}/songs/${song.id}/cover` : '') || '';
      return `
        <article class="playlist-song-item" style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.03); margin-bottom: 6px;">
          <span style="font-size: 12px; color: #727272; width: 20px; text-align: center;">${idx + 1}</span>
          <div style="width: 38px; height: 38px; min-width: 38px; border-radius: 4px; overflow: hidden; background: #282828;">
            ${coverSrc ? `<img src="${escapeHtml(coverSrc)}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#666;">♪</div>`}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(song.displayName || song.title || song.fileName)}</div>
            <div style="font-size: 12px; color: #b3b3b3; margin-top: 2px;">${escapeHtml(song.artist || 'Unknown Artist')}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="icon-button" data-play-song="${encodeURIComponent(song.fileName || song.id)}" data-song-idx="${idx}" title="Play Song" style="width: 28px; height: 28px; background: rgba(255,255,255,0.1); color: #fff; border-radius: 50%; font-size: 10px; border: none; cursor: pointer;">▶</button>
            <button type="button" class="secondary-action danger-action" data-remove-song="${encodeURIComponent(song.fileName || '')}" title="Remove from playlist" style="font-size: 12px; padding: 4px 8px; color: #b3b3b3; background: transparent; border: none; cursor: pointer;">✕</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderSidebarPlaylists() {
    const container = document.getElementById('sidebarUserPlaylists');
    if (!container) return;

    if (userPlaylists && userPlaylists.length) {
      const otherPlaylists = userPlaylists.filter(p => (p.name || '').toLowerCase() !== 'liked songs');
      container.innerHTML = otherPlaylists.map((playlist) => {
        const coverImg = playlist.imageUrl || (playlist.songs && playlist.songs[0] && playlist.songs[0].coverUrl);
        return `
          <div class="sidebar-playlist-tile" onclick="openPlaylistById('${escapeHtml(playlist.id)}')" title="${escapeHtml(playlist.name)} (${playlist.songs ? playlist.songs.length : 0} songs)">
            ${coverImg ? `<img src="${escapeHtml(coverImg)}" alt="${escapeHtml(playlist.name)}">` : `
              <div class="tile-fallback">
                <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
            `}
          </div>
        `;
      }).join('');
    } else {
      const demoTiles = [
        { name: "Phonk Hits", bg: "linear-gradient(135deg, #1b002c, #4a154b)", icon: "🔥" },
        { name: "Chill Lofi", bg: "linear-gradient(135deg, #0d3b66, #64dfdf)", icon: "🎧" },
        { name: "Discover Weekly", bg: "linear-gradient(135deg, #00b4db, #0083b0)", icon: "✨" }
      ];
      container.innerHTML = demoTiles.map(tile => `
        <div class="sidebar-playlist-tile" onclick="showSection('browse')" title="${escapeHtml(tile.name)}">
          <div class="tile-fallback" style="background: ${tile.bg};">
            ${tile.icon ? `<span style="font-size: 20px;">${tile.icon}</span>` : `
              <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            `}
          </div>
        </div>
      `).join('');
    }
  }

  function getPlaylistTrackObjects(playlist) {
    if (!playlist || !playlist.songs) return [];
    return playlist.songs.map((song, idx) => {
      if (song && typeof song === 'object' && song.src) {
        return song;
      }
      const songFileName = typeof song === 'string' ? song : (song.fileName || song.title);
      const songTitle = typeof song === 'string' ? song.replace(/\.[^.]+$/, '') : (song.displayName || song.title || songFileName);
      const songId = typeof song === 'object' ? (song.id || song.Id) : null;
      
      const found = tracks.find(t => (songId && (t.id === songId || t.Id === songId)) || (t.fileName || t.title) === songFileName || (t.title && t.title === songTitle));
      if (found) {
        return found;
      }
      return {
        id: songId || songFileName,
        title: songTitle,
        artist: typeof song === 'string' ? 'Artist' : (song.artist || 'Artist'),
        album: typeof song === 'string' ? 'Single' : (song.album || 'Single'),
        fileName: songFileName,
        src: `/music/stream?fileName=${encodeURIComponent(songFileName)}`,
        color: '🎵',
        duration: 0,
        durationSeconds: 0
      };
    });
  }

  function playPlaylistContext(playlist, startIndex = 0) {
    if (typeof SpotifakeHistory !== 'undefined' && playlist) {
      SpotifakeHistory.recordContainerPlay(playlist);
    }
    const playlistTracks = getPlaylistTrackObjects(playlist);
    if (!playlistTracks.length) {
      showToast('info', 'Empty Playlist', 'There are no songs in this playlist to play.');
      return;
    }
    activeQueue = playlistTracks;
    currentQueueTitle = playlist.name || 'Playlist';
    buildQueueOrder();
    loadTrack(startIndex, true);
    renderQueue();
  }

  function openPlaylistDetailView(playlist) {
    if (!playlist) return;
    currentViewedPlaylist = playlist;
    selectedPlaylistId = playlist.id;

    showSection('playlist-view');
    document.getElementById('pvTitle').textContent = playlist.name;
    
    const typeLabel = document.getElementById('pvTypeLabel');
    if (typeLabel) {
        let displayType = playlist.type || 'Playlist';
        if (displayType === 'Album' && playlist.songs && playlist.songs.length <= 1) {
            displayType = 'Single';
        }
        typeLabel.textContent = displayType.toUpperCase();
    }

    const pvPlayBtn = document.getElementById('pvPlayBtn');
    if (pvPlayBtn) {
      pvPlayBtn.onclick = function() {
        playPlaylistContext(playlist, 0);
      };
    }

    const descEl = document.getElementById('pvDescription');
    if (descEl) {
      descEl.style.display = 'block';
      descEl.textContent = playlist.desc || playlist.description || (playlist.name === 'Liked Songs'
        ? 'Your favorite saved tracks'
        : (playlist.songs ? `${playlist.songs.length} song${playlist.songs.length === 1 ? '' : 's'}` : 'Playlist'));
    }

    const waveformContainer = document.getElementById('waveformContainer');
    if (waveformContainer) {
      waveformContainer.style.display = 'none';
    }

    const pvCoverArt = document.getElementById('pvCoverArt');
    if (pvCoverArt) {
      if (playlist.name === 'Liked Songs') {
        pvCoverArt.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23450af5"/><stop offset="50%" stop-color="%238e9efc"/><stop offset="100%" stop-color="%23c4efd9"/></linearGradient></defs><rect width="300" height="300" fill="url(%23g)"/><path d="M150 210 l-55 -55 a38 38 0 0 1 54 -54 l1 1 l1 -1 a38 38 0 0 1 54 54 z" fill="white"/></svg>';
      } else {
        pvCoverArt.src = playlist.imageUrl || playlist.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=random&color=fff&size=300`;
      }
    }

    const songCountEl = document.getElementById('pvSongCount');
    if (songCountEl) {
      songCountEl.textContent = `${playlist.songs ? playlist.songs.length : 0} songs`;
    }

    const durationEl = document.getElementById('pvTotalDuration');
    if (durationEl) {
        if (playlist.songs && playlist.songs.length > 0) {
            const totalSec = playlist.songs.reduce((acc, song) => {
                const s = song.durationSeconds || song.duration || 0;
                return acc + (s > 1000 ? s / 1000 : s);
            }, 0);
            const mins = Math.ceil(totalSec / 60);
            durationEl.textContent = `about ${mins} min`;
        } else {
            durationEl.textContent = `about 0 min`;
        }
    }

    // Setup More Options Dropdown
    const moreOptionsBtn = document.getElementById('pvMoreOptionsBtn');
    const optionsDropdown = document.getElementById('pvMoreOptionsDropdown');
    
    if (moreOptionsBtn && optionsDropdown) {
            if (playlist.name === 'Liked Songs' || playlist.isMix || (playlist.id && String(playlist.id).startsWith('mix-'))) {
                moreOptionsBtn.style.display = 'none'; // No options for Liked Songs or generated mixes
            } else {
                moreOptionsBtn.style.display = 'inline-block';
                let dropdownHtml = '';
                
                if (playlist.type === 'Album') {
                    dropdownHtml += `
                        <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="removeSavedItem('${playlist.id}', 'Album'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                            <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 12px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path><path d="M7 11h10v2H7z"></path></svg>
                            Remove from library
                        </div>
                    `;
                } else {
                    // It's a Playlist
                    if (playlist.isOwner !== false) {
                        // Treat as owner by default if not explicitly false
                        dropdownHtml += `
                            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="openEditPlaylistModal('${playlist.id}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 12px;"><path d="M17.318 1.975a3.329 3.329 0 114.707 4.707L8.451 20.256c-.49.49-1.082.867-1.735 1.103L2.34 22.94a1 1 0 01-1.28-1.28l1.581-4.376a4.509 4.509 0 011.103-1.735L17.318 1.975z"></path></svg>
                                Edit details
                            </div>
                            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="togglePlaylistVisibility('${playlist.id}', ${!playlist.isPublic}); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 12px;"><path d="M16 10v-3.5a4 4 0 10-8 0V10H6v12h12V10h-2zM10 6.5a2 2 0 114 0V10h-4V6.5z"></path></svg>
                                ${playlist.isPublic ? 'Make private' : 'Make public'}
                            </div>
                            <div style="border-top: 1px solid #3e3e3e; margin: 4px 0;"></div>
                            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="removePlaylist('${playlist.id}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 12px;"><path d="M5 20a2 2 0 002 2h10a2 2 0 002-2V8h2V6h-4V4a2 2 0 00-2-2H9a2 2 0 00-2 2v2H3v2h2v12zM9 4h6v2H9V4z"></path></svg>
                                Delete
                            </div>
                        `;
                    } else {
                        // Not owner (saved public playlist)
                        dropdownHtml += `
                            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="removeSavedItem('${playlist.id}', 'Playlist'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 12px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path><path d="M7 11h10v2H7z"></path></svg>
                                Remove from library
                            </div>
                        `;
                    }
                }
                optionsDropdown.innerHTML = dropdownHtml;
            }
    }

    const listHeader = document.querySelector('.track-table thead');
    if (listHeader) listHeader.style.display = 'table-header-group'; // thead default display
    if (listHeader) listHeader.style.display = '';

    const trackListEl = document.getElementById('pvTrackList');
    if (trackListEl) {
      if (!playlist.songs || !playlist.songs.length) {
        trackListEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--muted); font-size: 16px;">No songs in this playlist yet. Heart songs to add them here!</td></tr>';
      } else {
        trackListEl.innerHTML = playlist.songs.map((song, idx) => {
          const songIdentifier = (typeof song === 'object' && song) ? (song.id || song.Id || song.fileName || song.title) : song;
          const songFileName = typeof song === 'string' ? song : (song.fileName || song.title || song.id);
          const songTitle = typeof song === 'string' ? song.replace(/\.[^.]+$/, '') : (song.displayName || song.title || songFileName);
          const songArtist = typeof song === 'string' ? 'Artist' : (song.artist || 'Artist');
          const songAlbum = typeof song === 'string' ? 'Single' : (song.album || 'Single');

          return `
            <tr data-song-file="${escapeHtml(songFileName)}" onclick="playPlaylistTrack('${escapeHtml(songIdentifier)}', ${idx})" oncontextmenu="event.preventDefault(); event.stopPropagation(); openTrackMenu(event, '${escapeHtml(songFileName)}', '${escapeHtml(song.id || '')}', '${escapeHtml(song.albumId || '')}', '${escapeHtml(song.artistId || songArtist || '')}', '${escapeHtml(songArtist || '')}', '${escapeHtml(playlist.id || '')}');" style="cursor: pointer;">
              <td class="col-index">
                <span class="index-num">${idx + 1}</span>
                <span class="index-play">▶</span>
              </td>
              <td class="col-title">
                <div class="track-name-artist">
                  <div class="t-name">${escapeHtml(songTitle)}</div>
                  <div class="t-artist" style="cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" onclick="event.stopPropagation(); openArtistDetailView('${escapeHtml(songArtist)}')">${escapeHtml(songArtist)}</div>
                </div>
              </td>
              <td class="col-album" style="cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" onclick="event.stopPropagation(); if ('${escapeHtml(song.albumId || '')}') openAlbumDetailView('${escapeHtml(song.albumId || '')}')">${escapeHtml(songAlbum)}</td>
              <td class="col-date">Recently</td>
              <td class="col-duration" style="padding-right: 16px;">
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 48px; width: 100%;">
                      <span>${formatTime((song.durationSeconds || 0) > 1000 ? (song.durationSeconds || 0) / 1000 : (song.durationSeconds || 0))}</span>
                      <button class="track-options-btn" style="background: transparent; border: none; color: #b3b3b3; font-size: 18px; cursor: pointer; display: flex; align-items: center;" onclick="event.stopPropagation(); openTrackMenu(event, '${escapeHtml(songFileName)}', '${escapeHtml(song.id || '')}', '${escapeHtml(song.albumId || '')}', '${escapeHtml(song.artistId || songArtist || '')}', '${escapeHtml(songArtist || '')}', '${escapeHtml(playlist.id || '')}')">...</button>
                  </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  window.openPlaylistDetailView = openPlaylistDetailView;

  window.playPlaylistTrack = function(fileName, playlistIdx) {
    if (currentViewedPlaylist && currentViewedPlaylist.songs && currentViewedPlaylist.songs.length) {
      let idx = -1;
      if (typeof playlistIdx === 'number' && playlistIdx >= 0 && playlistIdx < currentViewedPlaylist.songs.length) {
        const candidate = currentViewedPlaylist.songs[playlistIdx];
        if (!fileName || (candidate && ((candidate.id || candidate.Id) === fileName || candidate.fileName === fileName || candidate.title === fileName))) {
          idx = playlistIdx;
        }
      }
      if (idx === -1) {
        idx = currentViewedPlaylist.songs.findIndex(s => (s.id || s.Id) === fileName || s.fileName === fileName || s.title === fileName);
      }
      if (idx !== -1) {
        playPlaylistContext(currentViewedPlaylist, idx);
        return;
      }
    }
    if (typeof currentArtistContext !== 'undefined' && currentArtistContext && currentArtistContext.songs && currentArtistContext.songs.length) {
      let idx = -1;
      if (typeof playlistIdx === 'number' && playlistIdx >= 0 && playlistIdx < currentArtistContext.songs.length) {
        const candidate = currentArtistContext.songs[playlistIdx];
        if (!fileName || (candidate && ((candidate.id || candidate.Id) === fileName || candidate.fileName === fileName || candidate.title === fileName))) {
          idx = playlistIdx;
        }
      }
      if (idx === -1) {
        idx = currentArtistContext.songs.findIndex(s => (s.id || s.Id) === fileName || s.fileName === fileName || s.title === fileName);
      }
      if (idx !== -1) {
        playPlaylistContext(currentArtistContext, idx);
        return;
      }
    }
    const foundIndex = tracks.findIndex(t => t.id === fileName || t.Id === fileName || t.fileName === fileName || t.title === fileName);
    if (foundIndex !== -1) {
      activeQueue = [...tracks];
      currentQueueTitle = 'Library';
      currentViewedPlaylist = null;
      buildQueueOrder();
      loadTrack(foundIndex, true);
      renderQueue();
    } else {
      showToast('info', 'Playback', `Playing ${fileName}`);
    }
  };

  window.openPlaylistById = async function(playlistId) {
    if (typeof currentMadeForYouMixes !== 'undefined' && Array.isArray(currentMadeForYouMixes)) {
      const foundMix = currentMadeForYouMixes.find(m => m.id === playlistId);
      if (foundMix) {
        openPlaylistDetailView(foundMix);
        return;
      }
    }
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (playlist) {
      openPlaylistDetailView(playlist);
    } else {
      try {
          const res = await authenticatedFetch(`/playlists/details/${encodeURIComponent(playlistId)}`);
          if (res.ok) {
              const data = await res.json();
              openPlaylistDetailView(data);
          } else {
              showToast('error', 'Playlist', 'Playlist not found or private');
              showSection('playlists');
          }
      } catch (e) {
          showToast('error', 'Playlist', 'Failed to load playlist');
          showSection('playlists');
      }
    }
  };

  window.openAlbumDetailView = async function(albumId) {
      if (!albumId || albumId === 'null') {
          showToast('info', 'Not Available', 'Album information not available.');
          return;
      }
      try {
          const res = await authenticatedFetch(`/album/details/${encodeURIComponent(albumId)}`);
          if (res.ok) {
              const albumData = await res.json();
              openPlaylistDetailView(albumData);
          } else {
              showToast('error', 'Album', 'Album details not available');
          }
      } catch(e) {
          console.error(e);
          showToast('error', 'Album', 'Failed to load album');
      }
  };

  window.togglePlaylistDropdown = function(event) {
      event.stopPropagation();
      const dropdown = document.getElementById('pvMoreOptionsDropdown');
      if (dropdown) {
          dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      }
  };

  document.addEventListener('click', function(e) {
      const dropdown = document.getElementById('pvMoreOptionsDropdown');
      const btn = document.getElementById('pvMoreOptionsBtn');
      if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
          dropdown.style.display = 'none';
      }
  });

  window.openEditPlaylistModal = function(playlistId) {
      const playlist = userPlaylists.find(p => p.id === playlistId);
      if (!playlist) return;
      document.getElementById('editPlaylistName').value = playlist.name;
      document.getElementById('editPlaylistImageUrl').value = playlist.imageUrl || '';
      document.getElementById('editPlaylistDescription').value = ''; // We don't track descriptions right now
      
      const saveBtn = document.getElementById('saveEditPlaylistButton');
      saveBtn.onclick = async function() {
          const newName = document.getElementById('editPlaylistName').value.trim();
          const newImage = document.getElementById('editPlaylistImageUrl').value.trim();
          
          if (!newName) {
              showToast('error', 'Error', 'Playlist name cannot be empty');
              return;
          }
          
          try {
              const res = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newName, imageUrl: newImage })
              });
              
              if (res.ok) {
                  showToast('success', 'Saved', 'Playlist details updated');
                  setModalOpen(document.getElementById('editPlaylistModal'), false);
                  await loadUserPlaylists();
                  
                  // Refresh the detail view if it's currently open
                  if (currentViewedPlaylist && currentViewedPlaylist.id === playlistId) {
                      const updatedPlaylist = userPlaylists.find(p => p.id === playlistId);
                      if (updatedPlaylist) openPlaylistDetailView(updatedPlaylist);
                  }
              } else {
                  showToast('error', 'Error', 'Failed to update playlist');
              }
          } catch (err) {
              showToast('error', 'Error', 'Failed to update playlist');
          }
      };
      
      setModalOpen(document.getElementById('editPlaylistModal'), true);
  };

  window.removeSavedItem = async function(id, type) {
      try {
          if (type === 'Playlist') {
              const res = await authenticatedFetch(`/playlists/my/${encodeURIComponent(id)}/unsave`, { method: 'POST' });
              if (res.ok) {
                  showToast('success', 'Removed', 'Playlist removed from library');
                  await loadUserPlaylists();
                  showSection('playlists');
              }
          } else if (type === 'Album') {
              const res = await authenticatedFetch(`/music/albums/unsave/${encodeURIComponent(id)}`, { method: 'POST' });
              if (res.ok) {
                  showToast('success', 'Removed', 'Album removed from library');
                  await loadUserPlaylists();
                  showSection('playlists');
              }
          }
      } catch (err) {
          showToast('error', 'Error', 'Failed to remove item');
      }
  };

  window.removePlaylist = async function(id) {
      if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;
      try {
          const res = await authenticatedFetch(`/playlists/my/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) {
              showToast('success', 'Deleted', 'Playlist deleted successfully');
              await loadUserPlaylists();
              showSection('playlists');
          } else {
              showToast('error', 'Error', 'Failed to delete playlist');
          }
      } catch (err) {
          showToast('error', 'Error', 'Failed to delete playlist');
      }
  };

  window.togglePlaylistVisibility = async function(playlistId, isPublic) {
      try {
          const res = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}/visibility`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPublic: isPublic })
          });
          if (res.ok) {
              showToast('success', 'Playlist', isPublic ? 'Playlist is now public.' : 'Playlist is now private.');
              await loadUserPlaylists();
          } else {
              showToast('error', 'Error', 'Failed to update visibility.');
          }
      } catch (err) {
          console.error(err);
          showToast('error', 'Error', 'Failed to update visibility.');
      }
  };

  window.openLikedSongsPlaylist = function() {
    if (!canManagePlaylists()) {
      showToast('info', 'Liked Songs', 'Sign in to access your Liked Songs playlist.');
      setAuthPanelOpen(true, 'login');
      return;
    }

    const likedPlaylist = userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
    if (likedPlaylist) {
      openPlaylistDetailView(likedPlaylist);
    } else {
      showSection('playlists');
    }
  };

  window.openCreatePlaylistModal = openCreatePlaylistModal;
  window.openAddSongToPlaylistModal = openAddSongToPlaylistModal;

  function refreshCurrentPlaylistView() {
    if (!currentViewedPlaylist) return;
    const updated = userPlaylists.find(p => p.id === currentViewedPlaylist.id || (p.name && p.name.toLowerCase() === currentViewedPlaylist.name.toLowerCase()));
    if (updated) {
      openPlaylistDetailView(updated);
    }
  }

  function renderUserPlaylists() {
    renderSidebarPlaylists();
    refreshCurrentPlaylistView();
    if (currentInspectedTrack) {
      updateLikeButtonState(currentInspectedTrack);
    }
    if (!userPlaylistList) return;

    if (!canManagePlaylists()) {
      userPlaylistList.innerHTML = '<div class="admin-empty-state">Sign in to create and manage your playlists.</div>';
      renderPlaylistSelect();
      renderPlaylistSongs();
      return;
    }

    if (!userPlaylists.length) {
      userPlaylistList.innerHTML = '<div class="admin-empty-state">No playlists yet. Create your first playlist above.</div>';
      renderPlaylistSelect();
      renderPlaylistSongs();
      return;
    }

    userPlaylistList.innerHTML = userPlaylists.map((playlist) => {
      const isSelected = playlist.id === selectedPlaylistId;
      const coverImg = playlist.imageUrl || (playlist.songs && playlist.songs[0] && playlist.songs[0].coverUrl) || '';
      const songCount = playlist.songs ? playlist.songs.length : 0;
      
      return `
        <article class="playlist-manage-item ${isSelected ? 'active' : ''}" data-select-playlist="${escapeHtml(playlist.id)}" style="display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 8px; background: ${isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)'}; cursor: pointer; transition: background 0.2s, transform 0.2s; border-left: ${isSelected ? '4px solid #1db954' : '4px solid transparent'}; margin-bottom: 8px;">
          <div style="width: 48px; height: 48px; min-width: 48px; border-radius: 4px; overflow: hidden; background: #282828; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${coverImg ? `<img src="${escapeHtml(coverImg)}" alt="${escapeHtml(playlist.name)}" style="width: 100%; height: 100%; object-fit: cover;">` : `
              <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            `}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(playlist.name)}</div>
            <div style="font-size: 12px; color: #b3b3b3; margin-top: 2px;">${songCount} song${songCount === 1 ? '' : 's'}</div>
          </div>
          <div class="playlist-item-actions" style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
            <button type="button" class="icon-button" data-play-playlist="${escapeHtml(playlist.id)}" title="Play" style="width: 32px; height: 32px; background: #1db954; color: #000; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">▶</button>
            <button type="button" class="secondary-action" data-open-playlist="${escapeHtml(playlist.id)}" title="Open Full View" style="font-size: 12px; padding: 4px 8px;">View</button>
            ${(playlist.name || '').toLowerCase() !== 'liked songs' ? `
              <button type="button" class="secondary-action danger-action" data-delete-playlist="${escapeHtml(playlist.id)}" title="Delete" style="font-size: 12px; padding: 4px 8px; color: #e91429;">✕</button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    renderPlaylistSelect();
    renderPlaylistSongs();
  }

  async function loadUserPlaylists() {
    if (!canManagePlaylists()) {
      userPlaylists = [];
      selectedPlaylistId = '';
      renderUserPlaylists();
      if (playlistStatus) playlistStatus.textContent = 'Sign in as a user or artist to create playlists.';
      return;
    }

    const response = await authenticatedFetch('/playlists/my');
    const payload = await response.json().catch(() => ([]));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to load playlists.');
    }

    userPlaylists = Array.isArray(payload) ? payload : [];
    if (!selectedPlaylistId && userPlaylists.length) {
      selectedPlaylistId = userPlaylists[0].id;
    }
    renderUserPlaylists();
    populateHomeGrid();
    if (playlistStatus) playlistStatus.textContent = `Loaded ${userPlaylists.length} playlist${userPlaylists.length === 1 ? '' : 's'}.`;
  }

  async function createPlaylist() {
    const name = String(createPlaylistName?.value || '').trim();
    const imageUrl = String(createPlaylistImageUrl?.value || '').trim();
    const songFileNames = createPlaylistSongs
      ? Array.from(createPlaylistSongs.selectedOptions).map((option) => option.value).filter(Boolean)
      : [];
    if (!name) {
      if (playlistStatus) playlistStatus.textContent = 'Enter a playlist name first.';
      return;
    }

    const response = await authenticatedFetch('/playlists/my', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, imageUrl, songFileNames }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to create playlist.');
    }

    userPlaylists = payload;
    setModalOpen(createPlaylistModal, false);
    selectedPlaylistId = userPlaylists[userPlaylists.length - 1]?.id || selectedPlaylistId;
    renderUserPlaylists();
    if (playlistStatus) playlistStatus.textContent = 'Playlist created.';
  }

  async function deletePlaylist(playlistId) {
    const response = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}`, {
      method: 'DELETE',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to delete playlist.');
    }

    userPlaylists = payload;
    if (selectedPlaylistId === playlistId) {
      selectedPlaylistId = userPlaylists[0]?.id || '';
    }
    renderUserPlaylists();
    if (playlistStatus) playlistStatus.textContent = 'Playlist deleted.';
  }

  async function addSongToPlaylist() {
    const playlistId = selectedPlaylistId || String(playlistSelect?.value || '');
    const fileName = String(playlistSongSelect?.value || '');
    if (!playlistId) {
      if (playlistStatus) playlistStatus.textContent = 'Select a playlist first.';
      return;
    }
    if (!fileName) {
      if (playlistStatus) playlistStatus.textContent = 'Select a song to add.';
      return;
    }

    const response = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to add song to playlist.');
    }

    userPlaylists = payload;
    selectedPlaylistId = playlistId;
    renderUserPlaylists();
    
    // Auto-update playlist view and active queue
    const updatedPlaylist = userPlaylists.find(p => p.id === playlistId);
    if (updatedPlaylist && currentViewedPlaylist && currentViewedPlaylist.id === playlistId) {
      openPlaylistById(playlistId); // Refresh the UI view seamlessly
    }
    
    // Auto-update active queue if the playlist is currently playing
    if (activeQueue && currentQueueTitle === (updatedPlaylist?.name || 'Playlist')) {
       const trackToAdd = tracks.find(t => t.fileName === fileName || t.title === fileName);
       if (trackToAdd && !activeQueue.some(t => t.songID === trackToAdd.songID)) {
           activeQueue.push(trackToAdd);
           buildQueueOrder();
           renderQueue();
       }
    }

    if (playlistSongSelect) playlistSongSelect.value = '';
    if (playlistStatus) playlistStatus.textContent = 'Song added to playlist.';
  }

  async function removeSongFromPlaylist(fileName) {
    const playlistId = selectedPlaylistId;
    if (!playlistId) return;

    const response = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to remove song from playlist.');
    }

    userPlaylists = payload;
    renderUserPlaylists();
    if (playlistStatus) playlistStatus.textContent = 'Song removed from playlist.';
  }

  async function addSpecificSongToPlaylist(playlistId, fileName) {
    if (!playlistId || !fileName) return;

    const matchedTrack = tracks.find(t => t.id === fileName || t.Id === fileName || t.fileName === fileName || t.title === fileName);
    const payloadBody = {
      fileName: matchedTrack?.fileName || fileName,
      songFileName: matchedTrack?.fileName || fileName,
      songId: matchedTrack?.id || (fileName.length >= 32 ? fileName : '')
    };

    const response = await authenticatedFetch(`/playlists/my/${encodeURIComponent(playlistId)}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to add song to playlist.');
    }

    userPlaylists = payload;
    selectedPlaylistId = playlistId;
    renderUserPlaylists();

    const updatedPlaylist = userPlaylists.find(p => p.id === playlistId);
    if (updatedPlaylist && currentViewedPlaylist && currentViewedPlaylist.id === playlistId) {
      currentViewedPlaylist = updatedPlaylist;
      openPlaylistDetailView(updatedPlaylist);
    }

    if (activeQueue && currentQueueTitle === (updatedPlaylist?.name || 'Playlist')) {
       const trackToAdd = matchedTrack || normalizeBackendSong({ fileName });
       if (trackToAdd && !activeQueue.some(t => (t.id && t.id === trackToAdd.id) || (t.fileName && t.fileName === trackToAdd.fileName))) {
           activeQueue.push(trackToAdd);
           buildQueueOrder();
           renderQueue();
       }
    }

    if (playlistStatus) playlistStatus.textContent = 'Song added to playlist.';
  }

  function setNowPlayingMeta(track) {
    if (!track) return;
    const title = track.Title || track.title || 'Unknown Title';
    const artist = track.Artist || track.artist || 'Unknown Artist';
    
    if (sidebarTrackTitle) sidebarTrackTitle.textContent = title;
    if (sidebarTrackArtist) sidebarTrackArtist.textContent = artist;
    if (currentTrackTitle) currentTrackTitle.textContent = title;
    if (currentTrackArtist) currentTrackArtist.textContent = artist;
    if (currentPlaylistName) currentPlaylistName.textContent = track.playlist || 'SQL Server DB: MusicPlayerDb';
    
    if (playerTrack) {
        playerTrack.textContent = title;
        playerTrack.style.cursor = 'pointer';
        playerTrack.style.textDecoration = 'underline';
        playerTrack.onclick = () => { if(window.openSongDetailView) window.openSongDetailView(track); else if(window.openWaveformView) window.openWaveformView(track); };
    }
    if (playerArtist) {
        playerArtist.textContent = artist;
        playerArtist.style.cursor = 'pointer';
        playerArtist.title = `Go to ${artist}`;
        playerArtist.onmouseover = () => { playerArtist.style.textDecoration = 'underline'; };
        playerArtist.onmouseout = () => { playerArtist.style.textDecoration = 'none'; };
        playerArtist.onclick = () => {
            if (artist && window.openArtistDetailView) {
                window.openArtistDetailView(track.artistId || artist);
            }
        };
    }
    
    // Right Side Panel "Now Playing" view elements
    const rightPanelTrackTitle = document.getElementById('rightPanelTrackTitle');
    const rightPanelTrackArtist = document.getElementById('rightPanelTrackArtist');
    if (rightPanelTrackTitle) {
        rightPanelTrackTitle.textContent = title;
        rightPanelTrackTitle.style.cursor = 'pointer';
        rightPanelTrackTitle.style.textDecoration = 'underline';
        rightPanelTrackTitle.onclick = () => { if(window.openSongDetailView) window.openSongDetailView(track); else if(window.openWaveformView) window.openWaveformView(track); };
    }
    const rightPanelMoreBtn = document.getElementById('rightPanelMoreOptionsBtn');
    if (rightPanelMoreBtn) {
        rightPanelMoreBtn.onclick = (e) => {
            if (window.openTrackMenu) {
                window.openTrackMenu(e, track.fileName || title, track.id || '', track.albumId || '', track.artistId || track.artist || '', track.artist || '', currentViewedPlaylist?.id || '');
            }
        };
    }
    if (rightPanelTrackArtist) {
        rightPanelTrackArtist.textContent = artist;
        rightPanelTrackArtist.style.cursor = 'pointer';
        rightPanelTrackArtist.title = `Go to ${artist}`;
        rightPanelTrackArtist.onmouseover = () => { rightPanelTrackArtist.style.textDecoration = 'underline'; };
        rightPanelTrackArtist.onmouseout = () => { rightPanelTrackArtist.style.textDecoration = 'none'; };
        rightPanelTrackArtist.onclick = () => {
            if (artist && window.openArtistDetailView) {
                window.openArtistDetailView(track.artistId || artist);
            }
        };
    }

    // Right Side Panel Art & Mini Art
    const trackCoverUrl = track.coverUrl || (track.id ? `${API_BASE_URL}/songs/${track.id}/cover` : '');
    const rightPanelArtContainer = document.getElementById('rightPanelArtContainer');
    if (rightPanelArtContainer) {
        if (trackCoverUrl) {
            rightPanelArtContainer.innerHTML = `<img src="${trackCoverUrl}" alt="${escapeHtml(title)}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'large-art-placeholder\\'>♪</div>';">`;
        } else {
            rightPanelArtContainer.innerHTML = `<div class="large-art-placeholder">${escapeHtml(track.color || '♪')}</div>`;
        }
    }

    if (miniArt) {
        miniArt.style.cursor = 'pointer';
        miniArt.onclick = () => { if(window.openSongDetailView) window.openSongDetailView(track); };
        if (trackCoverUrl) {
            miniArt.innerHTML = `<img src="${trackCoverUrl}" alt="${escapeHtml(title)}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(track.color || 'AI')}';">`;
            miniArt.style.background = 'transparent';
        } else {
            miniArt.textContent = track.color || 'AI';
        }
    }
    const albumArtBadge = document.getElementById('albumArtBadge');
    if (albumArtBadge) albumArtBadge.textContent = track.color || '♪';
    if (albumArt) {
      const accentColor = track.accent || '#1db954';
      if (trackCoverUrl) {
        albumArt.style.backgroundImage = `url('${trackCoverUrl}')`;
        albumArt.style.backgroundSize = 'cover';
        albumArt.style.backgroundPosition = 'center';
      } else {
        albumArt.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), transparent 28%), linear-gradient(145deg, ${accentColor}, #101010 68%, #202020 100%)`;
      }
    }

    // AI Feature Pills & Tags
    const sidebarAiTag = document.getElementById('sidebarAiTag');
    if (sidebarAiTag) {
      sidebarAiTag.textContent = `Genre: ${track.genre || '--'} | Mood: ${track.mood || '--'}`;
    }

    const pillGenre = document.getElementById('pillGenre');
    const pillMood = document.getElementById('pillMood');
    const pillTempo = document.getElementById('pillTempo');
    if (pillGenre) pillGenre.textContent = `Genre: ${track.genre || 'N/A'}`;
    if (pillMood) pillMood.textContent = `Mood: ${track.mood || 'N/A'}`;
    if (pillTempo) pillTempo.textContent = `Tempo: ${Math.round(track.tempo || 0)} BPM`;

    // AI Feature Breakdown Visual Bars
    const fillEnergy = document.getElementById('fillEnergy');
    const valEnergy = document.getElementById('valEnergy');
    const fillDanceability = document.getElementById('fillDanceability');
    const valDanceability = document.getElementById('valDanceability');
    const fillValence = document.getElementById('fillValence');
    const valValence = document.getElementById('valValence');
    const fillAcousticness = document.getElementById('fillAcousticness');
    const valAcousticness = document.getElementById('valAcousticness');

    const energyPct = Math.round((track.energy || 0) * 100);
    const dancePct = Math.round((track.danceability || 0) * 100);
    const valencePct = Math.round((track.valence || 0) * 100);
    const acousticPct = Math.round((track.acousticness || 0) * 100);

    if (fillEnergy) fillEnergy.style.width = `${energyPct}%`;
    if (valEnergy) valEnergy.textContent = (track.energy || 0).toFixed(2);
    if (fillDanceability) fillDanceability.style.width = `${dancePct}%`;
    if (valDanceability) valDanceability.textContent = (track.danceability || 0).toFixed(2);
    if (fillValence) fillValence.style.width = `${valencePct}%`;
    if (valValence) valValence.textContent = (track.valence || 0).toFixed(2);
    if (fillAcousticness) fillAcousticness.style.width = `${acousticPct}%`;
    if (valAcousticness) valAcousticness.textContent = (track.acousticness || 0).toFixed(2);
  }

  async function authenticatedFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const clone = response.clone();
      const payload = await clone.json().catch(() => ({}));
      const detail = payload.detail || '';
      if (detail.includes('expired') || detail.includes('token') || detail.includes('Authorization')) {
        showToast('error', '🔑 Session Expired', 'Your token has expired. Please sign in again.');
        saveAuthSession('', '', '');
      currentUser = null;
      updatePremiumUI(null);
        userPlaylists = [];
        selectedPlaylistId = '';
        renderUserPlaylists();
        updateAuthChrome('', '', false);
        setAdminVisibility('');
        showSection('home');
        setAuthPanelOpen(true, 'login');
      }
    }

    return response;
  }

  async function refreshLibrary() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/songs`);
      if (!response.ok) {
        throw new Error('Unable to load songs from SQL Server backend.');
      }

      const data = await response.json();
      const songArray = Array.isArray(data) ? data : (data.songs || []);
      tracks = songArray.map(normalizeBackendSong);
      renderPlaylistSongOptions();
      renderQueue();
      renderLibraryGrid();
      if (typeof initAllHomeSections === 'function') {
        initAllHomeSections();
      } else {
        populateHomeGrid();
        populateMadeForYou();
      }

      if (tracks.length > 0) {
        currentTrackIndex = 0;
        setNowPlayingMeta(tracks[0]);
        loadTrack(0, false);
        if (libraryStatus) libraryStatus.textContent = `Loaded ${tracks.length} track(s) from SQL Server (MusicPlayerDb).`;
      } else {
        if (libraryStatus) libraryStatus.textContent = 'No songs in SQL Server. Upload an audio file under AI Song Upload!';
        if (sidebarTrackTitle) sidebarTrackTitle.textContent = 'No Tracks Available';
        if (sidebarTrackArtist) sidebarTrackArtist.textContent = 'Upload a song to get started';
        if (currentTrackTitle) currentTrackTitle.textContent = 'No Tracks Available';
        if (currentTrackArtist) currentTrackArtist.textContent = 'Upload a song to get started';
        if (playerTrack) playerTrack.textContent = 'No Tracks Available';
        if (playerArtist) playerArtist.textContent = 'Upload a song to get started';
      }
    } catch (err) {
      if (libraryStatus) libraryStatus.textContent = err.message || 'Error loading library from SQL Server.';
    }
  }


  function showSection(sectionId) {
    if (sectionId === 'admin' && String(currentAuthRole || '').toLowerCase() !== 'admin') {
      sectionId = 'home';
    }

    sections.forEach((section) => {
      const isActive = section.id === sectionId;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
      section.style.display = isActive ? 'block' : 'none';
    });

    sidebarLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });

    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) {
      if (sectionId === 'lyrics-view') {
        mainPanel.scrollTop = 0;
        mainPanel.style.overflowY = 'hidden';
      } else {
        mainPanel.style.overflowY = 'auto';
      }
    }

    if (sectionId === 'admin' && String(currentAuthRole || '').toLowerCase() === 'admin') {
      window.location.href = '/admin/dashboard';
      return;
    }

    if (sectionId === 'playlists') {
      loadUserPlaylists().catch((error) => {
        if (playlistStatus) playlistStatus.textContent = error.message;
      });
    }
  }

  function formatAdminTimestamp(value) {
    if (!value) return 'No recent activity';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'No recent activity';
    return parsed.toLocaleString();
  }

  function renderAdminOverview(data) {
    if (!adminOverviewGrid) return;

    const cards = [
      { label: 'Library Tracks', value: data.totalTracks, meta: `${data.music.length} track${data.music.length === 1 ? '' : 's'} available now` },
      { label: 'Active Users', value: data.activeUsers, meta: `${data.users.length} listener account${data.users.length === 1 ? '' : 's'} total` },
      { label: 'Active Artists', value: data.activeArtists, meta: `${data.artists.filter((artist) => artist.isFeatured).length} featured artist${data.artists.filter((artist) => artist.isFeatured).length === 1 ? '' : 's'}` },
      { label: 'Admins', value: data.totalAdmins, meta: `Last scan ${formatAdminTimestamp(data.lastScanUtc)}` },
    ];

    adminOverviewGrid.innerHTML = cards.map((card) => `
      <article class="admin-stat-card">
        <div class="admin-stat-label">${escapeHtml(card.label)}</div>
        <div class="admin-stat-value">${escapeHtml(card.value)}</div>
        <div class="admin-stat-meta">${escapeHtml(card.meta)}</div>
      </article>
    `).join('');
  }

  function renderAdminMusic(data) {
    if (adminMusicPath) {
      adminMusicPath.textContent = `Library path: ${data.musicFolderPath}`;
    }

    if (!adminMusicList) return;

    if (!data.music.length) {
      adminMusicList.innerHTML = '<div class="admin-empty-state">No tracks are available in the library yet.</div>';
      return;
    }

    const songViews = new Map((data.songViews || []).map((item) => [item.fileName, item.totalViews]));

    adminMusicList.innerHTML = data.music.map((track) => `
      <article class="admin-list-item">
        <div class="admin-item-main">
          <div class="admin-item-header">
            <div class="admin-item-title">${escapeHtml(track.displayName || 'Untitled Track')}</div>
            <span class="admin-badge is-featured">Views ${escapeHtml(songViews.get(track.fileName) || 0)}</span>
          </div>
          <div class="admin-item-meta">${escapeHtml(track.artist || 'Unknown Artist')} • ${escapeHtml(track.extension || 'audio')} • ${escapeHtml(track.fileName || '')}</div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="secondary-action" data-admin-song-detail="${encodeURIComponent(track.fileName || '')}" onclick="adminViewSongDetails('${encodeURIComponent(track.fileName || '')}')">View Details</button>
          <a class="secondary-action admin-link-button" href="/music/download/${encodeURIComponent(track.fileName)}">Download</a>
          <button type="button" class="secondary-action danger-action" data-admin-delete-track="${encodeURIComponent(track.fileName || '')}" onclick="adminDeleteSong('${encodeURIComponent(track.fileName || '')}')">Remove</button>
        </div>
      </article>
    `).join('');
  }

  function safeDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value || '');
    } catch {
      return String(value || '');
    }
  }

  function renderAdminSongDetail(detail) {
    if (!adminSongDetail) return;

    if (!detail || !detail.fileName) {
      adminSongDetail.textContent = 'Select a song and click View Details to see which user IDs listened and how many times.';
      return;
    }

    const listeners = detail.listeners || [];
    const listenerRows = listeners.length
      ? listeners.map((listener) => `
        <tr>
          <td>${escapeHtml(listener.userId)}</td>
          <td>${escapeHtml(listener.listenCount)}</td>
        </tr>`).join('')
      : '<tr><td colspan="2">No listens recorded yet.</td></tr>';

    adminSongDetail.innerHTML = `
      <div class="admin-song-detail-title">${escapeHtml(detail.displayName || detail.fileName)}</div>
      <div class="admin-song-detail-meta">Total views: ${escapeHtml(detail.totalViews || 0)} • File: ${escapeHtml(detail.fileName)}</div>
      <table class="admin-song-detail-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Listens</th>
          </tr>
        </thead>
        <tbody>
          ${listenerRows}
        </tbody>
      </table>
    `;

    adminSongDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderAdminAccounts(listElement, accounts, options = {}) {
    if (!listElement) return;

    if (!accounts.length) {
      listElement.innerHTML = '<div class="admin-empty-state">No accounts are available for this group yet.</div>';
      return;
    }

    listElement.innerHTML = accounts.map((account) => `
      <article class="admin-list-item">
        <div class="admin-item-main">
          <div class="admin-item-header">
            <div class="admin-item-title">${escapeHtml(account.displayName)}</div>
            <span class="admin-badge ${account.isActive ? 'is-active' : 'is-paused'}">${account.isActive ? 'Active' : 'Paused'}</span>
            ${options.allowFeatured ? `<span class="admin-badge ${account.isFeatured ? 'is-featured' : 'is-idle'}">${account.isFeatured ? 'Featured' : 'Standard'}</span>` : ''}
          </div>
          <div class="admin-item-meta">@${escapeHtml(account.username)} • ${escapeHtml(account.uploadedTracks)} uploads • Last active ${escapeHtml(formatAdminTimestamp(account.lastActiveUtc))}</div>
          <div class="admin-item-note">${escapeHtml(account.notes || '')}</div>
        </div>
        <div class="admin-item-actions">
          ${options.allowFeatured ? `<button type="button" class="secondary-action" data-admin-feature-artist="${escapeHtml(account.username)}">${account.isFeatured ? 'Remove Feature' : 'Feature Artist'}</button>` : ''}
          <button type="button" class="secondary-action" data-admin-toggle-account="${escapeHtml(account.username)}">${account.isActive ? 'Pause Access' : 'Restore Access'}</button>
        </div>
      </article>
    `).join('');

    listElement.querySelectorAll('[data-admin-toggle-account]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await toggleAdminAccountStatus(button.dataset.adminToggleAccount || '');
        } catch (error) {
          if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
        }
      });
    });

    listElement.querySelectorAll('[data-admin-feature-artist]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await toggleAdminArtistFeatured(button.dataset.adminFeatureArtist || '');
        } catch (error) {
          if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
        }
      });
    });
  }

  function renderAdminDashboard(data) {
    if (!data) return;

    renderAdminOverview(data);
    renderAdminMusic(data);
    renderAdminAccounts(adminUsersList, data.users || []);
    renderAdminAccounts(adminArtistsList, data.artists || [], { allowFeatured: true });

    if (adminDashboardStatus) {
      adminDashboardStatus.textContent = `Admin dashboard synced from ${data.musicFolderPath}. Last scan ${formatAdminTimestamp(data.lastScanUtc)}.`;
    }
  }

  async function loadAdminDashboard() {
    if (String(currentAuthRole || '').toLowerCase() !== 'admin') {
      return;
    }

    const response = await authenticatedFetch('/admin/dashboard');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to load the admin dashboard.');
    }

    renderAdminDashboard(payload);
  }

  async function loadAdminSongDetail(fileName) {
    if (!fileName) return;

    const response = await authenticatedFetch(`/admin/music/views?fileName=${encodeURIComponent(fileName)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to load song view details.');
    }

    renderAdminSongDetail(payload);
  }

  async function toggleAdminAccountStatus(username) {
    if (!username) return;

    const response = await authenticatedFetch(`/admin/accounts/${encodeURIComponent(username)}/toggle-status`, {
      method: 'POST',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to update account access.');
    }

    renderAdminDashboard(payload);
  }

  async function toggleAdminArtistFeatured(username) {
    if (!username) return;

    const response = await authenticatedFetch(`/admin/artists/${encodeURIComponent(username)}/toggle-featured`, {
      method: 'POST',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to update artist feature status.');
    }

    renderAdminDashboard(payload);
  }

  async function deleteAdminTrack(fileName) {
    if (!fileName) return;

    const response = await authenticatedFetch(`/admin/music/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Unable to remove the selected track.');
    }

    renderAdminDashboard(payload);
    renderAdminSongDetail();
    await refreshLibrary();
  }

  async function handleAdminSongDetailClick(encodedFileName) {
    try {
      if (adminSongDetail) adminSongDetail.textContent = 'Loading listen details...';
      await loadAdminSongDetail(safeDecodeURIComponent(encodedFileName || ''));
    } catch (error) {
      if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      if (adminSongDetail) adminSongDetail.textContent = error.message;
    }
  }

  async function handleAdminDeleteTrackClick(encodedFileName) {
    try {
      await deleteAdminTrack(safeDecodeURIComponent(encodedFileName || ''));
    } catch (error) {
      if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      if (adminSongDetail) adminSongDetail.textContent = error.message;
    }
  }

  async function reportTrackListen(track) {
    if (!track?.fileName) return;
    if (lastReportedListenFileName === track.fileName) return;

    const response = await authenticatedFetch('/music/listen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName: track.fileName }),
    });

    if (response.ok) {
      lastReportedListenFileName = track.fileName;
      if (String(currentAuthRole || '').toLowerCase() === 'admin') {
        await loadAdminDashboard();
      }
    }
  }



  function updateTransportUI() {
    const icon = isPlaying ? '❚❚' : '▶';
    if (playPauseButton) {
      playPauseButton.textContent = icon;
      playPauseButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    }

    if (shuffleButton) {
      const isSmart = shuffleMode === 'smart';
      const isStd = shuffleMode === 'standard';
      shuffleButton.classList.toggle('active', isStd || isSmart);
      if (isSmart) {
        shuffleButton.style.color = '#ff4b4b'; // Smart Shuffle uses red/accent color
        shuffleButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.95l-1.017-1.018a.75.75 0 1 0 1.06-1.06L15.98 13.25l-2.829 2.828a.75.75 0 1 0 1.06 1.06l1.017-1.018h-4.068c-1.109 0-2.16-.49-2.873-1.34l-1.626-1.937.979-1.167 1.626 1.938a2.25 2.25 0 0 0 1.724.804z"></path></svg>`;
        shuffleButton.setAttribute('aria-label', 'Smart Shuffle On');
        shuffleButton.setAttribute('title', 'Smart Shuffle On');
      } else if (isStd) {
        shuffleButton.style.color = '#1db954';
        shuffleButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.95l-1.017-1.018a.75.75 0 1 0 1.06-1.06L15.98 13.25l-2.829 2.828a.75.75 0 1 0 1.06 1.06l1.017-1.018h-4.068c-1.109 0-2.16-.49-2.873-1.34l-1.626-1.937.979-1.167 1.626 1.938a2.25 2.25 0 0 0 1.724.804z"></path></svg>`;
        shuffleButton.setAttribute('aria-label', 'Shuffle on');
        shuffleButton.setAttribute('title', 'Shuffle on');
      } else {
        shuffleButton.style.color = 'var(--muted, #b3b3b3)';
        shuffleButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5zM11.16 12.5h1.95l-1.017-1.018a.75.75 0 1 0 1.06-1.06L15.98 13.25l-2.829 2.828a.75.75 0 1 0 1.06 1.06l1.017-1.018h-4.068c-1.109 0-2.16-.49-2.873-1.34l-1.626-1.937.979-1.167 1.626 1.938a2.25 2.25 0 0 0 1.724.804z"></path></svg>`;
        shuffleButton.setAttribute('aria-label', 'Shuffle off');
        shuffleButton.setAttribute('title', 'Shuffle off');
      }
    }

    if (loopButton) {
      const isOff = loopMode === 'off';
      const isTrack = loopMode === 'track';
      const loopLabel = isOff ? 'Enable repeat' : isTrack ? 'Repeat one' : 'Repeat all';

      loopButton.setAttribute('title', loopLabel);
      loopButton.setAttribute('aria-label', loopLabel);
      loopButton.classList.toggle('active', !isOff);

      if (isOff) {
        loopButton.style.color = 'var(--muted, #b3b3b3)';
        loopButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L7.243 13.05a.75.75 0 0 1 0-1.06l2.525-2.525a.75.75 0 1 1 1.06 1.06L9.811 11.55h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5a.75.75 0 0 1 0 1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>`;
      } else if (isTrack) {
        loopButton.style.color = '#1db954';
        loopButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L7.243 13.05a.75.75 0 0 1 0-1.06l2.525-2.525a.75.75 0 1 1 1.06 1.06L9.811 11.55h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5a.75.75 0 0 1 0 1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path><text x="8" y="9" font-size="6.5" font-weight="bold" text-anchor="middle" fill="#1db954" font-family="sans-serif">1</text></svg>`;
      } else {
        loopButton.style.color = '#1db954';
        loopButton.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L7.243 13.05a.75.75 0 0 1 0-1.06l2.525-2.525a.75.75 0 1 1 1.06 1.06L9.811 11.55h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5a.75.75 0 0 1 0 1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>`;
      }
    }

    const sdPlayBtn = document.getElementById('sdPlayBtn');
    if (sdPlayBtn) {
      const curList = getCurrentQueue();
      const curTrack = curList[currentTrackIndex];
      const isCur = window.currentSongDetailTrack && curTrack && (
        (curTrack.id && (curTrack.id === window.currentSongDetailTrack.id || curTrack.id === window.currentSongDetailTrack.Id)) ||
        (curTrack.fileName && curTrack.fileName === window.currentSongDetailTrack.fileName) ||
        (curTrack.title && window.currentSongDetailTrack.title && curTrack.title === window.currentSongDetailTrack.title)
      );
      if (isCur && isPlaying) {
        sdPlayBtn.innerHTML = '<svg height="28" width="28" viewBox="0 0 24 24" fill="#000"><path d="M5.7 3a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7H5.7zm10 0a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-2.6z"></path></svg>';
      } else {
        sdPlayBtn.innerHTML = '<svg height="28" width="28" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path></svg>';
      }
    }
  }

  function updateProgressUI() {
    if (!audioPlayer) return;

    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    const current = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;
    const progress = duration > 0 ? (current / duration) * 100 : 0;

    if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
    if (progressFill) progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    
    if (window.updateWaveformProgress) {
        window.updateWaveformProgress(current, duration);
    }

    if (typeof syncLyricsTime === 'function') {
        syncLyricsTime(current);
    }
    
    // Spotify-style stream tracking: record a play after 30 seconds, or at half the duration for very short tracks
    if (!currentTrackPlayRecorded && duration > 0 && current > 0) {
        if (current >= 30 || current >= (duration / 2)) {
            currentTrackPlayRecorded = true;
            const trackList = getCurrentQueue();
            const track = trackList[currentTrackIndex];
            if (track && (track.id || track.fileName)) {
                fetch('/music/record-play', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: track.fileName || '', id: track.id || '' })
                }).catch(() => {});
            }
        }
    }
  }

  function getCurrentQueue() {
    return (activeQueue && activeQueue.length > 0) ? activeQueue : tracks;
  }

  function buildQueueOrder() {
    const list = getCurrentQueue();
    if (!list || !list.length) {
      queueOrder = [];
      return;
    }

    if (shuffleMode === 'off') {
      queueOrder = Array.from({ length: list.length }, (_, index) => index);
      return;
    }

    const smartIndices = [];
    const normalIndices = [];

    for (let i = 0; i < list.length; i++) {
      if (i === currentTrackIndex) continue;
      if (list[i] && list[i].isSmartRecommendation) {
        smartIndices.push(i);
      } else {
        normalIndices.push(i);
      }
    }

    // Shuffle normal indices
    for (let index = normalIndices.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [normalIndices[index], normalIndices[swapIndex]] = [normalIndices[swapIndex], normalIndices[index]];
    }

    // Shuffle smart indices
    for (let index = smartIndices.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [smartIndices[index], smartIndices[swapIndex]] = [smartIndices[swapIndex], smartIndices[index]];
    }

    if (shuffleMode === 'smart' && smartIndices.length > 0) {
      const interleaved = [];
      let sIdx = 0;
      let nIdx = 0;

      // Start with a recommendation right after current song
      if (sIdx < smartIndices.length) {
        interleaved.push(smartIndices[sIdx++]);
      }

      while (sIdx < smartIndices.length || nIdx < normalIndices.length) {
        if (nIdx < normalIndices.length) interleaved.push(normalIndices[nIdx++]);
        if (sIdx < smartIndices.length) interleaved.push(smartIndices[sIdx++]);
        if (nIdx < normalIndices.length) interleaved.push(normalIndices[nIdx++]);
      }

      queueOrder = [currentTrackIndex, ...interleaved];
      return;
    }

    queueOrder = [currentTrackIndex, ...normalIndices];
  }

  function getQueuePosition(trackIndex) {
    return queueOrder.indexOf(trackIndex);
  }

  function renderQueue() {
    if (!queueList) return;
    const list = getCurrentQueue();

    if (!queueOrder.length || queueOrder.length !== list.length) {
      buildQueueOrder();
    }

    queueList.innerHTML = '';

    const queueHeader = document.createElement('div');
    queueHeader.className = 'queue-header-subtitle';
    queueHeader.style.cssText = 'padding: 10px 16px; font-size: 13px; font-weight: bold; color: #1db954; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px;';
    queueHeader.textContent = `Playing from: ${currentQueueTitle || 'Library'}`;
    queueList.appendChild(queueHeader);

    queueOrder.forEach((trackIndex) => {
      const track = list[trackIndex];
      if (!track) return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'queue-item' + (track.isSmartRecommendation ? ' smart-rec-item' : '');
      item.dataset.trackIndex = String(trackIndex);
      const cover = track.coverUrl || track.coverArt || (track.id ? `${API_BASE_URL}/songs/${track.id}/cover` : '');
      const thumbHtml = cover 
        ? `<div class="queue-thumb"><img src="${cover}" alt="art" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(track.color || '🎵')}';"></div>`
        : `<div class="queue-thumb">${track.color || '🎵'}</div>`;
      const recBadge = track.isSmartRecommendation 
        ? `<span class="smart-rec-badge">✨ Recommended</span>` 
        : '';
      item.innerHTML = `
        ${thumbHtml}
        <div class="queue-info">
          <div class="queue-title" title="${escapeHtml(track.title || 'Unknown')}">${escapeHtml(track.title || 'Unknown')}${recBadge}</div>
          <div class="queue-meta" title="${escapeHtml(track.artist || 'Unknown')}">${escapeHtml(track.artist || 'Unknown')}</div>
        </div>
        <div class="queue-time">${track.duration ? formatTime(track.duration) : ''}</div>
      `;
      item.addEventListener('click', () => loadTrack(trackIndex, true));
      queueList.appendChild(item);
    });

    // Populate Now Playing card in queue panel if element exists
    const nowPlayingCard = document.getElementById('queueNowPlayingCard');
    if (nowPlayingCard) {
      const currentTrack = list[currentTrackIndex];
      if (currentTrack) {
        const npCover = currentTrack.coverUrl || currentTrack.coverArt || (currentTrack.id ? `${API_BASE_URL}/songs/${currentTrack.id}/cover` : '');
        const npThumb = npCover 
          ? `<div class="queue-thumb"><img src="${npCover}" alt="art" onerror="this.onerror=null; this.parentElement.textContent='${escapeHtml(currentTrack.color || '🎵')}';"></div>`
          : `<div class="queue-thumb">${currentTrack.color || '🎵'}</div>`;
        nowPlayingCard.innerHTML = `
          <div class="queue-item active" style="margin-bottom: 12px;">
            ${npThumb}
            <div class="queue-info">
              <div class="queue-title" title="${escapeHtml(currentTrack.title || 'Unknown')}">${escapeHtml(currentTrack.title || 'Unknown')}</div>
              <div class="queue-meta" title="${escapeHtml(currentTrack.artist || 'Unknown')}">${escapeHtml(currentTrack.artist || 'Unknown')}</div>
            </div>
            <div class="queue-time">Now playing</div>
          </div>
        `;
      } else {
        nowPlayingCard.innerHTML = '';
      }
    }

    updateActiveQueueItem();
  }

  function updateActiveQueueItem() {
    const list = getCurrentQueue();
    const items = Array.from(document.querySelectorAll('.queue-item'));
    items.forEach((item) => {
      const trackIndex = Number(item.dataset.trackIndex);
      const active = trackIndex === currentTrackIndex;
      item.classList.toggle('active', active);
      const timeCell = item.querySelector('.queue-time');
      if (timeCell && list[trackIndex]) {
        timeCell.textContent = active && isPlaying ? 'Now playing' : formatTime(list[trackIndex].duration || 0);
      }
    });

    const artistRows = Array.from(document.querySelectorAll('#artistPopularTracks .spotify-track-row'));
    if (artistRows.length && typeof currentArtistContext !== 'undefined' && currentArtistContext && list[currentTrackIndex]) {
      const cur = list[currentTrackIndex];
      artistRows.forEach((row, idx) => {
        const rowSong = currentArtistContext.songs ? currentArtistContext.songs[idx] : null;
        const isActive = rowSong && ((rowSong.id && (rowSong.id === cur.id || rowSong.id === cur.Id)) || (rowSong.title && rowSong.title === cur.title) || (rowSong.fileName && rowSong.fileName === cur.fileName));
        row.classList.toggle('is-active', Boolean(isActive));
      });
    }
  }

  function renderLibraryGrid() {
    if (!playlistGrid) return;

    playlistGrid.innerHTML = '';
    tracks.forEach((track, index) => {
      const row = document.createElement('article');
      row.className = 'song-row';
      const trackIdOrFileName = track.id || track.fileName || track.title;
      row.innerHTML = `
        <div class="song-row-thumb">${track.color}</div>
        <div class="song-row-main">
          <div class="song-row-title">${track.title}</div>
          <div class="song-row-artist">${track.artist}</div>
        </div>
        <div class="song-row-meta">${track.playlist}</div>
        <div class="song-row-actions">
          <button type="button" class="secondary-action" data-song-play="${index}">Play</button>
          <button type="button" class="secondary-action" data-song-add="${encodeURIComponent(trackIdOrFileName)}">+ Add To Playlist</button>
        </div>
      `;
      playlistGrid.appendChild(row);
    });
  }

  function renderBrowseGrid() {
    if (!browsePlaylistGrid || typeof browsePlaylists === 'undefined' || !browsePlaylists) return;

    browsePlaylistGrid.innerHTML = '';
    browsePlaylists.forEach((playlist) => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.innerHTML = `
        <div class="playlist-cover">${playlist.badge}</div>
        <div class="playlist-name">${playlist.name}</div>
        <div class="playlist-meta">${playlist.subtitle}</div>
      `;
      browsePlaylistGrid.appendChild(card);
    });
  }

  function createDemoAudioUrl(track) {
    const sampleRate = 22050;
    const duration = 24;
    const samples = sampleRate * duration;
    const bytesPerSample = 2;
    const buffer = new ArrayBuffer(44 + samples * bytesPerSample);
    const view = new DataView(buffer);

    function writeString(offset, text) {
      for (let index = 0; index < text.length; index += 1) {
        view.setUint8(offset + index, text.charCodeAt(index));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * bytesPerSample, true);

    let offset = 44;
    for (let index = 0; index < samples; index += 1) {
      const time = index / sampleRate;
      const step = Math.floor(time / 4) % track.frequencies.length;
      const base = track.frequencies[step];
      const envelope = Math.sin(Math.min(1, (time % 4) / 4) * Math.PI);
      const pulse = 0.28 * Math.sin(2 * Math.PI * base * time)
        + 0.13 * Math.sin(2 * Math.PI * base * 2 * time)
        + 0.08 * Math.sin(2 * Math.PI * (base / 2) * time);
      const shaped = pulse * (0.35 + envelope * 0.65);
      const sample = Math.max(-1, Math.min(1, shaped)) * 32767;
      view.setInt16(offset, sample, true);
      offset += bytesPerSample;
    }

    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  }

  function seedDemoTracks() {
    tracks = demoTracks.map((track) => ({
      ...track,
      src: createDemoAudioUrl(track),
      duration: 24,
    }));
  }

  function revokeUploadedTrackUrls() {
    uploadedTrackUrls.forEach((url) => URL.revokeObjectURL(url));
    uploadedTrackUrls = [];
  }

  function loadTrack(index, autoplay = false) {
    if (typeof index === 'object' && index !== null) {
      const target = index;
      const curList = getCurrentQueue();
      let pos = curList.findIndex(t => (target.id && (t.id === target.id || t.Id === target.id)) || (target.fileName && t.fileName === target.fileName) || (t.title && target.title && t.title.toLowerCase() === target.title.toLowerCase()));
      if (pos === -1) {
        const libPos = tracks.findIndex(t => (target.id && (t.id === target.id || t.Id === target.id)) || (target.fileName && t.fileName === target.fileName) || (t.title && target.title && t.title.toLowerCase() === target.title.toLowerCase()));
        if (libPos !== -1) {
          activeQueue = [...tracks];
          currentQueueTitle = 'Library';
          currentViewedPlaylist = null;
          buildQueueOrder();
          pos = libPos;
        } else {
          activeQueue.unshift(target);
          currentQueueTitle = 'Now Playing';
          currentViewedPlaylist = null;
          buildQueueOrder();
          pos = 0;
        }
      }
      index = pos;
    }

    const list = getCurrentQueue();
    if (!list.length) return;

    if (activeQueue && activeQueue.length > 0 && activeQueue !== tracks && typeof index === 'number' && index >= list.length && tracks[index]) {
      activeQueue = [...tracks];
      currentQueueTitle = 'Library';
      currentViewedPlaylist = null;
      buildQueueOrder();
      renderQueue();
      return loadTrack(index, autoplay);
    }

    currentTrackIndex = (index + list.length) % list.length;
    if (shuffleMode !== 'off') {
      buildQueueOrder();
    }
    lastReportedListenFileName = '';
    currentTrackPlayRecorded = false;
    const track = list[currentTrackIndex];
    if (autoplay && track && typeof SpotifakeHistory !== 'undefined') {
      SpotifakeHistory.recordPlay(track, { playlistName: currentQueueTitle });
    }
    if (audioPlayer && track.src) {
      audioPlayer.src = track.src;
      audioPlayer.loop = loopMode === 'track';
      audioPlayer.load();
      if (autoplay) {
        audioPlayer.play().then(() => {
          isPlaying = true;
          updateTransportUI();
          updateActiveQueueItem();
        }).catch(() => {
          isPlaying = false;
          updateTransportUI();
        });
      }
    }

    setNowPlayingMeta(track);
    updateTransportUI();
    updateProgressUI();
    updateActiveQueueItem();
    renderQueue();
    
    if (window.initializeWaveform) {
        window.initializeWaveform(track);
    }

    const lyricsSection = document.getElementById('lyrics-view');
    if (lyricsSection && !lyricsSection.hidden && lyricsSection.style.display !== 'none') {
        renderLyrics();
    }

    const songDetailSection = document.getElementById('song-detail-view');
    if (songDetailSection && !songDetailSection.hidden && songDetailSection.classList.contains('active')) {
      if (typeof window.renderSongDetailView === 'function') {
        window.renderSongDetailView(track);
      }
    }
  }

  function togglePlay() {
    const list = getCurrentQueue();
    if (!audioPlayer || !list.length) return;

    if (audioPlayer.paused) {
      audioPlayer.play().catch(() => { });
    } else {
      audioPlayer.pause();
    }
  }

  function removeSmartRecommendations() {
    if (activeQueue && activeQueue.length > 0) {
      activeQueue = activeQueue.filter(t => !t.isNewlyInjected);
      activeQueue.forEach(t => {
        delete t.isSmartRecommendation;
        delete t.isNewlyInjected;
      });
    }
    tracks.forEach(t => {
      delete t.isSmartRecommendation;
      delete t.isNewlyInjected;
    });
  }

  async function toggleShuffle() {
    if (shuffleMode === 'off') {
      shuffleMode = 'standard';
      buildQueueOrder();
      updateTransportUI();
      renderQueue();
    } else if (shuffleMode === 'standard') {
      shuffleMode = 'smart';
      updateTransportUI();
      await runSmartShuffle();
    } else {
      shuffleMode = 'off';
      removeSmartRecommendations();
      const list = getCurrentQueue();
      if (currentTrackIndex >= list.length) {
        currentTrackIndex = Math.max(0, list.length - 1);
      }
      buildQueueOrder();
      updateTransportUI();
      renderQueue();
    }
  }

  async function runSmartShuffle() {
    const list = getCurrentQueue();
    if (!list || list.length === 0) return;
    try {
      showToast('info', 'Smart Shuffle', 'Fetching recommendations...');
      
      const currentTrack = list[currentTrackIndex];
      const seedIds = [];
      if (currentTrack && (currentTrack.id || currentTrack.Id)) {
        seedIds.push(currentTrack.id || currentTrack.Id);
      }
      for (const t of list) {
        const id = t.id || t.Id || t.songID;
        if (id && !seedIds.includes(id)) {
          seedIds.push(id);
          if (seedIds.length >= 5) break;
        }
      }

      const payload = {
        seed_track_ids: seedIds,
        playlist_song_ids: seedIds,
        n_recommendations: 8
      };

      const response = await fetch('/api/recommendations/smart-shuffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const rawRecs = data.recommendations || [];
        if (rawRecs.length > 0) {
          if (!activeQueue || activeQueue.length === 0) {
            activeQueue = [...tracks];
          }

          const currentTrackId = String(activeQueue[currentTrackIndex]?.id || '');
          const existingIds = new Set(activeQueue.map(t => String(t.id || t.Id)));
          
          for (const r of rawRecs) {
            const rid = String(r.id);
            if (rid === currentTrackId) continue;
            if (existingIds.has(rid)) {
              const found = activeQueue.find(t => String(t.id || t.Id) === rid);
              if (found) found.isSmartRecommendation = true;
            } else {
              const t = normalizeBackendSong(r);
              t.isSmartRecommendation = true;
              t.isNewlyInjected = true;
              activeQueue.push(t);
              existingIds.add(rid);
            }
          }

          const recIdSet = new Set(rawRecs.map(r => String(r.id)));
          activeQueue.forEach(t => {
            if (recIdSet.has(String(t.id || t.Id)) && String(t.id || t.Id) !== currentTrackId) {
              t.isSmartRecommendation = true;
            }
          });

          buildQueueOrder();
          renderQueue();

          const totalSmartCount = activeQueue.filter(t => t.isSmartRecommendation).length;
          showToast('success', 'Smart Shuffle Active', `Smart shuffle active with ${totalSmartCount} AI recommendations.`);
        } else {
          showToast('info', 'Smart Shuffle Active', 'Smart shuffle active.');
        }
      } else {
        showToast('error', 'Smart Shuffle Failed', 'Failed to fetch recommendations.');
      }
    } catch(err) {
      console.error('Smart shuffle error:', err);
      showToast('error', 'Smart Shuffle Error', 'Could not connect to recommendation service.');
    }
  }

  function setLoopMode(mode) {
    loopMode = mode;
    if (audioPlayer) {
      audioPlayer.loop = mode === 'track';
    }
    updateTransportUI();
  }

  function cycleLoop() {
    if (loopMode === 'off') {
      setLoopMode('playlist');
    } else if (loopMode === 'playlist') {
      setLoopMode('track');
    } else {
      setLoopMode('off');
    }
  }

  function previousTrack() {
    const list = getCurrentQueue();
    if (!list.length) return;
    if (audioPlayer && audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
      return;
    }

    if (shuffleMode !== 'off' && queueOrder.length) {
      const queuePosition = getQueuePosition(currentTrackIndex);
      if (queuePosition > 0) {
        loadTrack(queueOrder[queuePosition - 1], true);
        renderQueue();
        return;
      }

      if (loopMode === 'playlist' && queueOrder.length > 1) {
        loadTrack(queueOrder[queueOrder.length - 1], true);
        renderQueue();
        return;
      }
    }

    const nextIndex = currentTrackIndex === 0
      ? (loopMode === 'playlist' ? list.length - 1 : 0)
      : currentTrackIndex - 1;
    loadTrack(nextIndex, true);
    renderQueue();
  }

  function nextTrack(isAutoAdvance) {
    const list = getCurrentQueue();
    if (!list.length) return;

    // Check free tier skip limits for manual skips
    const isPrem = !!(currentUser && (currentUser.isPremium || currentUser.premium || currentUser.subscriptionTier === 'Premium'));
    if (!isPrem && isAutoAdvance !== true) {
      const now = Date.now();
      skipTimestamps = skipTimestamps.filter(ts => (now - ts) < 3600000);
      const limit = (window.platformSettings && window.platformSettings.skipLimit) ? window.platformSettings.skipLimit : 6;
      if (skipTimestamps.length >= limit) {
        showToast('warning', 'Skip Limit Reached', `You've reached your ${limit} skips per hour limit. Upgrade to Premium for unlimited skips!`);
        openCheckoutModal('Individual');
        return;
      }
      skipTimestamps.push(now);
      try { localStorage.setItem('spotifake_skips', JSON.stringify(skipTimestamps)); } catch (e) {}
    }

    let nextIndex;
    if (shuffleMode !== 'off') {
      const queuePosition = getQueuePosition(currentTrackIndex);
      if (queuePosition >= 0 && queuePosition < queueOrder.length - 1) {
        nextIndex = queueOrder[queuePosition + 1];
      } else if (loopMode === 'playlist') {
        buildQueueOrder();
        nextIndex = queueOrder.length > 1 ? queueOrder[1] : queueOrder[0];
      } else {
        if (audioPlayer) audioPlayer.pause();
        isPlaying = false;
        updateTransportUI();
        updateActiveQueueItem();
        return;
      }
    } else if (currentTrackIndex >= list.length - 1) {
      if (loopMode === 'playlist') {
        nextIndex = 0;
      } else {
        if (audioPlayer) audioPlayer.pause();
        isPlaying = false;
        updateTransportUI();
        updateActiveQueueItem();
        return;
      }
    } else {
      nextIndex = currentTrackIndex + 1;
    }

    loadTrack(nextIndex, true);
    renderQueue();
  }

  function handleTrackEnded() {
    const isPrem = !!(currentUser && (currentUser.isPremium || currentUser.premium || currentUser.subscriptionTier === 'Premium'));
    if (!isPrem) {
      freeTierSongCount++;
      try { localStorage.setItem('spotifake_free_songs', String(freeTierSongCount)); } catch (e) {}
      const adFreq = (window.platformSettings && window.platformSettings.adFrequency) ? window.platformSettings.adFrequency : 3;
      if (freeTierSongCount >= adFreq) {
        playAudioAdBreak(() => {
          advanceToNextSong();
        });
        return;
      }
    }
    advanceToNextSong();
  }

  function advanceToNextSong() {
    const list = getCurrentQueue();
    if (loopMode === 'track') {
      if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play().catch(() => { });
      }
      return;
    }

    if (shuffleMode !== 'off') {
      nextTrack(true);
      return;
    }

    if (currentTrackIndex < list.length - 1) {
      nextTrack(true);
      return;
    }

    if (loopMode === 'playlist') {
      loadTrack(0, true);
      return;
    }

    isPlaying = false;
    updateTransportUI();
    updateActiveQueueItem();
  }

  function playAudioAdBreak(onFinished) {
    if (isPlayingAdBreak) return;
    isPlayingAdBreak = true;
    const overlay = document.getElementById('adBreakOverlay');
    const fill = document.getElementById('adProgressBarFill');
    if (overlay) overlay.style.display = 'flex';
    if (fill) fill.style.width = '0%';

    fetch('/admin/dashboard/api/public/ads/stream').then(r => r.ok ? r.json() : null).then(ad => {
      if (ad && overlay) {
        const titleEl = overlay.querySelector('h2') || overlay.querySelector('h3') || overlay.querySelector('p');
        if (titleEl) titleEl.textContent = `📢 Sponsored by ${ad.sponsor}: ${ad.title}`;
      }
    }).catch(() => {});

    // Disable transport controls during ad
    const transportControls = document.querySelectorAll('.transport-controls button, .playback-bar');
    transportControls.forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.5'; });

    playAdSound();

    let progress = 0;
    const durationMs = 5000;
    const intervalMs = 100;
    const step = 100 / (durationMs / intervalMs);
    const timer = setInterval(() => {
      progress += step;
      if (fill) fill.style.width = Math.min(100, progress) + '%';
      if (progress >= 100) {
        clearInterval(timer);
        if (overlay) overlay.style.display = 'none';
        transportControls.forEach(el => { el.style.pointerEvents = ''; el.style.opacity = ''; });
        freeTierSongCount = 0;
        try { localStorage.setItem('spotifake_free_songs', '0'); } catch (e) {}
        isPlayingAdBreak = false;
        if (typeof onFinished === 'function') onFinished();
      }
    }, intervalMs);
  }

  function playAdSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = ctx.currentTime + (idx * 0.15);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.85);
        });
      }
    } catch (e) {}

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Enjoying Spotifake? Upgrade to Premium for uninterrupted music, unlimited skips, and offline listening.");
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  }

  function smartShuffle() {
    alert('Smart Shuffle is not implemented yet.');
  }

  function seekFromClick(event) {
    if (!audioPlayer || !audioPlayer.duration) return;
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    audioPlayer.currentTime = audioPlayer.duration * ratio;
    updateProgressUI();
  }

  function setVolume(value) {
    if (!audioPlayer) return;
    const normalized = Math.max(0, Math.min(100, Number(value)));
    audioPlayer.volume = normalized / 100;
  }

  let previousVolume = 1;
  function toggleMute() {
    if (!audioPlayer) return;
    if (audioPlayer.volume > 0) {
      previousVolume = audioPlayer.volume;
      audioPlayer.volume = 0;
    } else {
      audioPlayer.volume = previousVolume || 1;
    }
  }

  async function uploadBackendFiles() {
    const files = Array.from(backendUpload?.files || []);
    if (!files.length) {
      if (importStatus) importStatus.textContent = 'Select one or more local audio files first.';
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await authenticatedFetch('/music/upload', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Upload failed.');
    }

    if (importStatus) {
      importStatus.textContent = `Uploaded ${payload.items?.length || 0} file(s) to C:\Music.`;
    }

    await refreshLibrary();
    if (String(currentAuthRole || '').toLowerCase() === 'admin') {
      await loadAdminDashboard();
    }
  }

  async function importDirectAudioUrl() {
    const url = String(importUrl?.value || '').trim();
    if (!url) {
      if (importStatus) importStatus.textContent = 'Enter a direct audio file URL first.';
      return;
    }

    const response = await authenticatedFetch('/music/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || 'Import failed.');
    }

    if (importStatus) {
      importStatus.textContent = `Imported ${payload.displayName} into C:\Music.`;
    }

    if (importUrl) importUrl.value = '';
    await refreshLibrary();
  }

  function loadUploadedTracks(fileList) {
    const files = Array.from(fileList || []).filter((file) => file && file.type.startsWith('audio/'));
    if (!files.length) {
      if (libraryStatus) libraryStatus.textContent = 'No supported audio files were selected.';
      return;
    }

    revokeUploadedTrackUrls();
    tracks = files.map((file) => {
      const url = URL.createObjectURL(file);
      uploadedTrackUrls.push(url);
      const title = file.name.replace(/\.[^.]+$/, '');
      return {
        title,
        artist: 'Local File',
        playlist: 'Uploaded Music',
        color: initials(title),
        accent: '#1db954',
        src: url,
        duration: 0,
      };
    });

    currentTrackIndex = 0;
    activeQueue = [...tracks];
    currentQueueTitle = 'Uploaded Music';
    currentViewedPlaylist = null;
    buildQueueOrder();
    renderQueue();
    renderLibraryGrid();
    setNowPlayingMeta(tracks[0]);
    if (libraryStatus) libraryStatus.textContent = `${tracks.length} local audio file${tracks.length === 1 ? '' : 's'} loaded.`;
    loadTrack(0, true);
  }

  function updateLoginState(roleLabel, username) {
    if (loginError) loginError.textContent = '';
    updateAuthChrome(username, roleLabel, true);
    setAdminVisibility(currentAuthRole);
    setAuthPanelOpen(false);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginError) loginError.textContent = '';
      
      const username = String(usernameInput?.value || '').trim();
      const password = String(passwordInput?.value || '');

      if (!username || !password) {
        if (loginError) loginError.textContent = 'Please enter both username and password.';
        return;
      }

      const isSignup = currentAuthMode === 'signup';

      if (isSignup) {
        const confirmPassword = String(signupConfirmPassword?.value || '');
        if (password !== confirmPassword) {
          if (loginError) loginError.textContent = 'Passwords do not match. Please re-enter.';
          return;
        }
      }

      const endpoint = isSignup ? `${API_BASE_URL}/auth/register` : `${API_BASE_URL}/auth/login`;

      const displayName = String(signupDisplayName?.value || '').trim() || username;
      const email = String(signupEmail?.value || '').trim() || `${username}@musicplayer.local`;

      const requestBody = isSignup ? {
        username,
        email,
        password,
        display_name: displayName
      } : {
        username,
        password
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (loginError) loginError.textContent = payload.detail || payload.message || (isSignup ? 'Registration failed.' : 'Login failed.');
          if (loginStatus) loginStatus.textContent = '';
          return;
        }

        const authenticatedUser = payload.username || username;
        const authenticatedRole = (payload.role || (payload.user && payload.user.role) || 'user').toLowerCase();
        const authenticatedToken = payload.access_token || payload.token;
        const roleLabel = authenticatedRole.charAt(0).toUpperCase() + authenticatedRole.slice(1);

        saveAuthSession(authenticatedToken, authenticatedUser, authenticatedRole);
        updateLoginState(roleLabel, authenticatedUser);
        currentUser = payload.user || { username: authenticatedUser, role: authenticatedRole };
        updatePremiumUI(currentUser);

        if (authenticatedRole === 'admin') {
          window.location.href = 'http://' + window.location.hostname + ':9000/admin/dashboard';
          return;
        }
        showSection('home');

        if (importStatus) {
          importStatus.textContent = 'You are signed in. Upload and import are now enabled.';
        }

        showToast('success', isSignup ? 'Account Created' : 'Logged In', isSignup ? `Welcome, ${displayName}! Account created successfully.` : `Signed in as ${authenticatedUser}.`);
        await refreshLibrary();
        await loadUserPlaylists().catch(() => { });
      } catch (err) {
        if (loginError) loginError.textContent = 'Network error connecting to backend API.';
      }
    });
  }

  if (accountType) {
    accountType.addEventListener('change', () => syncLoginHint(String(accountType.value || 'user').toLowerCase()));
  }

  if (loginToggleButton) {
    loginToggleButton.addEventListener('click', () => setAuthPanelOpen(loginGate?.hidden ?? true, 'login'));
  }

  if (signupToggleButton) {
    signupToggleButton.addEventListener('click', () => setAuthPanelOpen(loginGate?.hidden ?? true, 'signup'));
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await authenticatedFetch('/auth/logout', {
          method: 'POST',
        });
      } catch {
        // Ignore logout transport failures; local session state is still cleared below.
      }

      saveAuthSession('', '', '');
      currentUser = null;
      updatePremiumUI(null);
      userPlaylists = [];
      selectedPlaylistId = '';
      renderUserPlaylists();
      updateAuthChrome('', '', false);
      setAdminVisibility('');
      showSection('home');
      setAuthPanelOpen(false);
      if (importStatus) {
        importStatus.textContent = 'You have been signed out.';
      }
    });
  }

  const aiUploadForm = document.getElementById('aiUploadForm');
  const uploadAiStatus = document.getElementById('uploadAiStatus');
  const btnUploadSubmit = document.getElementById('btnUploadSubmit');

  if (aiUploadForm) {
    aiUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!authToken) {
        if (uploadAiStatus) uploadAiStatus.textContent = 'Please log in first before uploading tracks.';
        setAuthPanelOpen(true, 'login');
        return;
      }

      const fileInput = document.getElementById('uploadAudioFile');
      const titleInput = document.getElementById('uploadTitle');
      const artistInput = document.getElementById('uploadArtist');
      const albumInput = document.getElementById('uploadAlbum');

      if (!fileInput.files || !fileInput.files[0]) {
        if (uploadAiStatus) uploadAiStatus.textContent = 'Please select an audio file.';
        return;
      }

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('title', titleInput.value.trim());
      formData.append('artist', artistInput.value.trim());
      formData.append('album', albumInput ? albumInput.value.trim() : '');

      try {
        if (btnUploadSubmit) btnUploadSubmit.disabled = true;
        if (uploadAiStatus) uploadAiStatus.textContent = '⏳ Uploading file...';

        const response = await authenticatedFetch(`${API_BASE_URL}/songs/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to upload song.');
        }

        // File saved instantly — analysis runs in background on the server
        if (uploadAiStatus) uploadAiStatus.textContent = '🔬 File saved! Analyzing audio features in background...';
        showToast('success', '✅ File Uploaded!', 'Analyzing genre & mood in the background (~10s)…');

        aiUploadForm.reset();
        if (btnUploadSubmit) btnUploadSubmit.disabled = false;

        // Add song to library immediately (shows genre as "analyzing...")
        await refreshLibrary();
        const newTrackIndex = tracks.findIndex(t => t.id === data.id);
        if (newTrackIndex !== -1) {
          activeQueue = [...tracks];
          currentQueueTitle = 'Library';
          currentViewedPlaylist = null;
          buildQueueOrder();
          loadTrack(newTrackIndex, true);
          renderQueue();
        }
        showSection('home');

        // Poll /songs/{id}/features every 2s until background analysis is done
        (async () => {
          const maxAttempts = 30;
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
              const fr = await authenticatedFetch(`${API_BASE_URL}/songs/${data.id}/features`);
              const fd = await fr.json();
              if (fd.ready) {
                const msg = `Genre: ${fd.genre} | Mood: ${fd.mood} | Tempo: ${Math.round(fd.tempo)} BPM`;
                showToast('success', `🎵 Analysis Complete — "${data.title || titleInput.value}"`, msg);
                await refreshLibrary();
                return;
              }
            } catch (_) { /* ignore poll errors */ }
          }
          showToast('success', `✅ "${data.title}" saved`, 'Audio analysis still running in background.');
        })();
      } catch (err) {
        if (uploadAiStatus) uploadAiStatus.textContent = `❌ ${err.message}`;
        showToast('error', '❌ Upload Failed', err.message);
      } finally {
        if (btnUploadSubmit) btnUploadSubmit.disabled = false;
      }
    });
  }

  if (sidebarLinks.length) {
    sidebarLinks.forEach((link) => {
      link.addEventListener('click', () => {
        showSection(link.dataset.section || 'home');
      });
    });
  }


  if (trackLoader) {
    trackLoader.addEventListener('change', (event) => {
      const files = event.target.files;
      loadUploadedTracks(files);
    });
  }

  if (uploadToBackendButton) {
    uploadToBackendButton.addEventListener('click', async () => {
      try {
        await uploadBackendFiles();
      } catch (error) {
        if (importStatus) importStatus.textContent = error.message;
      }
    });
  }

  if (importUrlButton) {
    importUrlButton.addEventListener('click', async () => {
      try {
        await importDirectAudioUrl();
        if (String(currentAuthRole || '').toLowerCase() === 'admin') {
          await loadAdminDashboard();
        }
      } catch (error) {
        if (importStatus) importStatus.textContent = error.message;
      }
    });
  }

  if (createPlaylistButton) {
    createPlaylistButton.addEventListener('click', async () => {
      openCreatePlaylistModal();
    });
  }

  if (submitCreatePlaylistButton) {
    submitCreatePlaylistButton.addEventListener('click', async () => {
      try {
        await createPlaylist();
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      }
    });
  }

  if (cancelCreatePlaylistButton) {
    cancelCreatePlaylistButton.addEventListener('click', () => {
      setModalOpen(createPlaylistModal, false);
    });
  }

  if (cancelAddSongModalButton) {
    cancelAddSongModalButton.addEventListener('click', () => {
      setModalOpen(addSongToPlaylistModal, false);
    });
  }

  if (confirmAddSongModalButton) {
    confirmAddSongModalButton.addEventListener('click', async () => {
      try {
        const playlistId = String(addSongPlaylistSelect?.value || '');
        await addSpecificSongToPlaylist(playlistId, pendingAddSongFileName);
        setModalOpen(addSongToPlaylistModal, false);
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      }
    });
  }

  if (playlistSelect) {
    playlistSelect.addEventListener('change', () => {
      selectedPlaylistId = String(playlistSelect.value || '');
      renderUserPlaylists();
    });
  }

  if (addSongToPlaylistButton) {
    addSongToPlaylistButton.addEventListener('click', async () => {
      try {
        await addSongToPlaylist();
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      }
    });
  }

  if (userPlaylistList) {
    userPlaylistList.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const playBtn = target.closest('[data-play-playlist]');
      if (playBtn) {
        event.stopPropagation();
        const plId = String(playBtn.getAttribute('data-play-playlist') || '');
        const pl = userPlaylists.find(p => p.id === plId);
        if (pl && pl.songs && pl.songs.length) {
          playPlaylistContext(pl, 0);
        } else {
          showToast('info', 'Empty Playlist', 'This playlist has no songs yet.');
        }
        return;
      }

      const openBtn = target.closest('[data-open-playlist]');
      if (openBtn) {
        event.stopPropagation();
        const plId = String(openBtn.getAttribute('data-open-playlist') || '');
        if (typeof openPlaylistById === 'function') {
          openPlaylistById(plId);
        } else {
          selectedPlaylistId = plId;
          renderUserPlaylists();
        }
        return;
      }

      const deleteBtn = target.closest('[data-delete-playlist]');
      if (deleteBtn) {
        event.stopPropagation();
        try {
          await deletePlaylist(String(deleteBtn.getAttribute('data-delete-playlist') || ''));
        } catch (error) {
          if (playlistStatus) playlistStatus.textContent = error.message;
        }
        return;
      }

      const selectItem = target.closest('[data-select-playlist]');
      if (selectItem) {
        selectedPlaylistId = String(selectItem.getAttribute('data-select-playlist') || '');
        renderUserPlaylists();
      }
    });
  }

  if (playlistSongsList) {
    playlistSongsList.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const playSongBtn = target.closest('[data-play-song]');
      if (playSongBtn) {
        event.stopPropagation();
        const ident = decodeURIComponent(playSongBtn.getAttribute('data-play-song') || '');
        const songIdxAttr = playSongBtn.getAttribute('data-song-idx');
        const selected = getSelectedPlaylist();
        if (selected && selected.songs && selected.songs.length) {
          const songIdx = songIdxAttr !== null && !isNaN(Number(songIdxAttr))
            ? Number(songIdxAttr)
            : selected.songs.findIndex(s => (s.id || s.Id) === ident || s.fileName === ident);
          if (songIdx !== -1) {
            playPlaylistContext(selected, songIdx);
            return;
          }
        }
        const idx = tracks.findIndex(t => t.fileName === ident || t.id === ident);
        if (idx !== -1) {
          activeQueue = [...tracks];
          currentQueueTitle = 'Library';
          currentViewedPlaylist = null;
          buildQueueOrder();
          loadTrack(idx, true);
          renderQueue();
        } else if (typeof window.playSearchResult === 'function') {
          window.playSearchResult(ident, 'Song', ident);
        }
        return;
      }

      const removeBtn = target.closest('[data-remove-song]');
      if (!removeBtn) return;

      try {
        await removeSongFromPlaylist(decodeURIComponent(removeBtn.getAttribute('data-remove-song') || ''));
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      }
    });
  }

  if (playlistGrid) {
    playlistGrid.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const playBtn = target.closest('[data-song-play]');
      if (playBtn) {
        const index = Number(playBtn.getAttribute('data-song-play'));
        if (Number.isFinite(index) && tracks[index]) {
          activeQueue = [...tracks];
          currentQueueTitle = 'Library';
          currentViewedPlaylist = null;
          buildQueueOrder();
          loadTrack(index, true);
          renderQueue();
        }
        return;
      }

      const addBtn = target.closest('[data-song-add]');
      if (addBtn) {
        const identifier = decodeURIComponent(addBtn.getAttribute('data-song-add') || '');
        openAddSongToPlaylistModal(identifier);
      }
    });
  }

  if (refreshAdminDashboardButton) {
    refreshAdminDashboardButton.addEventListener('click', async () => {
      try {
        await loadAdminDashboard();
      } catch (error) {
        if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      }
    });
  }

  if (adminMusicList) {
    adminMusicList.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const detailButton = target.closest('[data-admin-song-detail]');
      if (detailButton) {
        event.preventDefault();
        await handleAdminSongDetailClick(detailButton.dataset.adminSongDetail || '');
        return;
      }

      const deleteButton = target.closest('[data-admin-delete-track]');
      if (deleteButton) {
        event.preventDefault();
        await handleAdminDeleteTrackClick(deleteButton.dataset.adminDeleteTrack || '');
      }
    });
  }

  if (audioPlayer) {
    audioPlayer.addEventListener('play', () => {
      isPlaying = true;
      updateTransportUI();
      updateActiveQueueItem();
      const list = getCurrentQueue();
      const currentTrack = list && list[currentTrackIndex] ? list[currentTrackIndex] : tracks[currentTrackIndex];
      if (currentTrack && typeof SpotifakeHistory !== 'undefined') {
        SpotifakeHistory.recordPlay(currentTrack, { playlistName: currentQueueTitle });
      }
      reportTrackListen(currentTrack || tracks[currentTrackIndex]).catch(() => { });
    });
    audioPlayer.addEventListener('pause', () => {
      isPlaying = false;
      updateTransportUI();
      updateActiveQueueItem();
    });
    audioPlayer.addEventListener('timeupdate', updateProgressUI);
    audioPlayer.addEventListener('loadedmetadata', () => {
      if (tracks[currentTrackIndex] && !tracks[currentTrackIndex].duration) {
        tracks[currentTrackIndex].duration = Math.floor(audioPlayer.duration || 0);
      }
      updateProgressUI();
      renderQueue();
    });
    audioPlayer.addEventListener('ended', handleTrackEnded);
    audioPlayer.addEventListener('volumechange', () => {
      if (volumeControl) {
        volumeControl.value = String(Math.round((audioPlayer.volume || 0) * 100));
      }
    });
  }

  if (volumeControl) {
    volumeControl.addEventListener('input', (event) => setVolume(event.target.value));
  }

  renderLibraryGrid();
  renderBrowseGrid();
  renderPlaylistSongOptions();
  renderUserPlaylists();
  showSection('home');
  syncLoginHint('user');

  updateTransportUI();
  updateProgressUI();
  if (volumeControl) volumeControl.value = '72';
  if (audioPlayer) audioPlayer.volume = 0.72;

  if (authToken) {
    const storedToken = localStorage.getItem(authTokenKey);
    const storedUser = localStorage.getItem(authUserKey);
    const storedRole = localStorage.getItem(authRoleKey) || 'user';
    if (storedToken && storedUser) {
      authToken = storedToken;
      currentAuthRole = storedRole;
      document.cookie = "jwt_token=" + authToken + "; path=/; max-age=86400; SameSite=Lax";
      updateAuthChrome(storedUser, storedRole.charAt(0).toUpperCase() + storedRole.slice(1), true);
    }
    setAdminVisibility(storedRole);
    loadUserPlaylists().catch(() => { });

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(r => r.ok ? r.json() : null).then(u => {
      if (u) {
        currentUser = u;
        if (u.role) {
          currentAuthRole = u.role.toLowerCase();
          localStorage.setItem(authRoleKey, currentAuthRole);
          const roleLabel = currentAuthRole.charAt(0).toUpperCase() + currentAuthRole.slice(1);
          updateAuthChrome(u.username || storedUser, roleLabel, true);
          setAdminVisibility(currentAuthRole);
        }
        updatePremiumUI(currentUser);
      }
    }).catch(() => {});
  } else {
    updateAuthChrome('', '', false);
    setAdminVisibility('');
    setAuthPanelOpen(true, 'login');
  }

  refreshLibrary().catch(() => {
    // seedDemoTracks();
    renderQueue();
    renderLibraryGrid();
    if (tracks.length) {
      setNowPlayingMeta(tracks[0]);
      loadTrack(0, false);
    }
    if (libraryStatus) libraryStatus.textContent = 'Unable to load C:\Music, so demo tracks are shown instead.';
  });

  window.showSection = showSection;
  window.togglePlay = togglePlay;
  window.toggleShuffle = toggleShuffle;
  window.setLoopMode = setLoopMode;
  window.cycleLoop = cycleLoop;
  window.previousTrack = previousTrack;
  window.nextTrack = nextTrack;
  window.smartShuffle = smartShuffle;
  window.seekFromClick = seekFromClick;
  window.setVolume = setVolume;
  window.adminViewSongDetails = handleAdminSongDetailClick;
  window.adminDeleteSong = handleAdminDeleteTrackClick;

  // Search Logic
  window.handleSearchInput = function(event) {
    const query = event.target.value.toLowerCase();
    const dropdown = document.getElementById('searchDropdown');
    
    if (query.length < 1) {
      dropdown.hidden = true;
      return;
    }
    
    const results = tracks.filter(t => 
      (t.title || '').toLowerCase().includes(query) || 
      (t.artist || '').toLowerCase().includes(query)
    ).slice(0, 10);
    
    if (results.length === 0) {
      dropdown.hidden = true;
      return;
    }
    
    dropdown.innerHTML = results.map(t => {
      const idx = tracks.indexOf(t);
      const isSong = true; // For now all items in tracks are songs
      return `
      <div class="search-dropdown-item" onclick="document.getElementById('searchInput').value=''; document.getElementById('searchDropdown').hidden=true; window.playLibraryTrack(${idx});">
        <img src="${t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.artist)}&background=random&color=fff`}" alt="art">
        <div class="item-text">
          <div class="item-title">${escapeHtml(t.title)}</div>
          <div class="item-subtitle">
            ${isSong ? 'Song • ' : ''}${escapeHtml(t.artist)}
          </div>
        </div>
        <div class="item-action" title="Add to Playlist" onclick="event.stopPropagation(); window.openAddSongToPlaylistModal('${escapeHtml(t.fileName || t.title)}');">
            <svg height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 7v10m-5-5h10"></path>
            </svg>
        </div>
      </div>
      `;
    }).join('');
    dropdown.hidden = false;
  };

  window.currentSearchFilter = 'all';

  window.setSearchFilter = function(filter, btnElement) {
      window.currentSearchFilter = filter;
      const buttons = btnElement.parentElement.querySelectorAll('.filter-chip');
      buttons.forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
      handleSearchSubmit({key: 'Enter'});
  };

  window.performSearch = async function(event) {
    if (event.key === 'Enter') {
      const query = event.target.value.trim();
      if (!query) return;
      document.getElementById('searchInput').value = query; // keep top bar in sync
      handleSearchSubmit({key: 'Enter'});
    }
  };

  window.handleSearchSubmit = async function(event) {
    if (event.key === 'Enter') {
      const query = document.getElementById('searchInput').value.trim();
      document.getElementById('searchDropdown').hidden = true;
      if (!query) return;
      
      showSection('search-results');
      const topResultCard = document.getElementById('topResultCard');
      const songsList = document.getElementById('searchSongsList');
      
      topResultCard.innerHTML = '<h2>Loading...</h2>';
      songsList.innerHTML = '';

      try {
          const res = await fetch(`/search/global?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const rawResults = data.items || [];
          let results = rawResults.map(item => ({
              id: item.id || item.Id || '',
              type: item.type || item.Type || 'Song',
              title: item.title || item.Title || 'Untitled',
              creator: item.creator || item.Creator || 'Unknown',
              imageUrl: item.imageUrl || item.ImageUrl || '',
              fileName: item.fileName || item.FileName || '',
              albumId: item.albumId || item.AlbumId || '',
              artistId: item.artistId || item.ArtistId || ''
          }));
          window.lastSearchResults = results; // Store globally for click handlers
          
          if (window.currentSearchFilter && window.currentSearchFilter !== 'all') {
              const fType = window.currentSearchFilter.toLowerCase();
              if (fType === 'songs') results = results.filter(r => r.type === 'Song');
              else if (fType === 'artists') results = results.filter(r => r.type === 'Artist');
              else if (fType === 'albums') results = results.filter(r => r.type === 'Album');
              else if (fType === 'playlists') results = results.filter(r => r.type === 'Playlist');
          }
          
          if (results.length > 0) {
            const top = results[0];
            const isSong = top.type === 'Song';
            
            // Adjust the grid style to be a vertical stack instead of 2 columns
            const gridContainer = document.querySelector('.search-content-grid');
            if (gridContainer) {
                gridContainer.style.display = 'flex';
                gridContainer.style.flexDirection = 'column';
                gridContainer.style.gap = '24px';
            }
            
            const topCol = document.querySelector('.top-result-col');
            const songsCol = document.querySelector('.songs-result-col');
            if (topCol) topCol.style.display = (window.currentSearchFilter === 'all' || window.currentSearchFilter === '') ? 'block' : 'none';
            if (songsCol) songsCol.querySelector('h2').style.display = 'none'; // hide "Songs"

            topResultCard.innerHTML = `
              <div style="display:flex; align-items:center; background: #282828; padding: 20px; border-radius: 8px; position:relative; cursor:pointer;" class="hover-bg-light" onclick="viewSearchResult('${top.id}', '${top.type}', '${escapeHtml(top.fileName)}')">
                  <img src="${top.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(top.creator)}&background=random&color=fff&size=200`}" alt="art" style="width:120px; height:120px; border-radius:8px; object-fit:cover; margin-right:20px;">
                  <div>
                      <h2 style="margin:0 0 8px 0; font-size:32px; color: #fff;">${escapeHtml(top.title)}</h2>
                      <div style="font-size:14px; color:var(--muted);">
                        ${escapeHtml(top.type)} • ${escapeHtml(top.creator)}
                      </div>
                  </div>
                  
                  <button class="action-icon-btn" onclick="saveSearchResult('${top.id}', '${top.type}', '${escapeHtml(top.fileName)}'); event.stopPropagation();" title="Save" style="position: absolute; right: 100px; color: var(--muted); background: transparent; border: none; cursor: pointer; opacity: 1; z-index: 10;">
                    <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z"></path></svg>
                  </button>
                  <div class="quick-card-play" style="opacity: 1; bottom: auto; right: 20px; top: 50%; transform: translateY(-50%); position:absolute;" onclick="playSearchResult('${top.id}', '${top.type}', '${escapeHtml(top.fileName)}'); event.stopPropagation();">▶</div>
              </div>
            `;
            
            const listItems = (window.currentSearchFilter === 'all' || window.currentSearchFilter === '') ? results.slice(1) : results;
            songsList.innerHTML = listItems.map(t => `
              <div class="song-row" style="grid-template-columns: 50px minmax(0, 1fr) 100px 50px; border: none; background: transparent; padding: 8px 16px; border-radius: 4px; cursor: pointer; align-items:center;" onclick="viewSearchResult('${t.id}', '${t.type}', '${escapeHtml(t.fileName)}')">
                <img src="${t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.creator)}&background=random&color=fff`}" width="40" height="40" style="border-radius: ${t.type === 'Artist' ? '50%' : '4px'}; object-fit: cover;">
                <div style="margin-left: 12px;">
                  <div style="font-weight: 500; color: #fff; font-size: 16px;">${escapeHtml(t.title)}</div>
                  <div style="font-size: 14px; color: var(--muted); margin-top: 4px;">${escapeHtml(t.type)} • ${escapeHtml(t.creator)}</div>
                </div>
                <div style="color: #fff; font-size: 12px; font-weight:bold; background: #333; padding: 4px 8px; border-radius: 12px; text-align:center;">
                    ${escapeHtml(t.type)}
                </div>
                <div style="text-align:right; position: relative;" onmouseleave="this.querySelector('.search-hover-menu').style.display='none'">
                  ${t.type === 'Song' ? 
                    `<button class="action-icon-btn" onclick="saveSearchResult('${t.id}', '${t.type}', '${escapeHtml(t.fileName)}'); event.stopPropagation();" onmouseenter="this.nextElementSibling.style.display='block'" style="color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 4px;">
                        <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z"></path></svg>
                    </button>
                    <div class="search-hover-menu" style="display:none; position:absolute; right:100%; top:0; background:#282828; padding:8px; border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:100; width:150px; text-align:left;">
                        <div style="padding:4px 8px; font-size:12px; color:#fff; cursor:pointer;" onclick="openAddSongToPlaylistModal('${escapeHtml(t.fileName)}'); event.stopPropagation(); this.parentElement.style.display='none';">Add to Playlist...</div>
                    </div>` :
                    `<button onclick="saveSearchResult('${t.id}', '${t.type}', '${escapeHtml(t.fileName)}'); event.stopPropagation();" style="border: 1px solid #fff; background:transparent; color:#fff; padding: 4px 12px; border-radius:16px; font-size:12px; font-weight:bold; cursor:pointer;">
                        Save
                    </button>`
                  }
                </div>
              </div>
            `).join('');
          } else {
            topResultCard.innerHTML = `<h2 style="color:#fff;">No results found for "${escapeHtml(query)}"</h2>`;
            songsList.innerHTML = '';
          }
      } catch (err) {
          console.error(err);
          topResultCard.innerHTML = '<h2 style="color:red;">Error fetching results</h2>';
          songsList.innerHTML = '';
      }
    }
  };

  window.viewSearchResult = function(id, type, fileName) {
      if (type === 'Song') {
          playSearchResult(id, type, fileName);
      } else if (type === 'Playlist') {
          window.openPlaylistById(id);
      } else if (type === 'Album') {
          window.openAlbumDetailView(id);
      } else if (type === 'Artist') {
          if (window.openArtistDetailView) window.openArtistDetailView(id);
      }
  };

  window.playSearchResult = async function(id, type, fileName) {
      if (type === 'Song') {
          const idx = tracks.findIndex(t => 
              (fileName && (t.fileName === fileName || t.title === fileName)) ||
              (id && (t.id === id || t.Id === id))
          );
          if(idx !== -1) {
              activeQueue = [...tracks];
              currentQueueTitle = 'Library';
              currentViewedPlaylist = null;
              buildQueueOrder();
              loadTrack(idx, true);
              renderQueue();
          } else {
              // Try to find it in the last search results
              let t = window.lastSearchResults ? window.lastSearchResults.find(x => x.id === id) : null;
              if (t) {
                  const songIdentifier = fileName || id || t.title;
                  const mockTrack = {
                      id: songIdentifier,
                      title: t.title || songIdentifier,
                      artist: t.creator || 'Unknown',
                      album: 'Single',
                      coverArt: t.imageUrl || '',
                      fileName: songIdentifier,
                      src: `/api/music/stream/${encodeURIComponent(songIdentifier)}`,
                      albumId: t.albumId || '',
                      artistId: t.artistId || '',
                      durationSeconds: 0
                  };
                  
                  // Inject track into the queue and play it
                  if (activeQueue) {
                      activeQueue.unshift(mockTrack);
                  } else {
                      activeQueue = [mockTrack];
                  }
                  currentQueueTitle = 'Search';
                  currentViewedPlaylist = null;
                  buildQueueOrder();
                  loadTrack(0, true);
                  renderQueue();
              } else {
                  showToast('info', 'Play', 'Song not found in local library scope.');
              }
          }
      } else if (type === 'Playlist') {
          try {
              const res = await authenticatedFetch(`/playlists/details/${encodeURIComponent(id)}`);
              if (res.ok) {
                  const data = await res.json();
                  if (data && data.songs && data.songs.length > 0) {
                      playPlaylistContext(data, 0);
                  } else {
                      showToast('info', 'Playlist', 'Playlist is empty.');
                  }
              } else {
                  showToast('error', 'Play', 'Could not load playlist to play.');
              }
          } catch(e) { }
      } else if (type === 'Album') {
          try {
              const res = await authenticatedFetch(`/album/details/${encodeURIComponent(id)}`);
              if (res.ok) {
                  const data = await res.json();
                  if (data && data.songs && data.songs.length > 0) {
                      playPlaylistContext(data, 0);
                  } else {
                      showToast('info', 'Album', 'Album is empty.');
                  }
              } else {
                  showToast('error', 'Play', 'Could not load album to play.');
              }
          } catch(e) { }
      } else {
          showToast('info', 'Play', 'Playing ' + type + ' is not implemented yet.');
      }
  };

  window.saveSearchResult = async function(id, type, fileName) {
      if (!authToken) {
          showToast('info', 'Not Signed In', 'Please sign in to save items.');
          setAuthPanelOpen(true, 'login');
          return;
      }
      try {
          if (type === 'Song') {
              const res = await authenticatedFetch('/playlists/my/liked/toggle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fileName: fileName, songFileName: fileName, songId: id })
              });
              if(res.ok) {
                  showToast('success', 'Saved', 'Added to Liked Songs');
                  await loadUserPlaylists();
              }
          } else if (type === 'Playlist') {
              const res = await authenticatedFetch(`/playlists/save/${encodeURIComponent(id)}`, { method: 'POST' });
              if (res.ok) {
                  showToast('success', 'Saved', 'Playlist saved to library');
                  await loadUserPlaylists();
              } else {
                  showToast('error', 'Error', 'Failed to save playlist');
              }
          } else if (type === 'Album') {
              const res = await authenticatedFetch(`/music/albums/save/${encodeURIComponent(id)}`, { method: 'POST' });
              if (res.ok) {
                  showToast('success', 'Saved', 'Album saved to library');
                  // reload library or update UI if needed
              } else {
                  showToast('error', 'Error', 'Failed to save album');
              }
          }
      } catch (err) {
          console.error(err);
      }
  };

  // ==========================================
  // SPOTIFY REDESIGN JAVASCRIPT WIRING
  // ==========================================
  
  const rightSidePanel = document.getElementById('rightSidePanel');
  const rightPanelNowPlayingView = document.getElementById('rightPanelNowPlayingView');
  const rightPanelQueueView = document.getElementById('rightPanelQueueView');
  const rightPanelContextTitle = document.getElementById('rightPanelContextTitle');
  let currentRightPanelMode = 'none'; // 'queue', 'nowplaying'

  function closeRightPanel() {
    if(rightSidePanel) {
      rightSidePanel.hidden = true;
      appShell.classList.remove('right-panel-active');
      currentRightPanelMode = 'none';
      document.querySelectorAll('.player-bar .right-icon-btn').forEach(btn => btn.classList.remove('active'));
    }
  }

  function toggleQueuePanel() {
    if(!rightSidePanel) return;
    
    // Ensure panel is open
    rightSidePanel.hidden = false;
    appShell.classList.add('right-panel-active');
    
    if (currentRightPanelMode === 'queue') {
        // Switch back to Now Playing
        rightPanelNowPlayingView.hidden = false;
        rightPanelQueueView.hidden = true;
        rightPanelContextTitle.textContent = 'Now Playing';
        currentRightPanelMode = 'nowplaying';
        document.querySelectorAll('.player-bar .right-icon-btn').forEach(btn => btn.classList.remove('active'));
    } else {
        // Switch to Queue
        rightPanelNowPlayingView.hidden = true;
        rightPanelQueueView.hidden = false;
        rightPanelContextTitle.textContent = 'Queue';
        currentRightPanelMode = 'queue';
    }
  }

  function toggleLyricsView() {
    if (document.getElementById('lyrics-view').classList.contains('active')) {
      showSection('home');
    } else {
      showSection('lyrics-view');
      renderLyrics();
    }
  }
  
  let parsedLyricsLines = []; // [{time: seconds, text: string, el: HTMLElement}]

  function parseLrc(lrcText) {
    if (!lrcText) return [];
    const lines = lrcText.split('\n');
    const result = [];
    const timeReg = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]/g;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const matches = [...line.matchAll(timeReg)];
      if (matches.length > 0) {
        const text = line.replace(timeReg, '').trim();
        for (const m of matches) {
          const minutes = parseInt(m[1], 10);
          const seconds = parseFloat(m[2]);
          const totalSeconds = minutes * 60 + seconds;
          result.push({ time: totalSeconds, text: text || '♪' });
        }
      } else if (!line.startsWith('[')) {
        // Plain text line without timestamp
        result.push({ time: null, text: line });
      }
    }
    // Sort timestamped lines
    return result.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  }

  async function renderLyrics() {
    const list = getCurrentQueue();
    const activeTrack = list[currentTrackIndex];
    if(!activeTrack) return;
    const lyricsContainer = document.getElementById('lyricsTextContainer');
    if(!lyricsContainer) return;

    lyricsContainer.innerHTML = '<div class="lyric-line active" style="font-size:24px; opacity:0.6;">Loading lyrics...</div>';
    parsedLyricsLines = [];

    let lyrics = activeTrack.lyrics || '';

    // If lyrics missing on track object, fetch dynamically from server
    if (!lyrics && activeTrack.id) {
      try {
        const res = await fetch(`/api/music/lyrics/${encodeURIComponent(activeTrack.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.lyrics) {
            lyrics = data.lyrics;
            activeTrack.lyrics = lyrics;
          }
        }
      } catch(e) {
        console.warn('Could not load lyrics from endpoint', e);
      }
    }

    lyricsContainer.innerHTML = '';

    if (!lyrics || !lyrics.trim()) {
      const emptyLine = document.createElement('div');
      emptyLine.className = 'lyric-line active';
      emptyLine.textContent = `♪ Looks like we don't have lyrics for this song yet ♪`;
      lyricsContainer.appendChild(emptyLine);
      return;
    }

    const parsed = parseLrc(lyrics);
    const hasTimestamps = parsed.some(p => p.time !== null);
    const isPrem = !!(currentUser && (currentUser.isPremium || currentUser.premium || currentUser.subscriptionTier === 'Premium'));

    parsed.forEach((item, idx) => {
      const lineDiv = document.createElement('div');
      const isBlurred = !isPrem && idx >= 4;
      lineDiv.className = 'lyric-line' + (!hasTimestamps ? ' active' : (idx === 0 ? ' active' : '')) + (isBlurred ? ' blurred' : '');
      lineDiv.textContent = item.text;
      if (!isBlurred && item.time !== null) {
        lineDiv.style.cursor = 'pointer';
        lineDiv.onclick = () => {
          if (audioPlayer) {
            audioPlayer.currentTime = Math.max(0, item.time - 0.2);
            if (audioPlayer.paused) audioPlayer.play();
          }
        };
      }
      lyricsContainer.appendChild(lineDiv);
      parsedLyricsLines.push({
        time: item.time,
        text: item.text,
        el: lineDiv
      });
    });

    if (!isPrem && parsed.length > 4) {
      const lockCta = document.createElement('div');
      lockCta.className = 'lyrics-lock-cta';
      lockCta.innerHTML = `
        <div class="lyrics-lock-icon">🔒</div>
        <div class="lyrics-lock-title">Unlock full lyrics with Premium</div>
        <div class="lyrics-lock-subtitle">Free tier displays a 4-line preview. Upgrade to Premium for full real-time synchronized lyrics.</div>
        <button type="button" class="lyrics-lock-btn" onclick="openCheckoutModal('Individual')">Unlock Full Lyrics ($4.99/mo)</button>
      `;
      lyricsContainer.appendChild(lockCta);
    }

    const canvas = document.getElementById('lyricsCanvas');
    if (canvas && !canvas.dataset.scrollBound) {
      canvas.dataset.scrollBound = 'true';
      const onUserScroll = () => {
        isUserScrollingLyrics = true;
        if (userLyricsScrollTimeout) clearTimeout(userLyricsScrollTimeout);
        userLyricsScrollTimeout = setTimeout(() => {
          isUserScrollingLyrics = false;
        }, 3500);
      };
      canvas.addEventListener('wheel', onUserScroll, { passive: true });
      canvas.addEventListener('touchmove', onUserScroll, { passive: true });
      canvas.addEventListener('pointerdown', onUserScroll, { passive: true });
    }
  }

  let isUserScrollingLyrics = false;
  let userLyricsScrollTimeout = null;

  function syncLyricsTime(currentTime) {
    const lyricsSection = document.getElementById('lyrics-view');
    if (!lyricsSection || lyricsSection.hidden || !parsedLyricsLines.length) return;
    if (lyricsSection.style.display === 'none') return;

    let activeIndex = -1;
    for (let i = 0; i < parsedLyricsLines.length; i++) {
      if (parsedLyricsLines[i].time !== null && parsedLyricsLines[i].time <= currentTime + 0.3) {
        activeIndex = i;
      } else if (parsedLyricsLines[i].time !== null && parsedLyricsLines[i].time > currentTime + 0.3) {
        break;
      }
    }

    if (activeIndex !== -1) {
      parsedLyricsLines.forEach((item, idx) => {
        if (idx === activeIndex) {
          if (!item.el.classList.contains('active')) {
            item.el.classList.add('active');
            if (!isUserScrollingLyrics) {
              const canvas = document.getElementById('lyricsCanvas');
              if (canvas && item.el) {
                const targetScrollTop = item.el.offsetTop - (canvas.clientHeight / 2) + (item.el.clientHeight / 2);
                canvas.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
              }
            }
          }
        } else {
          item.el.classList.remove('active');
        }
      });
    }
  }

  async function playQuickCardContainer(item) {
    if (!item) return;

    if (item.type === 'Album') {
      const albTracks = (tracks || []).filter(t => 
        (t.album && t.album.toLowerCase() === item.title.toLowerCase()) ||
        (item.albumId && (t.albumId == item.albumId || t.albumId === item.albumId))
      );
      if (albTracks.length > 0) {
        playPlaylistContext({
          id: item.albumId || 'album-' + item.title,
          name: item.title,
          type: 'Album',
          songs: albTracks
        }, 0);
        return;
      }
      if (item.albumId) {
        try {
          const res = await authenticatedFetch(`/album/details/${encodeURIComponent(item.albumId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.songs && data.songs.length > 0) {
              playPlaylistContext(data, 0);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load album context', e);
        }
      }
      showToast('info', 'Album', `No playable songs found for "${item.title}".`);
    } else if (item.type === 'Artist') {
      const artTracks = (tracks || []).filter(t =>
        (t.artist && t.artist.toLowerCase() === item.title.toLowerCase()) ||
        (item.artistId && (t.artistId == item.artistId || t.artistId === item.artistId))
      );
      if (artTracks.length > 0) {
        playPlaylistContext({
          id: item.artistId || 'artist-' + item.title,
          name: item.title,
          type: 'Artist',
          songs: artTracks
        }, 0);
        return;
      }
      if (item.artistId) {
        try {
          const res = await fetch(`/artist/details/${encodeURIComponent(item.artistId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.popularSongs && data.popularSongs.length > 0) {
              playPlaylistContext({
                id: item.artistId,
                name: data.name || item.title,
                type: 'Artist',
                songs: data.popularSongs
              }, 0);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load artist songs', e);
        }
      }
      showToast('info', 'Artist', `No playable songs found for "${item.title}".`);
    } else if (item.type === 'Playlist') {
      const pl = (userPlaylists || []).find(p =>
        (item.playlistId && p.id === item.playlistId) ||
        (p.name && p.name.toLowerCase() === item.title.toLowerCase())
      );
      if (pl && pl.songs && pl.songs.length > 0) {
        playPlaylistContext(pl, 0);
        return;
      }
      if (item.playlistId) {
        try {
          const res = await authenticatedFetch(`/playlists/details/${encodeURIComponent(item.playlistId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.songs && data.songs.length > 0) {
              playPlaylistContext(data, 0);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load playlist', e);
        }
      }
      showToast('info', 'Playlist', `Playlist "${item.title}" is empty.`);
    }
  }

  async function openQuickCardDetail(item) {
    if (!item) return;

    if (item.type === 'Album') {
      if (item.albumId && typeof window.openAlbumDetailView === 'function') {
        window.openAlbumDetailView(item.albumId);
      } else {
        const albTracks = (tracks || []).filter(t => 
          (t.album && t.album.toLowerCase() === item.title.toLowerCase()) ||
          (item.albumId && (t.albumId == item.albumId || t.albumId === item.albumId))
        );
        if (albTracks.length > 0) {
          openPlaylistDetailView({
            id: item.albumId || 'album-' + item.title,
            name: item.title,
            type: 'Album',
            songs: albTracks
          });
        } else {
          playQuickCardContainer(item);
        }
      }
    } else if (item.type === 'Artist') {
      let artistId = item.artistId;
      if (!artistId && tracks) {
        const found = tracks.find(t => (t.artist || '').toLowerCase() === item.title.toLowerCase());
        if (found) artistId = found.artistId;
      }
      if (artistId && typeof window.openArtistDetailView === 'function') {
        window.openArtistDetailView(artistId);
      } else {
        playQuickCardContainer(item);
      }
    } else if (item.type === 'Playlist') {
      const pl = (userPlaylists || []).find(p =>
        (item.playlistId && p.id === item.playlistId) ||
        (p.name && p.name.toLowerCase() === item.title.toLowerCase())
      );
      if (pl) {
        openPlaylistDetailView(pl);
      } else if (item.playlistId && typeof window.openPlaylistById === 'function') {
        window.openPlaylistById(item.playlistId);
      } else {
        showSection('playlists');
      }
    }
  }

  function getCatalogBackfillCandidates() {
    const candidates = [];
    const seen = new Set();

    function addCandidate(c) {
      const key = `${c.type}:${c.title.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push(c);
      }
    }

    // 1. Prominent albums in loaded tracks
    const albumCountMap = new Map();
    (tracks || []).forEach(t => {
      const alb = (t.album || '').trim();
      if (!alb || alb.toLowerCase() === 'single' || alb.toLowerCase() === 'unknown album') return;
      const lower = alb.toLowerCase();
      if (!albumCountMap.has(lower)) {
        albumCountMap.set(lower, {
          type: 'Album',
          title: alb,
          artist: t.artist || '',
          subtitle: `${t.artist || 'Album'} • Album`,
          albumId: t.albumId || null,
          id: t.albumId || alb,
          coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/songs/${t.id}/cover` : ''),
          count: 1
        });
      } else {
        albumCountMap.get(lower).count++;
      }
    });
    Array.from(albumCountMap.values())
      .sort((a, b) => b.count - a.count)
      .forEach(addCandidate);

    // 2. Prominent artists in loaded tracks
    const artistCountMap = new Map();
    (tracks || []).forEach(t => {
      const art = (t.artist || '').trim();
      if (!art || art.toLowerCase() === 'unknown artist' || art.toLowerCase() === 'various artists') return;
      const lower = art.toLowerCase();
      if (!artistCountMap.has(lower)) {
        artistCountMap.set(lower, {
          type: 'Artist',
          title: art,
          artist: art,
          subtitle: 'Artist',
          artistId: t.artistId || null,
          id: t.artistId || art,
          coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/songs/${t.id}/cover` : ''),
          count: 1
        });
      } else {
        artistCountMap.get(lower).count++;
      }
    });
    Array.from(artistCountMap.values())
      .sort((a, b) => b.count - a.count)
      .forEach(addCandidate);

    // 3. Fallback prominent catalog items from specification
    const defaultCatalog = [
      { type: 'Album', title: 'Gieo', artist: 'Ngọt', subtitle: 'Ngọt • Album' },
      { type: 'Album', title: 'In The Lonely Hour', artist: 'Sam Smith', subtitle: 'Sam Smith • Album' },
      { type: 'Album', title: '3 (tuyển tập nhạc Ngọt...)', artist: 'Ngọt', subtitle: 'Ngọt • Album' },
      { type: 'Album', title: 'The Thrill Of It All', artist: 'Sam Smith', subtitle: 'Sam Smith • Album' },
      { type: 'Artist', title: 'Ngọt', artist: 'Ngọt', subtitle: 'Artist' },
      { type: 'Artist', title: 'Sam Smith', artist: 'Sam Smith', subtitle: 'Artist' },
      { type: 'Playlist', title: 'Discover Weekly', subtitle: 'Playlist' },
      { type: 'Playlist', title: 'Daily Mix 1', subtitle: 'Playlist' }
    ];

    defaultCatalog.forEach(item => {
      if (tracks && tracks.length) {
        if (item.type === 'Album') {
          const match = tracks.find(t => (t.album || '').toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes((t.album || '').toLowerCase()));
          if (match) {
            item.coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/songs/${match.id}/cover` : '');
            if (match.albumId) item.albumId = match.albumId;
            if (match.artist) item.artist = match.artist;
          }
        } else if (item.type === 'Artist') {
          const match = tracks.find(t => (t.artist || '').toLowerCase() === item.title.toLowerCase());
          if (match) {
            item.coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/songs/${match.id}/cover` : '');
            if (match.artistId) item.artistId = match.artistId;
          }
        }
      }
      addCandidate(item);
    });

    return candidates;
  }

  function populateHomeGrid() {
    const grid = document.getElementById('homeQuickGrid');
    if (!grid) return;

    // Tile 1: Liked Songs
    const likedPlaylist = (userPlaylists || []).find(p => (p.name || '').toLowerCase() === 'liked songs');
    const likedCount = likedPlaylist && likedPlaylist.songs ? likedPlaylist.songs.length : 0;
    const likedSubtitle = likedCount > 0 ? `${likedCount} liked song${likedCount === 1 ? '' : 's'}` : 'Playlist';

    // Remaining tiles (up to 7 items): Prioritize Containers (Albums, Playlists, Artists)
    const recentItems = [];
    const seenKeys = new Set();
    seenKeys.add('playlist:liked songs');

    // 1. Containers from history (Albums, Playlists, Artists)
    const historyContainers = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getRecentContainers(7) : [];
    for (const c of historyContainers) {
      if (recentItems.length >= 7) break;
      const key = `${(c.type || 'container').toLowerCase()}:${(c.title || '').toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        recentItems.push(c);
      }
    }

    // 2. Also check explicit recentItems recorded via recordContainerPlay
    if (recentItems.length < 7 && typeof SpotifakeHistory !== 'undefined') {
      const explicitRecent = SpotifakeHistory.getRecentItems(15);
      for (const item of explicitRecent) {
        if (recentItems.length >= 7) break;
        if (item.type === 'Album' || item.type === 'Playlist' || item.type === 'Artist') {
          const key = `${item.type.toLowerCase()}:${(item.title || '').toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            recentItems.push(item);
          }
        }
      }
    }

    // 3. Backfill with user playlists (excluding Liked Songs)
    if (recentItems.length < 7 && userPlaylists && userPlaylists.length) {
      for (const pl of userPlaylists) {
        if (recentItems.length >= 7) break;
        if ((pl.name || '').toLowerCase() === 'liked songs') continue;
        const key = `playlist:${(pl.name || '').toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          let cover = pl.imageUrl || '';
          if (!cover && pl.songs && pl.songs[0]) {
            cover = pl.songs[0].coverUrl || (pl.songs[0].id ? `${API_BASE_URL}/songs/${pl.songs[0].id}/cover` : '');
          }
          recentItems.push({
            type: 'Playlist',
            id: pl.id,
            playlistId: pl.id,
            title: pl.name,
            subtitle: `${pl.songs ? pl.songs.length : 0} songs • Playlist`,
            coverUrl: cover
          });
        }
      }
    }

    // 4. Backfill with library Albums
    if (recentItems.length < 7 && tracks && tracks.length) {
      for (const t of tracks) {
        if (recentItems.length >= 7) break;
        if (!t.album || t.album.toLowerCase() === 'single' || t.album.toLowerCase() === 'unknown album') continue;
        const key = `album:${t.album.toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          recentItems.push({
            type: 'Album',
            id: t.albumId || ('album-' + t.album),
            albumId: t.albumId,
            title: t.album,
            artist: t.artist,
            subtitle: `${t.artist || 'Album'} • Album`,
            coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/songs/${t.id}/cover` : '')
          });
        }
      }
    }

    // 5. Backfill with standalone songs only if still fewer than 7
    if (recentItems.length < 7 && tracks && tracks.length) {
      for (const t of tracks) {
        if (recentItems.length >= 7) break;
        const key = `song:${(t.title || '').toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          recentItems.push({
            type: 'Song',
            id: t.id,
            title: t.title,
            artist: t.artist,
            subtitle: t.artist,
            coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/songs/${t.id}/cover` : ''),
            fileName: t.fileName || t.id
          });
        }
      }
    }

    grid.innerHTML = '';

    // Render Tile 1: Liked Songs
    const likedCard = document.createElement('div');
    likedCard.className = 'quick-card quick-card-liked';
    likedCard.title = 'Liked Songs';
    likedCard.innerHTML = `
      <div style="width: 64px; height: 64px; min-width: 64px; background: linear-gradient(135deg, #450af5, #8e8ee5); display: flex; align-items: center; justify-content: center; border-radius: 4px 0 0 4px; box-shadow: inset 0 0 12px rgba(0,0,0,0.15); flex-shrink: 0;">
        <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <div style="flex: 1; min-width: 0; padding: 0 12px; display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
        <div class="quick-card-title" style="padding: 0; margin: 0; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">Liked Songs</div>
        <div style="font-size: 11px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${likedSubtitle}</div>
      </div>
      <div class="quick-card-play" style="flex-shrink: 0; cursor: pointer;" title="Play Liked Songs">▶</div>
    `;

    likedCard.addEventListener('click', (e) => {
      if (e.target.closest('.quick-card-play')) return;
      if (typeof window.openLikedSongsPlaylist === 'function') {
        window.openLikedSongsPlaylist();
      } else if (likedPlaylist) {
        openPlaylistDetailView(likedPlaylist);
      } else {
        showSection('playlists');
      }
    });

    const likedPlayBtn = likedCard.querySelector('.quick-card-play');
    if (likedPlayBtn) {
      likedPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (likedPlaylist && likedPlaylist.songs && likedPlaylist.songs.length > 0) {
          playPlaylistContext(likedPlaylist, 0);
        } else {
          showToast('info', 'Liked Songs', 'Your Liked Songs playlist is empty. Like some songs first!');
        }
      });
    }

    grid.appendChild(likedCard);

    // Render Remaining Tiles (Albums, Playlists, and Songs)
    recentItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'quick-card';
      card.title = `${item.title || 'Item'} - ${item.subtitle || ''}`;

      const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Music')}&background=282828&color=1db954&size=128`;
      const coverSrc = item.coverUrl || fallbackAvatar;

      const imgEl = document.createElement('img');
      imgEl.src = coverSrc;
      imgEl.alt = item.title || '';
      imgEl.style.cssText = 'width: 64px; height: 64px; min-width: 64px; object-fit: cover; border-radius: 4px 0 0 4px; flex-shrink: 0;';
      imgEl.onerror = function() {
        this.onerror = null;
        this.src = fallbackAvatar;
      };

      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'flex: 1; min-width: 0; padding: 0 12px; display: flex; flex-direction: column; justify-content: center; overflow: hidden;';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'quick-card-title';
      titleDiv.style.cssText = 'padding: 0; margin: 0; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;';
      titleDiv.textContent = item.title || 'Untitled';

      const subDiv = document.createElement('div');
      subDiv.style.cssText = 'font-size: 11px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;';
      subDiv.textContent = item.subtitle || item.artist || item.type || '';

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(subDiv);

      const playDiv = document.createElement('div');
      playDiv.className = 'quick-card-play';
      playDiv.style.cssText = 'flex-shrink: 0; cursor: pointer;';
      playDiv.title = `Play ${item.title || ''}`;
      playDiv.textContent = '▶';

      card.appendChild(imgEl);
      card.appendChild(infoDiv);
      card.appendChild(playDiv);

      const playAction = () => {
        if (item.type === 'Album' || item.type === 'Playlist') {
          playQuickCardContainer(item);
        } else {
          // Song
          const idx = (tracks || []).findIndex(t => 
            (item.id && (t.id === item.id || t.fileName === item.id)) ||
            (item.fileName && t.fileName === item.fileName) ||
            (t.title && item.title && t.title.toLowerCase() === item.title.toLowerCase())
          );
          if (idx !== -1) {
            activeQueue = [...tracks];
            currentQueueTitle = 'Library';
            currentViewedPlaylist = null;
            buildQueueOrder();
            loadTrack(idx, true);
            renderQueue();
          } else if (typeof window.playSearchResult === 'function') {
            window.playSearchResult(item.id || item.fileName, 'Song', item.fileName || item.title);
          }
        }
      };

      card.addEventListener('click', (e) => {
        if (e.target.closest('.quick-card-play')) return;
        if (item.type === 'Album') {
          if (item.albumId && typeof window.openAlbumDetailView === 'function') {
            window.openAlbumDetailView(item.albumId);
          } else {
            playAction();
          }
        } else if (item.type === 'Playlist') {
          if (item.id && typeof window.openPlaylistById === 'function') {
            window.openPlaylistById(item.id);
          } else {
            playAction();
          }
        } else {
          playAction();
        }
      });

      playDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        playAction();
      });

      grid.appendChild(card);
    });
  }

  window.populateHomeGrid = populateHomeGrid;

  // React to playback events by refreshing the quick grid and all home carousels
  window.addEventListener('spotifake:playRecorded', () => {
    if (typeof initAllHomeSections === 'function') {
      initAllHomeSections();
    }
  });

  // SVG Gradient Generators for Spotify-style mix covers
  function createMixCoverSvg(title, subtitle, color1, color2) {
    const safeTitle = (title || 'MIX').toUpperCase().replace(/[<>&"]/g, '');
    const safeSub = (subtitle || 'SPOTIFAKE').toUpperCase().replace(/[<>&"]/g, '');
    const c1 = encodeURIComponent(color1 || '#1db954');
    const c2 = encodeURIComponent(color2 || '#191414');
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="300" height="300" fill="url(%23g)"/><circle cx="260" cy="40" r="80" fill="rgba(255,255,255,0.08)"/><circle cx="40" cy="260" r="60" fill="rgba(0,0,0,0.15)"/><rect x="24" y="24" width="36" height="6" rx="3" fill="rgba(255,255,255,0.7)"/><text x="24" y="200" fill="%23ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="900" font-size="28" letter-spacing="-0.5">${safeTitle}</text><text x="24" y="226" fill="rgba(255,255,255,0.85)" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="600" font-size="12" letter-spacing="1.5">${safeSub}</text></svg>`;
  }

  let currentMadeForYouMixes = [];

  function generateMadeForYouMixes() {
    const catalog = Array.isArray(tracks) && tracks.length > 0 ? tracks : [];
    const history = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getHistory() : [];
    const topArtists = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getTopArtists(10) : [];
    const topGenres = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getTopGenres(10) : [];

    // Helper: deduplicate tracks by ID/fileName/title
    const dedupe = (list) => {
      const seen = new Set();
      const out = [];
      (list || []).forEach(t => {
        if (!t) return;
        const key = (t.id || t.fileName || t.title || '').trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(t);
        }
      });
      return out;
    };

    // Helper: check if track matches an artist (case-insensitive substring)
    const matchesArtist = (track, artistName) => {
      if (!track || !artistName) return false;
      const a = (track.artist || '').toLowerCase();
      const target = artistName.toLowerCase().trim();
      return a === target || a.includes(target) || target.includes(a);
    };

    // Helper: extract distinct artists for mix description
    const describeArtists = (mixSongs, primaryArtist, defaultDesc) => {
      const set = new Set();
      if (primaryArtist && primaryArtist !== 'Unknown Artist') set.add(primaryArtist);
      (mixSongs || []).forEach(s => {
        if (s && s.artist && s.artist !== 'Unknown Artist') {
          const parts = s.artist.split(/[\/,]/).map(p => p.trim());
          parts.forEach(p => { if (p && p !== 'Unknown Artist' && set.size < 4) set.add(p); });
        }
      });
      const list = Array.from(set);
      if (list.length === 0) return defaultDesc || 'Music curated for you';
      if (list.length === 1) return `${list[0]} and more`;
      if (list.length === 2) return `${list[0]}, ${list[1]} and more`;
      return `${list[0]}, ${list[1]}, ${list[2]} and more`;
    };

    // Helper: get cover art with fallback
    const resolveMixCover = (mixSongs, fallbackSvg) => {
      if (mixSongs && mixSongs.length > 0) {
        const first = mixSongs[0];
        if (first.coverUrl && typeof first.coverUrl === 'string' && first.coverUrl.trim().length > 0 && !first.coverUrl.includes('ui-avatars.com')) {
          return first.coverUrl;
        }
        if (first.id) {
          return `${API_BASE_URL}/songs/${first.id}/cover`;
        }
      }
      return fallbackSvg;
    };

    // Find catalog artist frequency
    const catalogArtistCounts = {};
    catalog.forEach(t => {
      if (t.artist && t.artist !== 'Unknown Artist') {
        const base = t.artist.split(/[\/,]/)[0].trim();
        catalogArtistCounts[base] = (catalogArtistCounts[base] || 0) + 1;
      }
    });
    const sortedCatalogArtists = Object.keys(catalogArtistCounts).sort((a, b) => catalogArtistCounts[b] - catalogArtistCounts[a]);

    // === 1. Daily Mix 1: Top Artist Mix ===
    let artist1 = (topArtists.length > 0 && topArtists[0].artist && topArtists[0].artist !== 'Unknown Artist')
      ? topArtists[0].artist
      : (sortedCatalogArtists[0] || 'Ngọt');

    let mix1Songs = catalog.filter(t => matchesArtist(t, artist1));
    if (mix1Songs.length < 8) {
      const artist1Genres = new Set(mix1Songs.map(t => (t.genre || '').toLowerCase()).filter(Boolean));
      const compatible = catalog.filter(t => !matchesArtist(t, artist1) && (
        artist1Genres.has((t.genre || '').toLowerCase()) ||
        /rock|indie|alternative/i.test(t.genre || '') ||
        /ngọt/i.test(t.artist || '')
      ));
      mix1Songs = dedupe([...mix1Songs, ...compatible]);
    }
    if (mix1Songs.length < 5) {
      mix1Songs = dedupe([...mix1Songs, ...catalog.slice(0, 10)]);
    }
    const mix1FallbackSvg = createMixCoverSvg('DAILY MIX 1', artist1, '#00b4db', '#0083b0');
    const mix1Cover = resolveMixCover(mix1Songs, mix1FallbackSvg);

    const mix1 = {
      id: 'mix-daily-1',
      name: 'Daily Mix 1',
      title: 'Daily Mix 1',
      desc: describeArtists(mix1Songs, artist1, 'Indie rock and favorites'),
      description: describeArtists(mix1Songs, artist1, 'Indie rock and favorites'),
      type: 'Playlist',
      isMix: true,
      coverUrl: mix1Cover,
      imageUrl: mix1Cover,
      fallbackSvg: mix1FallbackSvg,
      songs: mix1Songs
    };

    // === 2. Daily Mix 2: Second Artist Mix ===
    let artist2 = null;
    for (const ta of topArtists) {
      if (ta.artist && ta.artist !== 'Unknown Artist' && !matchesArtist({ artist: ta.artist }, artist1)) {
        artist2 = ta.artist;
        break;
      }
    }
    if (!artist2) {
      artist2 = sortedCatalogArtists.find(a => !matchesArtist({ artist: a }, artist1)) || 'Sam Smith';
    }

    let mix2Songs = catalog.filter(t => matchesArtist(t, artist2));
    const mix2Collabs = catalog.filter(t => {
      const a = (t.artist || '').toLowerCase();
      return (a.includes('sam smith') || a.includes('disclosure') || a.includes('calvin harris') || a.includes('normani') || a.includes('kim petras') || a.includes('naughty boy')) && !mix2Songs.some(m => m.id === t.id);
    });
    mix2Songs = dedupe([...mix2Songs, ...mix2Collabs]);
    if (mix2Songs.length < 8) {
      const artist2Genres = new Set(mix2Songs.map(t => (t.genre || '').toLowerCase()).filter(Boolean));
      const compatible = catalog.filter(t => (
        artist2Genres.has((t.genre || '').toLowerCase()) ||
        /pop|soul|r&b|dance/i.test(t.genre || '')
      ));
      mix2Songs = dedupe([...mix2Songs, ...compatible]);
    }
    if (mix2Songs.length < 5) {
      mix2Songs = dedupe([...mix2Songs, ...catalog.slice(10, 20)]);
    }
    const mix2FallbackSvg = createMixCoverSvg('DAILY MIX 2', artist2, '#ec008c', '#fc6767');
    const mix2Cover = resolveMixCover(mix2Songs, mix2FallbackSvg);

    const mix2 = {
      id: 'mix-daily-2',
      name: 'Daily Mix 2',
      title: 'Daily Mix 2',
      desc: describeArtists(mix2Songs, artist2, 'Pop hits and soulful favorites'),
      description: describeArtists(mix2Songs, artist2, 'Pop hits and soulful favorites'),
      type: 'Playlist',
      isMix: true,
      coverUrl: mix2Cover,
      imageUrl: mix2Cover,
      fallbackSvg: mix2FallbackSvg,
      songs: mix2Songs
    };

    // === 3. Daily Mix 3 (Energy / Upbeat) ===
    let mix3Songs = catalog.filter(t => {
      const titleLower = (t.title || '').toLowerCase();
      if (titleLower.includes('acoustic') || titleLower.includes('hoa nở không màu')) return false;

      const hasHighEnergy = (typeof t.energy === 'number' && t.energy >= 0.45);
      const hasHighDance = (typeof t.danceability === 'number' && t.danceability >= 0.5);
      const hasDanceGenre = /dance|pop|edm|electronic|house|phonk|club|disco/i.test(t.genre || '');
      const hasUpbeatArtist = /martin garrix|disclosure|calvin harris|rusino/i.test(t.artist || '');
      const hasUpbeatTitle = /burn out|unholy|desire|latch|diamonds|how do you sleep|dancing with a stranger|looping the rooms|test song/i.test(titleLower);
      return hasHighEnergy || hasHighDance || hasDanceGenre || hasUpbeatArtist || hasUpbeatTitle;
    });
    mix3Songs.sort((a, b) => ((b.energy || 0) + (b.danceability || 0)) - ((a.energy || 0) + (a.danceability || 0)));
    mix3Songs = dedupe(mix3Songs);
    if (mix3Songs.length < 5) {
      mix3Songs = dedupe([...mix3Songs, ...catalog.filter(t => !/acoustic|ballad/i.test(t.genre || '')).slice(0, 10)]);
    }
    const mix3FallbackSvg = createMixCoverSvg('DAILY MIX 3', 'ENERGY', '#f12711', '#f5af19');
    const mix3Cover = resolveMixCover(mix3Songs, mix3FallbackSvg);

    const mix3 = {
      id: 'mix-daily-3',
      name: 'Daily Mix 3',
      title: 'Daily Mix 3',
      desc: 'Upbeat energy hits to keep you going',
      description: 'Upbeat energy hits to keep you going',
      type: 'Playlist',
      isMix: true,
      coverUrl: mix3Cover,
      imageUrl: mix3Cover,
      fallbackSvg: mix3FallbackSvg,
      songs: mix3Songs
    };

    // === 4. Daily Mix 4 (Chill / Acoustic) ===
    let mix4Songs = catalog.filter(t => {
      const titleLower = (t.title || '').toLowerCase();
      if (/burn out|looping the rooms/i.test(titleLower)) return false;

      const hasHighAcoustic = (typeof t.acousticness === 'number' && t.acousticness >= 0.35);
      const isChillAcoustic = (typeof t.energy === 'number' && t.energy > 0 && t.energy <= 0.45);
      const isChillGenre = /acoustic|chill|lofi|ballad|ambient|folk/i.test(t.genre || '');
      const isChillTitle = /stay with me|cho tôi đi theo|em dạo này|latch \(acoustic\)|lay me down|hoa nở không màu|constant companion|không làm gì|cho|single|cá lớn/i.test(titleLower);
      const isChillMood = /chill|calm|sad|relaxed|peaceful/i.test(t.mood || '');
      return hasHighAcoustic || isChillAcoustic || isChillGenre || isChillTitle || isChillMood;
    });
    mix4Songs = dedupe(mix4Songs);
    if (mix4Songs.length < 5) {
      const backfill = catalog.filter(t => /ngọt|hoài lâm/i.test(t.artist || '') || /ballad|acoustic/i.test(t.genre || ''));
      mix4Songs = dedupe([...mix4Songs, ...backfill]);
    }
    const mix4FallbackSvg = createMixCoverSvg('DAILY MIX 4', 'CHILL', '#134e5e', '#71b280');
    const mix4Cover = resolveMixCover(mix4Songs, mix4FallbackSvg);

    const mix4 = {
      id: 'mix-daily-4',
      name: 'Daily Mix 4',
      title: 'Daily Mix 4',
      desc: 'Relaxing acoustic and chill tunes',
      description: 'Relaxing acoustic and chill tunes',
      type: 'Playlist',
      isMix: true,
      coverUrl: mix4Cover,
      imageUrl: mix4Cover,
      fallbackSvg: mix4FallbackSvg,
      songs: mix4Songs
    };

    // === 5. Discover Weekly / On Repeat ===
    const songPlayCounts = {};
    history.forEach(h => {
      const key = (h.id || h.title || '').trim().toLowerCase();
      if (key) songPlayCounts[key] = (songPlayCounts[key] || 0) + 1;
    });
    const repeatedKeys = Object.keys(songPlayCounts).filter(k => songPlayCounts[k] >= 2);

    let mix5;
    if (repeatedKeys.length >= 3) {
      let onRepeatSongs = catalog.filter(t => {
        const keyId = (t.id || '').trim().toLowerCase();
        const keyTitle = (t.title || '').trim().toLowerCase();
        return (keyId && repeatedKeys.includes(keyId)) || (keyTitle && repeatedKeys.includes(keyTitle));
      });
      onRepeatSongs.sort((a, b) => {
        const countA = (songPlayCounts[(a.id || '').toLowerCase()] || 0) + (songPlayCounts[(a.title || '').toLowerCase()] || 0);
        const countB = (songPlayCounts[(b.id || '').toLowerCase()] || 0) + (songPlayCounts[(b.title || '').toLowerCase()] || 0);
        return countB - countA;
      });
      onRepeatSongs = dedupe(onRepeatSongs);
      const onRepeatSvg = createMixCoverSvg('ON REPEAT', 'FAVORITES', '#11998e', '#38ef7d');
      const onRepeatCover = resolveMixCover(onRepeatSongs, onRepeatSvg);

      mix5 = {
        id: 'mix-on-repeat',
        name: 'On Repeat',
        title: 'On Repeat',
        desc: describeArtists(onRepeatSongs, null, 'The songs you love most right now'),
        description: 'The songs you love most right now',
        type: 'Playlist',
        isMix: true,
        coverUrl: onRepeatCover,
        imageUrl: onRepeatCover,
        fallbackSvg: onRepeatSvg,
        songs: onRepeatSongs
      };
    } else {
      const listenedKeys = new Set(history.map(h => (h.id || h.title || '').trim().toLowerCase()).filter(Boolean));
      let unlistened = catalog.filter(t => {
        const keyId = (t.id || '').trim().toLowerCase();
        const keyTitle = (t.title || '').trim().toLowerCase();
        return !listenedKeys.has(keyId) && !listenedKeys.has(keyTitle);
      });

      const topGenreSet = new Set(topGenres.map(g => (g.genre || '').toLowerCase()).filter(Boolean));
      if (topGenreSet.size > 0 && unlistened.length > 5) {
        unlistened.sort((a, b) => {
          const matchA = topGenreSet.has((a.genre || '').toLowerCase()) ? 1 : 0;
          const matchB = topGenreSet.has((b.genre || '').toLowerCase()) ? 1 : 0;
          return matchB - matchA;
        });
      }

      let discoverSongs = unlistened.slice(0, 15);
      if (discoverSongs.length < 5) {
        discoverSongs = dedupe([...discoverSongs, ...catalog.slice(0, 15)]);
      }

      const discoverSvg = createMixCoverSvg('DISCOVER', 'WEEKLY', '#654ea3', '#eaafc8');
      const discoverCover = resolveMixCover(discoverSongs, discoverSvg);

      mix5 = {
        id: 'mix-discover-weekly',
        name: 'Discover Weekly',
        title: 'Discover Weekly',
        desc: describeArtists(discoverSongs, null, 'New music based on your listening'),
        description: 'New music based on your listening',
        type: 'Playlist',
        isMix: true,
        coverUrl: discoverCover,
        imageUrl: discoverCover,
        fallbackSvg: discoverSvg,
        songs: discoverSongs
      };
    }

    return [mix1, mix2, mix3, mix4, mix5];
  }

  function populateMadeForYou() {
    const carousel = document.getElementById('homeMadeForYouCarousel');
    if (!carousel) return;

    currentMadeForYouMixes = generateMadeForYouMixes();
    if (!currentMadeForYouMixes || !currentMadeForYouMixes.length) {
      carousel.innerHTML = '<div style="color: var(--muted); padding: 16px;">No recommendations available yet.</div>';
      return;
    }

    carousel.innerHTML = '';
    currentMadeForYouMixes.forEach(mix => {
      const card = document.createElement('div');
      card.className = 'mix-card';
      card.setAttribute('data-mix-id', mix.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.title = `${mix.title} - ${mix.desc}`;

      const coverSrc = mix.coverUrl || mix.imageUrl || mix.fallbackSvg;

      card.innerHTML = `
        <div class="mix-card-img-wrapper">
          <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(mix.title)}" onerror="this.onerror=null; this.src='${escapeHtml(mix.fallbackSvg || '')}';" loading="lazy">
          <button class="mix-card-play-btn" title="Play ${escapeHtml(mix.title)}" aria-label="Play ${escapeHtml(mix.title)}">
            <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
            </svg>
          </button>
        </div>
        <div class="mix-card-title">${escapeHtml(mix.title)}</div>
        <div class="mix-card-desc">${escapeHtml(mix.desc)}</div>
      `;

      // Play button starts playback immediately
      const playBtn = card.querySelector('.mix-card-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          playPlaylistContext(mix, 0);
        });
      }

      // Card body click opens playlist detail view
      card.addEventListener('click', (e) => {
        if (e.target.closest('.mix-card-play-btn')) return;
        openPlaylistDetailView(mix);
      });

      // Keyboard accessibility
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          openPlaylistDetailView(mix);
        }
      });

      carousel.appendChild(card);
    });
  }

  window.populateMadeForYou = populateMadeForYou;
  window.generateMadeForYouMixes = generateMadeForYouMixes;

  function updateHomeGreeting() {
    const el = document.getElementById('homeGreeting');
    if (!el) return;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) el.textContent = 'Good morning';
    else if (hour >= 12 && hour < 18) el.textContent = 'Good afternoon';
    else el.textContent = 'Good evening';
  }
  window.updateHomeGreeting = updateHomeGreeting;

  window.setHomeCategoryFilter = function(filter, btn) {
    document.querySelectorAll('.home-header .pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const madeForYouSec = document.getElementById('homeMadeForYouSection');
    const recentlyPlayedSec = document.getElementById('homeRecentlyPlayedSection');
    const popularAlbumsSec = document.getElementById('homePopularAlbumsSection');
    const popularArtistsSec = document.getElementById('homePopularArtistsSection');
    const featuredPlaylistsSec = document.getElementById('homeFeaturedPlaylistsSection');
    const podcastsSec = document.getElementById('homePodcastsSection');
    const quickGrid = document.getElementById('homeQuickGrid');
    const greeting = document.getElementById('homeGreeting');

    if (filter === 'podcasts') {
      if (quickGrid) quickGrid.style.display = 'none';
      if (greeting) greeting.style.display = 'none';
      if (madeForYouSec) madeForYouSec.style.display = 'none';
      if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'none';
      if (popularAlbumsSec) popularAlbumsSec.style.display = 'none';
      if (popularArtistsSec) popularArtistsSec.style.display = 'none';
      if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'none';
      if (podcastsSec) {
        podcastsSec.style.display = 'block';
        populateHomePodcasts();
      }
    } else if (filter === 'music') {
      if (quickGrid) quickGrid.style.display = 'grid';
      if (greeting) greeting.style.display = 'block';
      if (madeForYouSec) madeForYouSec.style.display = 'block';
      if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'block';
      if (popularAlbumsSec) popularAlbumsSec.style.display = 'block';
      if (popularArtistsSec) popularArtistsSec.style.display = 'block';
      if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'block';
      if (podcastsSec) podcastsSec.style.display = 'none';
    } else {
      // all
      if (quickGrid) quickGrid.style.display = 'grid';
      if (greeting) greeting.style.display = 'block';
      if (madeForYouSec) madeForYouSec.style.display = 'block';
      if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'block';
      if (popularAlbumsSec) popularAlbumsSec.style.display = 'block';
      if (popularArtistsSec) popularArtistsSec.style.display = 'block';
      if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'block';
      if (podcastsSec) podcastsSec.style.display = 'none';
    }
  };

  function renderCardCarousel(container, items) {
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `home-card ${item.isArtist ? 'is-artist' : ''}`;
      card.title = `${item.title} - ${item.subtitle}`;
      card.innerHTML = `
        <div class="home-card-img-wrap">
          <img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://ui-avatars.com/api/?name=Music&background=282828&color=fff&size=180'" loading="lazy">
          <button class="home-card-play-btn" title="Play ${escapeHtml(item.title)}">
            <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
            </svg>
          </button>
        </div>
        <div class="home-card-title">${escapeHtml(item.title)}</div>
        <div class="home-card-desc">${escapeHtml(item.subtitle)}</div>
      `;

      const playBtn = card.querySelector('.home-card-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof item.playAction === 'function') item.playAction();
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.home-card-play-btn')) return;
        if (typeof item.clickAction === 'function') item.clickAction();
      });

      container.appendChild(card);
    });
  }

  function populateHomeRecentlyPlayed() {
    const carousel = document.getElementById('homeRecentlyPlayedCarousel');
    const section = document.getElementById('homeRecentlyPlayedSection');
    if (!carousel) return;

    const history = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getRecentItems(10) : [];
    if (!history || !history.length) {
      const fallback = (tracks || []).slice(0, 6);
      if (!fallback.length) {
        if (section) section.style.display = 'none';
        return;
      }
      if (section) section.style.display = 'block';
      renderCardCarousel(carousel, fallback.map(t => ({
        title: t.title || t.fileName,
        subtitle: t.artist || 'Song',
        coverUrl: t.coverUrl || t.coverArtUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.title)}&background=282828&color=1db954&size=180`,
        type: 'Song',
        id: t.id || t.fileName,
        playAction: () => {
          loadTrack(t, true);
        },
        clickAction: () => {
          if (window.openSongDetailView) window.openSongDetailView(t);
          else loadTrack(t, true);
        }
      })));
      return;
    }

    if (section) section.style.display = 'block';
    const seen = new Set();
    const uniqueItems = [];
    for (const h of history) {
      const key = (h.title || h.id || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(h);
        if (uniqueItems.length >= 6) break;
      }
    }

    renderCardCarousel(carousel, uniqueItems.map(item => ({
      title: item.title || 'Untitled',
      subtitle: item.artist || item.type || 'Recent',
      coverUrl: item.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=282828&color=1db954&size=180`,
      type: item.type || 'Song',
      id: item.id,
      playAction: () => {
        const t = tracks.find(x => x.id === item.id || x.title === item.title);
        if (t) loadTrack(t, true);
        else loadTrack(item, true);
      },
      clickAction: () => {
        if (item.type === 'Album' && item.albumId && window.openAlbumDetailView) {
          window.openAlbumDetailView(item.albumId);
        } else if (item.type === 'Artist' && window.openArtistDetailView) {
          window.openArtistDetailView(item.artist || item.title);
        } else {
          const t = tracks.find(x => x.id === item.id || x.title === item.title);
          if (t && window.openSongDetailView) window.openSongDetailView(t);
          else loadTrack(t || item, true);
        }
      }
    })));
  }

  async function populateHomePopularAlbums() {
    const carousel = document.getElementById('homePopularAlbumsCarousel');
    const section = document.getElementById('homePopularAlbumsSection');
    if (!carousel) return;

    let albumList = [];
    try {
      const res = await authenticatedFetch('/api/albums/list');
      if (res.ok) {
        albumList = await res.json();
      }
    } catch (e) {}

    if (!albumList || !albumList.length) {
      const map = new Map();
      (tracks || []).forEach(t => {
        if (t.album && t.album.toLowerCase() !== 'single' && t.album.toLowerCase() !== 'unknown album') {
          if (!map.has(t.album)) {
            map.set(t.album, {
              id: t.albumId || t.album,
              albumId: t.albumId,
              title: t.album,
              artist: t.artist || 'Various Artists',
              coverUrl: t.coverUrl || t.coverArtUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.album)}&background=282828&color=1db954&size=180`
            });
          }
        }
      });
      albumList = Array.from(map.values());
    }

    if (!albumList.length) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';

    renderCardCarousel(carousel, albumList.slice(0, 7).map(a => ({
      title: a.title || a.name,
      subtitle: `${a.artist || 'Album'} • Album`,
      coverUrl: a.coverArtUrl || a.coverUrl || a.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.title)}&background=282828&color=1db954&size=180`,
      type: 'Album',
      id: a.id || a.albumId,
      playAction: () => {
        if (window.openAlbumDetailView) window.openAlbumDetailView(a.id || a.albumId || a.title);
      },
      clickAction: () => {
        if (window.openAlbumDetailView) window.openAlbumDetailView(a.id || a.albumId || a.title);
      }
    })));
  }

  function populateHomePopularArtists() {
    const carousel = document.getElementById('homePopularArtistsCarousel');
    const section = document.getElementById('homePopularArtistsSection');
    if (!carousel) return;

    const artistMap = new Map();
    (tracks || []).forEach(t => {
      if (t.artist && t.artist !== 'Unknown Artist') {
        const name = t.artist.trim();
        const prev = artistMap.get(name);
        const count = (prev?.count || 0) + 1;
        const cover = t.coverUrl || t.coverArtUrl || prev?.cover || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff&size=180`;
        artistMap.set(name, { name, count, cover, artistId: t.artistId });
      }
    });

    const topArtists = Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, 7);
    if (!topArtists.length) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';

    renderCardCarousel(carousel, topArtists.map(art => ({
      title: art.name,
      subtitle: 'Artist',
      coverUrl: art.cover,
      isArtist: true,
      type: 'Artist',
      id: art.name,
      playAction: () => {
        if (window.openArtistDetailView) window.openArtistDetailView(art.artistId || art.name);
      },
      clickAction: () => {
        if (window.openArtistDetailView) window.openArtistDetailView(art.artistId || art.name);
      }
    })));
  }

  function populateHomeFeaturedPlaylists() {
    const carousel = document.getElementById('homeFeaturedPlaylistsCarousel');
    const section = document.getElementById('homeFeaturedPlaylistsSection');
    if (!carousel) return;

    const featured = [];
    (userPlaylists || []).forEach(pl => {
      if ((pl.name || '').toLowerCase() !== 'liked songs') {
        featured.push({
          title: pl.name,
          subtitle: `${pl.songs ? pl.songs.length : 0} songs • Playlist`,
          coverUrl: pl.imageUrl || (pl.songs && pl.songs[0] ? (pl.songs[0].coverUrl || '') : '') || `https://ui-avatars.com/api/?name=${encodeURIComponent(pl.name)}&background=1e3264&color=fff&size=180`,
          type: 'Playlist',
          id: pl.id,
          playAction: () => {
            if (pl.songs && pl.songs.length) playPlaylistContext(pl, 0);
          },
          clickAction: () => {
            openPlaylistDetailView(pl);
          }
        });
      }
    });

    if (featured.length < 5) {
      featured.push({
        title: "Today's Top Hits",
        subtitle: "The most played tracks right now",
        coverUrl: "https://ui-avatars.com/api/?name=Top+Hits&background=148a08&color=fff&size=180",
        type: 'Playlist',
        id: 'pl-tth',
        playAction: () => {
          activeQueue = [...tracks];
          currentQueueTitle = "Today's Top Hits";
          buildQueueOrder();
          loadTrack(0, true);
        },
        clickAction: () => {
          openPlaylistDetailView({ name: "Today's Top Hits", songs: tracks.slice(0, 15) });
        }
      });
      featured.push({
        title: "Best of Indie Việt",
        subtitle: "Thắng, Ngọt, Thịnh Suy, and more",
        coverUrl: "https://ui-avatars.com/api/?name=Indie+Viet&background=ec008c&color=fff&size=180",
        type: 'Playlist',
        id: 'pl-indie-viet',
        playAction: () => {
          const indieTracks = tracks.filter(t => /thắng|ngọt/i.test(t.artist || ''));
          activeQueue = indieTracks.length ? indieTracks : [...tracks];
          currentQueueTitle = "Best of Indie Việt";
          buildQueueOrder();
          loadTrack(0, true);
        },
        clickAction: () => {
          const indieTracks = tracks.filter(t => /thắng|ngọt/i.test(t.artist || ''));
          openPlaylistDetailView({ name: "Best of Indie Việt", songs: indieTracks.length ? indieTracks : tracks.slice(0, 10) });
        }
      });
    }

    if (section) section.style.display = 'block';
    renderCardCarousel(carousel, featured.slice(0, 7));
  }

  function populateHomePodcasts() {
    const carousel = document.getElementById('homePodcastsCarousel');
    if (!carousel) return;

    const podcasts = [
      { title: "The Joe Rogan Experience", publisher: "Joe Rogan", cover: "https://ui-avatars.com/api/?name=JRE&background=bc5900&color=fff&size=180" },
      { title: "Huberman Lab", publisher: "Scicomm Media", cover: "https://ui-avatars.com/api/?name=Huberman&background=0083b0&color=fff&size=180" },
      { title: "TED Talks Daily", publisher: "TED", cover: "https://ui-avatars.com/api/?name=TED&background=e91429&color=fff&size=180" },
      { title: "Have A Sip", publisher: "Vietcetera", cover: "https://ui-avatars.com/api/?name=Vietcetera&background=8d67ab&color=fff&size=180" },
      { title: "Lex Fridman Podcast", publisher: "Lex Fridman", cover: "https://ui-avatars.com/api/?name=Lex&background=333&color=fff&size=180" }
    ];

    renderCardCarousel(carousel, podcasts.map(p => ({
      title: p.title,
      subtitle: `Show • ${p.publisher}`,
      coverUrl: p.cover,
      type: 'Podcast',
      id: p.title,
      playAction: () => {
        showToast('info', 'Podcasts', `Streaming ${p.title}`);
      },
      clickAction: () => {
        showToast('info', 'Podcasts', `Viewing ${p.title}`);
      }
    })));
  }

  window.initAllHomeSections = function() {
    updateHomeGreeting();
    populateHomeGrid();
    populateMadeForYou();
    populateHomeRecentlyPlayed();
    populateHomePopularAlbums();
    populateHomePopularArtists();
    populateHomeFeaturedPlaylists();
  };

  window.populateHomeRecentlyPlayed = populateHomeRecentlyPlayed;
  window.populateHomePopularAlbums = populateHomePopularAlbums;
  window.populateHomePopularArtists = populateHomePopularArtists;
  window.populateHomeFeaturedPlaylists = populateHomeFeaturedPlaylists;
  window.populateHomePodcasts = populateHomePodcasts;

  function populateBrowseAll() {
    const grid = document.getElementById('browseCategoryGrid');
    if(!grid) return;
    const categories = [
      { name: 'Podcasts', color: '#e13300' }, { name: 'Made For You', color: '#1e3264' },
      { name: 'New Releases', color: '#e8115b' }, { name: 'Pop', color: '#148a08' },
      { name: 'Hip-Hop', color: '#bc5900' }, { name: 'K-Pop', color: '#8d67ab' },
      { name: 'Rock', color: '#e91429' }, { name: 'Indie', color: '#608108' }
    ];
    grid.innerHTML = categories.map(cat => `
      <a href="#" class="browse-card" style="background-color: ${cat.color};">
        <h3>${cat.name}</h3>
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=282828&color=fff&size=100" alt="category">
      </a>
    `).join('');
  }
  
  function toggleMiniPlayer() {
    showToast('info', 'Mini Player', 'Mini Player popped out.');
  }

  // Waveform, Danmaku & Like Logic
  let currentWaveformComments = [];
  let lastDanmakuTime = 0;
  let activeTrackId = null;
  
  function isTrackLiked(track) {
    if (!track || !userPlaylists) return false;
    const likedPlaylist = userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
    if (!likedPlaylist || !likedPlaylist.songs) return false;
    const targetFile = (track.fileName || track.title || '').trim().toLowerCase();
    return likedPlaylist.songs.some(s => {
      const sName = (s.fileName || s.title || s.displayName || (typeof s === 'string' ? s : '')).trim().toLowerCase();
      return sName === targetFile || (targetFile && sName.includes(targetFile));
    });
  }

  function toggleFollowArtist() {
    const btn = document.getElementById('rightPanelFollowBtn');
    if (!btn) return;
    if (btn.textContent === 'Follow') {
      btn.textContent = 'Following';
      btn.style.borderColor = '#1db954';
      btn.style.color = '#1db954';
      showToast('success', 'Following Artist', 'You are now following this artist!');
    } else {
      btn.textContent = 'Follow';
      btn.style.borderColor = '#727272';
      btn.style.color = '#fff';
      showToast('info', 'Unfollowed Artist', 'You are no longer following this artist.');
    }
  }

  function updateLikeButtonState(track) {
    const liked = isTrackLiked(track);
    const btns = ['pvLikeBtn', 'playerLikeBtn', 'topResultLikeBtn', 'sdLikeBtn'].map(id => document.getElementById(id)).filter(b => b);
    
    btns.forEach(btn => {
      if (liked) {
        btn.style.color = '#1db954';
        btn.classList.add('liked');
        btn.title = 'Remove from Liked Songs';
      } else {
        btn.style.color = 'var(--muted)';
        btn.classList.remove('liked');
        btn.title = 'Save to Liked Songs';
      }
    });
  }

  window.toggleLikeInspectedTrack = async function() {
    if (!authToken) {
      showToast('error', 'Authentication Required', 'Please log in to save songs to your Liked Songs.');
      setAuthPanelOpen(true, 'login');
      return;
    }

    const track = currentInspectedTrack || tracks[currentTrackIndex];
    if (!track) return;

    const fileName = track.fileName || track.title;
    if (!fileName && !track.id) return;

    try {
      const response = await authenticatedFetch('/playlists/my/liked/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName || track.id,
          songFileName: fileName || track.id,
          songId: track.id || ''
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || 'Unable to update Liked Songs.');
      }

      userPlaylists = payload;
      renderUserPlaylists();
      updateLikeButtonState(track);

      const nowLiked = isTrackLiked(track);
      if (nowLiked) {
        showToast('success', 'Liked Songs', `Added "${track.title || 'song'}" to Liked Songs!`);
      } else {
        showToast('info', 'Liked Songs', `Removed "${track.title || 'song'}" from Liked Songs.`);
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to update Liked Songs.');
    }
  };

  window.executeWaveformAction = function(action, trackFileName, trackId, albumId, artistId) {
      if (window.trackMenuAction) {
          window.contextMenuTargetSong = { fileName: trackFileName, songId: trackId, albumId: albumId || '', artistId: artistId || '' };
          window.trackMenuAction(action);
      }
  };

  window.currentSongDetailTrack = null;
  let isSongDetailLyricsExpanded = false;

  window.openSongDetailView = function(track) {
    if (!track) {
      const list = getCurrentQueue();
      track = list[currentTrackIndex] || tracks[currentTrackIndex];
    }
    if (!track && tracks.length > 0) {
      track = tracks[0];
    }
    if (!track) return;

    isSongDetailLyricsExpanded = false;
    showSection('song-detail-view');

    const mainPanel = document.querySelector('.main-panel');
    if (mainPanel) mainPanel.scrollTop = 0;

    window.renderSongDetailView(track);
  };

  window.openWaveformView = window.openSongDetailView;

  window.renderSongDetailView = function(track) {
    if (!track) return;
    window.currentSongDetailTrack = track;

    // Title
    const title = track.title || track.displayName || track.fileName || 'Untitled Song';
    const titleEl = document.getElementById('sdTitle');
    if (titleEl) titleEl.textContent = title;

    // Cover
    const coverEl = document.getElementById('sdCoverArt');
    const coverUrl = track.coverArtUrl || track.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(track.artist || title)}&background=333&color=fff&size=300`;
    if (coverEl) {
      coverEl.src = coverUrl;
      coverEl.onerror = () => { coverEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.artist || 'Song')}&background=333&color=fff&size=300`; };
    }

    // Artist Avatar & Link
    const artistName = track.artist || 'Unknown Artist';
    const artistLink = document.getElementById('sdArtistName');
    if (artistLink) {
      artistLink.textContent = artistName;
      artistLink.onclick = (e) => {
        e.stopPropagation();
        if (window.openArtistDetailView) {
          window.openArtistDetailView(track.artistId || artistName);
        }
      };
    }
    const artistAvatar = document.getElementById('sdArtistAvatar');
    if (artistAvatar) {
      artistAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=333&color=fff&size=64`;
    }

    // Album Link
    const albumName = track.album || 'Single';
    const albumLink = document.getElementById('sdAlbumName');
    if (albumLink) {
      albumLink.textContent = albumName;
      const isStandaloneSingle = !track.albumId && albumName.toLowerCase() === 'single';
      albumLink.style.cursor = isStandaloneSingle ? 'default' : 'pointer';
      albumLink.onclick = (e) => {
        e.stopPropagation();
        if (!isStandaloneSingle && window.openAlbumDetailView) {
          window.openAlbumDetailView(track.albumId || albumName);
        }
      };
    }

    // Year
    const yearEl = document.getElementById('sdReleaseYear');
    let releaseYear = '2024';
    if (track.releaseDate) {
      releaseYear = track.releaseDate.substring(0, 4);
    } else if (track.year) {
      releaseYear = track.year;
    }
    if (yearEl) yearEl.textContent = releaseYear;

    // Duration
    const durSec = track.durationSeconds || Math.round((track.durationMs || 180000) / 1000);
    const durEl = document.getElementById('sdDuration');
    if (durEl) durEl.textContent = formatTime(durSec);

    // Stream Count
    const streams = track.playCount ? track.playCount.toLocaleString() : (track.views ? track.views.toLocaleString() : '63,016,095');
    const streamEl = document.getElementById('sdStreamCount');
    if (streamEl) streamEl.textContent = streams;

    // Dynamic Ambient Hero Background
    const heroEl = document.getElementById('sdHero');
    if (heroEl) {
      const colors = [
        ['#5c1818', '#2b0b0b'], // deep red
        ['#1e3264', '#0f1a33'], // deep navy
        ['#283ea3', '#141f52'], // indigo
        ['#537aa1', '#1f2e3d'], // slate blue
        ['#8400e7', '#34005b'], // purple
        ['#1e5945', '#0f2c22'], // emerald
        ['#ba5d07', '#4a2503'], // warm amber
        ['#3e3e3e', '#1a1a1a']  // charcoal
      ];
      let hash = 0;
      const key = (track.artist || '') + (track.title || '');
      for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % colors.length;
      const [c1, c2] = colors[Math.abs(hash)];
      heroEl.style.background = `linear-gradient(180deg, ${c1} 0%, ${c2} 60%, #121212 100%)`;
    }

    // Sound wave initialization
    if (window.initializeWaveform) {
      window.initializeWaveform(track);
    }

    // Play button handler
    const playBtn = document.getElementById('sdPlayBtn');
    if (playBtn) {
      playBtn.onclick = () => {
        const curList = getCurrentQueue();
        const curTrack = curList[currentTrackIndex];
        const isCur = curTrack && (
          (curTrack.id && (curTrack.id === track.id || curTrack.id === track.Id)) ||
          (curTrack.fileName && curTrack.fileName === track.fileName) ||
          (curTrack.title && track.title && curTrack.title === track.title)
        );
        if (isCur) {
          togglePlay();
        } else {
          const qIdx = curList.findIndex(t => (track.id && (t.id === track.id || t.Id === track.id)) || (track.fileName && t.fileName === track.fileName));
          if (qIdx !== -1) {
            loadTrack(qIdx, true);
          } else {
            loadTrack(track, true);
          }
        }
        updateTransportUI();
      };
    }

    // Like button
    const likeBtn = document.getElementById('sdLikeBtn');
    if (likeBtn) {
      const isLiked = typeof isTrackLiked === 'function' ? isTrackLiked(track) : false;
      likeBtn.classList.toggle('active', isLiked);
      likeBtn.style.color = isLiked ? '#1db954' : '#b3b3b3';
      likeBtn.title = isLiked ? 'Remove from Your Library' : 'Save to Your Library';
      likeBtn.onclick = async () => {
        window.currentInspectedTrack = track;
        if (typeof window.toggleLikeInspectedTrack === 'function') {
          await window.toggleLikeInspectedTrack();
          const nowLiked = typeof isTrackLiked === 'function' ? isTrackLiked(track) : false;
          likeBtn.classList.toggle('active', nowLiked);
          likeBtn.style.color = nowLiked ? '#1db954' : '#b3b3b3';
        }
      };
    }

    // More options button
    const moreBtn = document.getElementById('sdMoreBtn');
    if (moreBtn) {
      moreBtn.onclick = (e) => {
        if (window.openTrackMenu) {
          window.openTrackMenu(e, track.fileName || title, track.id || '', track.albumId || '', track.artistId || track.artist || '', track.artist || '', currentViewedPlaylist?.id || '');
        }
      };
    }

    // Lyrics rendering
    renderSongDetailLyrics(track);

    // Artist Card
    const cardAvatar = document.getElementById('sdArtistCardAvatar');
    if (cardAvatar) {
      cardAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=333&color=fff&size=160`;
    }
    const cardName = document.getElementById('sdArtistCardName');
    if (cardName) cardName.textContent = artistName;
    const artistCard = document.getElementById('sdArtistCard');
    if (artistCard) {
      artistCard.onclick = () => {
        if (window.openArtistDetailView) {
          window.openArtistDetailView(track.artistId || artistName);
        }
      };
    }

    // Recommended tracks
    renderSongDetailRecommended(track);

    // Popular tracks by artist
    renderSongDetailPopularArtistTracks(track);

    updateTransportUI();
  };

  function renderSongDetailLyrics(track) {
    const container = document.getElementById('sdLyricsContent');
    const showMoreBtn = document.getElementById('sdShowMoreLyricsBtn');
    if (!container) return;

    const rawLyrics = track.lyrics || '';
    // Strip LRC timestamps and metadata tags like [ti:Title]
    const clean = rawLyrics.replace(/\[(?:[a-zA-Z]+:.*|\d{1,3}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)\]\s*/g, '').trim();

    if (!clean) {
      container.innerHTML = '<div class="sd-lyrics-empty">Looks like we don\'t have the lyrics for this song yet.</div>';
      if (showMoreBtn) showMoreBtn.style.display = 'none';
      return;
    }

    const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const isPrem = !!(currentUser && (currentUser.isPremium || currentUser.premium || currentUser.subscriptionTier === 'Premium'));

    if (!isPrem && lines.length > 4) {
      const previewLines = lines.slice(0, 4);
      const blurredLines = lines.slice(4, 7);
      container.innerHTML = previewLines.map(line => `<p>${escapeHtml(line)}</p>`).join('') +
        blurredLines.map(line => `<p class="lyric-line blurred">${escapeHtml(line)}</p>`).join('') +
        `<div class="lyrics-lock-cta" style="padding:14px; margin-top:12px;">
           <div style="font-size:20px;">🔒</div>
           <div style="font-weight:700; color:#fff; font-size:13px;">Unlock full lyrics with Premium</div>
           <button type="button" class="lyrics-lock-btn" style="padding:6px 14px; font-size:12px;" onclick="openCheckoutModal('Individual')">Unlock Full Lyrics</button>
         </div>`;
      if (showMoreBtn) showMoreBtn.style.display = 'none';
      return;
    }

    const maxInitial = 8;
    const shouldTruncate = lines.length > maxInitial && !isSongDetailLyricsExpanded;
    const displayLines = shouldTruncate ? lines.slice(0, maxInitial) : lines;

    container.innerHTML = displayLines.map(line => `<p>${escapeHtml(line)}</p>`).join('');

    if (showMoreBtn) {
      if (lines.length > maxInitial) {
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = isSongDetailLyricsExpanded ? 'Show less' : '...Show more';
        showMoreBtn.onclick = () => {
          isSongDetailLyricsExpanded = !isSongDetailLyricsExpanded;
          renderSongDetailLyrics(track);
        };
      } else {
        showMoreBtn.style.display = 'none';
      }
    }
  }

  function renderSongDetailRecommended(track) {
    const container = document.getElementById('sdRecommendedTracks');
    if (!container) return;

    const candidates = tracks.filter(t => (t.id !== track.id && t.fileName !== track.fileName));
    let filtered = [];
    if (track.genre || track.mood) {
      filtered = candidates.filter(t => (track.genre && t.genre === track.genre) || (track.mood && t.mood === track.mood));
    }
    if (filtered.length < 5) {
      const remaining = candidates.filter(t => !filtered.includes(t));
      filtered = filtered.concat(remaining);
    }
    const top5 = filtered.slice(0, 5);

    container.innerHTML = top5.map((t, i) => {
      const tDur = t.durationSeconds || Math.round((t.durationMs || 180000) / 1000);
      const tCover = t.coverArtUrl || t.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.artist || t.title)}&background=333&color=fff&size=60`;
      const tPlays = (t.playCount || t.views || (1450000 - i * 180000)).toLocaleString();
      const isCur = tracks[currentTrackIndex] && (tracks[currentTrackIndex].id === t.id || tracks[currentTrackIndex].fileName === t.fileName);
      return `
        <div class="sd-track-item ${isCur ? 'is-active' : ''}" onclick="window.playSongDirectly('${escapeHtml(t.id || t.fileName)}')">
          <div class="sd-track-index-col">
            <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path></svg>
          </div>
          <div class="sd-track-thumb-col">
            <img src="${tCover}" class="sd-track-thumb" alt="" onerror="this.src='https://ui-avatars.com/api/?name=Music&background=333&color=fff&size=60'"/>
            <div class="sd-track-meta">
              <div class="sd-track-title">${escapeHtml(t.title || t.fileName)}</div>
              <div class="sd-track-artist">${escapeHtml(t.artist || 'Unknown Artist')}</div>
            </div>
          </div>
          <div class="sd-track-plays">${tPlays}</div>
          <div class="sd-track-dur">${formatTime(tDur)}</div>
          <div class="sd-track-action">
            <svg height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderSongDetailPopularArtistTracks(track) {
    const container = document.getElementById('sdPopularArtistTracks');
    const titleEl = document.getElementById('sdPopularArtistTitle');
    if (!container) return;

    const artistName = track.artist || 'Artist';
    if (titleEl) titleEl.textContent = artistName;

    let artistTracks = tracks.filter(t => t.artist && t.artist.trim().toLowerCase() === artistName.trim().toLowerCase());
    if (artistTracks.length < 5) {
      const extra = tracks.filter(t => !artistTracks.includes(t));
      artistTracks = artistTracks.concat(extra);
    }
    const top5 = artistTracks.slice(0, 5);

    container.innerHTML = top5.map((t, idx) => {
      const tDur = t.durationSeconds || Math.round((t.durationMs || 180000) / 1000);
      const tCover = t.coverArtUrl || t.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.title)}&background=333&color=fff&size=60`;
      const tPlays = (t.playCount || t.views || (2500000 - idx * 250000)).toLocaleString();
      const isCur = tracks[currentTrackIndex] && (tracks[currentTrackIndex].id === t.id || tracks[currentTrackIndex].fileName === t.fileName);
      return `
        <div class="sd-track-item ${isCur ? 'is-active' : ''}" onclick="window.playSongDirectly('${escapeHtml(t.id || t.fileName)}')">
          <div class="sd-track-index-col">${idx + 1}</div>
          <div class="sd-track-thumb-col">
            <img src="${tCover}" class="sd-track-thumb" alt="" onerror="this.src='https://ui-avatars.com/api/?name=Music&background=333&color=fff&size=60'"/>
            <div class="sd-track-meta">
              <div class="sd-track-title">${escapeHtml(t.title || t.fileName)}</div>
              <div class="sd-track-artist">${escapeHtml(t.artist || 'Unknown Artist')}</div>
            </div>
          </div>
          <div class="sd-track-plays">${tPlays}</div>
          <div class="sd-track-dur">${formatTime(tDur)}</div>
          <div class="sd-track-action">
            <svg height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
          </div>
        </div>
      `;
    }).join('');
  }

  window.playSongDirectly = function(identifier) {
    const target = tracks.find(t => t.id === identifier || t.fileName === identifier) || getCurrentQueue().find(t => t.id === identifier || t.fileName === identifier);
    if (target) {
      loadTrack(target, true);
    }
  };
  
  window.initializeWaveform = function(track) {
    if (!track) track = tracks[currentTrackIndex];
    if (!track) return;

    activeTrackId = track.Id || track.id || tracks.indexOf(track) || 1;
    
    const waveformContainer = document.getElementById('waveformContainer');
    if (!waveformContainer) return;
    
    waveformContainer.style.display = 'block';

    let initialProgress = 0;
    if (audioPlayer && audioPlayer.duration) {
      const curList = getCurrentQueue();
      const curTrack = curList[currentTrackIndex];
      const isCur = curTrack && (
        (curTrack.id && (curTrack.id === track.id || curTrack.id === track.Id)) ||
        (curTrack.fileName && curTrack.fileName === track.fileName) ||
        (curTrack.title && track.title && curTrack.title === track.title)
      );
      if (isCur) {
        initialProgress = audioPlayer.currentTime / audioPlayer.duration;
      }
    }

    drawSimulatedWaveform(initialProgress);
    const progBar = document.getElementById('waveformProgress');
    if (progBar) {
      progBar.style.width = `${Math.min(100, Math.max(0, initialProgress * 100))}%`;
    }

    if (typeof fetchTrackComments === 'function') {
      fetchTrackComments(activeTrackId);
    }
    
    waveformContainer.onclick = (e) => {
      if(e.target.id === 'commentInput') return;
      const rect = waveformContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      
      const curList = getCurrentQueue();
      const curTrack = curList[currentTrackIndex];
      const isCur = curTrack && (
        (curTrack.id && (curTrack.id === track.id || curTrack.id === track.Id)) ||
        (curTrack.fileName && curTrack.fileName === track.fileName) ||
        (curTrack.title && track.title && curTrack.title === track.title)
      );

      if (isCur && audioPlayer && audioPlayer.duration) {
        audioPlayer.currentTime = progress * audioPlayer.duration;
        drawSimulatedWaveform(progress);
      } else {
        const qIdx = curList.findIndex(t => (track.id && (t.id === track.id || t.Id === track.id)) || (track.fileName && t.fileName === track.fileName));
        if (qIdx !== -1) {
          loadTrack(qIdx, true);
        } else {
          loadTrack(track, true);
        }
        setTimeout(() => {
          if (audioPlayer && audioPlayer.duration) {
            audioPlayer.currentTime = progress * audioPlayer.duration;
            drawSimulatedWaveform(progress);
          }
        }, 150);
      }
      
      const popover = document.getElementById('commentPopover');
      if (popover) popover.style.display = 'none';
    };

    waveformContainer.oncontextmenu = (e) => {
      e.preventDefault();
      if(e.target.id === 'commentInput') return;
      
      const rect = waveformContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      
      const popover = document.getElementById('commentPopover');
      if (popover) {
        popover.style.display = 'block';
        popover.style.left = `${Math.min(clickX, rect.width - 220)}px`;
        popover.style.bottom = '10px'; 
      }
      
      const input = document.getElementById('commentInput');
      if (input) {
        const totalDur = audioPlayer && audioPlayer.duration ? audioPlayer.duration : (track.durationSeconds || 180);
        input.dataset.timestamp = Math.floor(progress * totalDur * 1000);
        input.focus();
      }
    };
  };

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioContextClass ? new AudioContextClass() : null;

  function fetchRealAudioData(track) {
      if (!audioCtx || track.isFetchingRealData || track.realAudioData) return;
      if (!track.src) return;
      
      track.isFetchingRealData = true;
      fetch(track.src)
          .then(res => {
              if(!res.ok) throw new Error("Network response was not ok");
              return res.arrayBuffer();
          })
          .then(buffer => audioCtx.decodeAudioData(buffer))
          .then(audioBuffer => {
              const rawData = audioBuffer.getChannelData(0); 
              const numPoints = 2000;
              const blockSize = Math.floor(rawData.length / numPoints);
              const data = [];
              
              for(let i = 0; i < numPoints; i++) {
                  let blockStart = i * blockSize;
                  let sum = 0;
                  for(let j = 0; j < blockSize; j++) {
                      let val = rawData[blockStart + j];
                      sum += val * val;
                  }
                  let rms = Math.sqrt(sum / blockSize);
                  data.push(rms * 4); // Amplify RMS to get better visual height
              }
              
              let maxAmp = Math.max(...data);
              let normalized = data.map(v => (maxAmp > 0 ? v / maxAmp : 0));
              
              const smoothed = [];
              for(let i=0; i<numPoints; i++) {
                  let sum = 0, count = 0;
                  for(let j=-1; j<=1; j++) {
                     if(i+j >= 0 && i+j < numPoints) {
                         sum += normalized[i+j]; count++;
                     }
                  }
                  smoothed.push(sum/count);
              }
              
              track.realAudioData = smoothed;
              const currentActiveId = track.Id || track.id || (tracks.indexOf(track) !== -1 ? tracks.indexOf(track) : 1);
              if (activeTrackId === currentActiveId && window.audioPlayer) {
                  drawSimulatedWaveform(window.audioPlayer.duration ? window.audioPlayer.currentTime / window.audioPlayer.duration : 0);
              }
          })
          .catch(e => {
              console.error("Failed to decode real audio for waveform:", e);
              track.isFetchingRealData = false;
          });
  }

  function getPseudoAudioData(track) {
      if (track.audioData) return track.audioData;
      
      const seedStr = (track.Title || track.title || '') + (track.Id || track.id || '');
      let seed = 12345;
      for(let i=0; i<seedStr.length; i++) seed += seedStr.charCodeAt(i);
      
      const data = [];
      const numPoints = 2000;
      
      let rand = seed;
      for (let i = 0; i < numPoints; i++) {
          rand = (rand * 9301 + 49297) % 233280;
          let val = rand / 233280;
          val = Math.pow(val, 1.5);
          let envelope = Math.sin(Math.PI * (i / numPoints));
          let macro = Math.sin(Math.PI * 15 * (i / numPoints)) * 0.5 + 0.5; 
          let amplitude = val * (0.3 + 0.7 * macro) * (0.1 + 0.9 * envelope);
          data.push(amplitude);
      }
      
      const smoothed = [];
      for(let i=0; i<numPoints; i++) {
          let sum = 0, count = 0;
          for(let j=-1; j<=1; j++) {
             if(i+j >= 0 && i+j < numPoints) {
                 sum += data[i+j];
                 count++;
             }
          }
          smoothed.push(sum/count);
      }
      
      track.audioData = smoothed;
      return smoothed;
  }

  function drawSimulatedWaveform(progress = 0) {
    const canvas = document.getElementById('waveformCanvas');
    if(!canvas) return;
    
    // Ensure native resolution matches the CSS display size to avoid blurry stretch
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let track = tracks[currentTrackIndex];
    if (activeTrackId) {
        track = tracks.find(t => (t.Id || t.id || tracks.indexOf(t) || 1) === activeTrackId) || track;
    }
    if (!track) return;
    
    let audioData;
    if (track.realAudioData) {
        audioData = track.realAudioData;
    } else {
        audioData = getPseudoAudioData(track);
        fetchRealAudioData(track);
    }
    
    const barWidth = 2; // Thin bars like SoundCloud
    const gap = 1;
    const bars = Math.floor(canvas.width / (barWidth + gap));
    const centerY = Math.floor(canvas.height * 0.65); // 65% for top, 35% for reflection
    
    for(let i = 0; i < bars; i++) {
        const itemProgress = i / bars;
        const isPlayed = itemProgress <= progress;
        
        const dataIndex = Math.floor(itemProgress * (audioData.length - 1));
        const val = audioData[dataIndex];
        
        // SoundCloud colors
        const topColor = isPlayed ? '#ff5500' : 'rgba(255, 255, 255, 0.7)';
        const bottomColor = isPlayed ? '#ffb380' : 'rgba(255, 255, 255, 0.3)';
        
        const topHeight = Math.max(2, val * (centerY - 5));
        const bottomHeight = topHeight * 0.4;
        
        // Draw top bar
        ctx.fillStyle = topColor;
        ctx.fillRect(i * (barWidth + gap), centerY - topHeight, barWidth, topHeight);
        
        // Draw bottom bar (reflection) touching the center line
        ctx.fillStyle = bottomColor;
        ctx.fillRect(i * (barWidth + gap), centerY, barWidth, bottomHeight);
    }
  }


  window.updateWaveformProgress = function(current, duration) {
    if (!duration) return;
    const progress = current / duration;
    drawSimulatedWaveform(progress);
    
    const progBar = document.getElementById('waveformProgress');
    if (progBar) {
      progBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }
    
    const currentMs = Math.floor(current * 1000);
    if (Math.abs(currentMs - lastDanmakuTime) > 200) {
        // if user seeks backwards or seeks far ahead, just reset lastDanmakuTime
        if (currentMs < lastDanmakuTime || currentMs - lastDanmakuTime > 2000) {
            lastDanmakuTime = currentMs;
            return;
        }
        const toSpawn = currentWaveformComments.filter(c => c.timestamp_ms > lastDanmakuTime && c.timestamp_ms <= currentMs);
        toSpawn.forEach(c => spawnDanmaku(c.content));
        lastDanmakuTime = currentMs;
    }
  };

  function fetchTrackComments(songId) {
    if(!songId) return;
    currentWaveformComments = [];
    const layer = document.getElementById('danmakuLayer');
    if (layer) layer.innerHTML = ''; 
    
    fetch(`${API_BASE_URL}/songs/${songId}/comments`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
            currentWaveformComments = data || [];
        })
        .catch(err => console.error("Failed to load comments:", err));
  }

  window.handleCommentSubmit = function(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('commentInput');
        const content = input.value.trim();
        const timestampMs = parseInt(input.dataset.timestamp || 0);
        
        if (!content || !activeTrackId) return;
        
        const token = localStorage.getItem(authTokenKey) || authToken;
        if (!token) {
            showToast('error', 'Authentication', 'Please log in to comment.');
            return;
        }

        fetch(`${API_BASE_URL}/songs/${activeTrackId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                song_id: String(activeTrackId),
                timestamp_ms: timestampMs,
                content: content
            })
        }).then(res => {
            if (res.ok) return res.json();
            throw new Error("Failed to post comment");
        }).then(comment => {
            currentWaveformComments.push(comment);
            currentWaveformComments.sort((a,b) => a.timestamp_ms - b.timestamp_ms);
            input.value = '';
            const popover = document.getElementById('commentPopover');
            if (popover) popover.style.display = 'none';
            spawnDanmaku(comment.content);
            showToast('success', 'Comment Added', 'Your comment was added to the timeline!');
        }).catch(err => {
            showToast('error', 'Error', 'Failed to add comment.');
        });
    }
  };

  function spawnDanmaku(text) {
    const layer = document.getElementById('danmakuLayer');
    if(!layer) return;
    
    const div = document.createElement('div');
    div.className = 'danmaku-item';
    div.textContent = text;
    
    const top = Math.random() * 50;
    div.style.top = `${top}px`;
    
    const duration = 4 + Math.random() * 3;
    div.style.animationDuration = `${duration}s`;
    
    layer.appendChild(div);
    
    setTimeout(() => {
        if(div.parentNode === layer) {
            layer.removeChild(div);
        }
    }, duration * 1000);
  }

  // Bind global functions
  window.closeRightPanel = closeRightPanel;
  window.toggleQueuePanel = toggleQueuePanel;
  window.toggleLyricsView = toggleLyricsView;
  window.toggleMiniPlayer = toggleMiniPlayer;
  window.setAuthPanelOpen = setAuthPanelOpen;
  window.setAuthPanelMode = setAuthPanelMode;
  if (typeof fillCredentials !== 'undefined') window.fillCredentials = fillCredentials;
  
  function playLibraryTrack(trackIndex) {
    if (typeof trackIndex === 'number' && tracks[trackIndex]) {
      activeQueue = [...tracks];
      currentQueueTitle = 'Library';
      currentViewedPlaylist = null;
      buildQueueOrder();
      loadTrack(trackIndex, true);
      renderQueue();
    }
  }

  // Expose player functions to global scope for HTML onclick
  window.playLibraryTrack = playLibraryTrack;
  window.playPlaylistContext = playPlaylistContext;
  window.loadTrack = loadTrack;
  window.togglePlay = togglePlay;
  window.nextTrack = nextTrack;
  window.previousTrack = previousTrack;
  window.toggleShuffle = toggleShuffle;
  window.cycleLoop = cycleLoop;
  window.seekFromClick = seekFromClick;
  window.toggleMute = toggleMute;
  
  function openAddToPlaylistModal() {
    const track = currentInspectedTrack || tracks[currentTrackIndex];
    if (track) {
      openAddSongToPlaylistModal(track.fileName || track.title);
    } else {
      showToast('info', 'No Track', 'There is no track to add.');
    }
  }
  
  // Expose playlist and admin functions
  window.openAddToPlaylistModal = openAddToPlaylistModal;
  window.openCreatePlaylistModal = openCreatePlaylistModal;
  window.openLikedSongsPlaylist = openLikedSongsPlaylist;
  window.toggleFollowArtist = toggleFollowArtist;
  window.adminDeleteSong = typeof adminDeleteSong !== 'undefined' ? adminDeleteSong : function(){};
  window.adminViewSongDetails = typeof adminViewSongDetails !== 'undefined' ? adminViewSongDetails : function(){};
  window.playPlaylistTrack = typeof playPlaylistTrack !== 'undefined' ? playPlaylistTrack : function(){};
  if (typeof fillCredentials !== 'undefined') window.fillCredentials = fillCredentials;

  // --- Track Context Menu & Artist View Logic ---
  let contextMenuTargetSong = null;
  
  window.openTrackMenu = function(e, fileName, songId, albumId, artistId, artistName, fromPlaylistId) {
      if (e) e.stopPropagation();

      // Resolve track details from tracks or current playlist if missing
      let resolvedArtist = artistId;
      let resolvedAlbum = albumId;
      let resolvedSongId = songId;
      let resolvedFileName = fileName;

      let foundTrack = null;
      if (typeof tracks !== 'undefined' && Array.isArray(tracks)) {
          foundTrack = tracks.find(t => (fileName && (t.fileName === fileName || t.title === fileName)) || (songId && t.id === songId));
      }
      if (!foundTrack && currentViewedPlaylist && Array.isArray(currentViewedPlaylist.songs)) {
          foundTrack = currentViewedPlaylist.songs.find(s => {
              if (typeof s === 'string') return s === fileName;
              return (fileName && (s.fileName === fileName || s.title === fileName)) || (songId && s.id === songId);
          });
      }

      if (foundTrack && typeof foundTrack === 'object') {
          if (!resolvedArtist) resolvedArtist = foundTrack.artistId || foundTrack.artist || foundTrack.artistName;
          if (!resolvedAlbum) resolvedAlbum = foundTrack.albumId || foundTrack.album;
          if (!resolvedSongId) resolvedSongId = foundTrack.id || foundTrack.Id;
          if (!resolvedFileName) resolvedFileName = foundTrack.fileName || foundTrack.filePath || foundTrack.title;
      }
      if (!resolvedArtist && artistName) resolvedArtist = artistName;

      const activePlaylistId = fromPlaylistId || (currentViewedPlaylist ? currentViewedPlaylist.id : '') || (typeof selectedPlaylistId !== 'undefined' ? selectedPlaylistId : '');

      contextMenuTargetSong = {
          fileName: resolvedFileName || fileName,
          songId: resolvedSongId || '',
          albumId: resolvedAlbum || '',
          artistId: resolvedArtist || '',
          artistName: artistName || (foundTrack && typeof foundTrack === 'object' ? (foundTrack.artist || foundTrack.artistName) : ''),
          playlistId: activePlaylistId
      };

      const menu = document.getElementById('trackContextMenu');
      if (menu) {
          menu.style.display = 'block';
          menu.style.left = (e && e.pageX ? e.pageX : 100) + 'px';
          menu.style.top = (e && e.pageY ? e.pageY : 100) + 'px';
          
          const goToAlbumOption = document.getElementById('trackMenuGoToAlbum');
          if (goToAlbumOption) {
              if (resolvedAlbum && resolvedAlbum !== 'null' && resolvedAlbum !== '') {
                  goToAlbumOption.style.display = 'block';
              } else {
                  goToAlbumOption.style.display = 'none';
              }
          }

          const removeOption = document.getElementById('trackMenuRemoveFromPlaylist');
          if (removeOption) {
              const isViewingPlaylist = (currentViewedPlaylist && document.getElementById('playlist-view')?.classList.contains('active')) ||
                                        (activePlaylistId && document.getElementById('playlists')?.classList.contains('active')) ||
                                        Boolean(fromPlaylistId);
              const isAlbumOrSingle = currentViewedPlaylist && (currentViewedPlaylist.type === 'Album' || currentViewedPlaylist.type === 'Single' || currentViewedPlaylist.isAlbum);
              if (isViewingPlaylist && !isAlbumOrSingle) {
                  removeOption.style.display = 'block';
              } else {
                  removeOption.style.display = 'none';
              }
          }
      }
  };

  document.addEventListener('click', function(e) {
      const menu = document.getElementById('trackContextMenu');
      if (menu && menu.style.display === 'block') {
          menu.style.display = 'none';
      }
  });

  window.trackMenuAction = async function(action) {
      if (!contextMenuTargetSong) return;
      const { fileName, songId, albumId, artistId, artistName, playlistId } = contextMenuTargetSong;

      switch(action) {
          case 'add-to-queue':
              if (fileName || songId) {
                  let targetTrack = tracks.find(t => (songId && (t.id === songId || t.Id === songId)) || (fileName && (t.fileName === fileName || t.title === fileName)));
                  if (!targetTrack && typeof userPlaylists !== 'undefined') {
                      const plSong = userPlaylists.flatMap(p => p.songs || []).find(s => (songId && (s.id === songId || s.Id === songId)) || (fileName && (s.fileName === fileName || s.title === fileName)));
                      if (plSong) targetTrack = normalizeBackendSong(plSong);
                  }
                  if (!targetTrack && currentViewedPlaylist && currentViewedPlaylist.songs) {
                      const pvSong = currentViewedPlaylist.songs.find(s => (songId && (s.id === songId || s.Id === songId)) || (fileName && (s.fileName === fileName || s.title === fileName)));
                      if (pvSong) targetTrack = normalizeBackendSong(pvSong);
                  }

                  if (targetTrack) {
                      if (!activeQueue || activeQueue.length === 0) {
                          activeQueue = [...tracks];
                      }
                      
                      const insertIdx = (typeof currentTrackIndex === 'number' && currentTrackIndex >= 0 && currentTrackIndex < activeQueue.length)
                          ? currentTrackIndex + 1
                          : activeQueue.length;
                      
                      activeQueue.splice(insertIdx, 0, targetTrack);
                      buildQueueOrder();
                      renderQueue();
                      showToast('success', 'Queue Updated', `Added "${targetTrack.title || 'song'}" to queue.`);
                  } else {
                      showToast('error', 'Queue', 'Could not locate track details.');
                  }
              }
              break;
          case 'save-to-liked':
              if (songId || fileName) {
                  try {
                      const res = await authenticatedFetch('/playlists/my/liked/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ fileName: fileName || songId, songFileName: fileName || songId, songId: songId || '' })
                      });
                      if (res.ok) {
                          showToast('success', 'Liked Songs', 'Updated Liked Songs');
                          if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                      }
                  } catch(e) {}
              }
              break;
          case 'remove-from-playlist':
              let targetPlaylist = currentViewedPlaylist;
              if (!targetPlaylist && playlistId && typeof userPlaylists !== 'undefined') {
                  targetPlaylist = userPlaylists.find(p => p.id === playlistId);
              }
              if (!targetPlaylist && typeof selectedPlaylistId !== 'undefined' && selectedPlaylistId && typeof userPlaylists !== 'undefined') {
                  targetPlaylist = userPlaylists.find(p => p.id === selectedPlaylistId);
              }
              if (!targetPlaylist) {
                  showToast('error', 'Playlist', 'No playlist active.');
                  break;
              }
              const songTarget = fileName || songId;
              const isLiked = targetPlaylist.name === 'Liked Songs' || targetPlaylist.id === 'liked-songs' || (targetPlaylist.id && targetPlaylist.id.startsWith('liked-songs'));
              if (isLiked) {
                  try {
                      const res = await authenticatedFetch('/playlists/my/liked/toggle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ fileName: songTarget, songFileName: songTarget, songId: songId || '' })
                      });
                      if (res.ok) {
                          showToast('success', 'Liked Songs', 'Song removed from Liked Songs');
                          if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                          if (typeof openLikedSongsPlaylist === 'function') await openLikedSongsPlaylist();
                      }
                  } catch(e) {
                      console.error(e);
                      showToast('error', 'Error', 'Failed to remove song');
                  }
              } else if (targetPlaylist.id) {
                  try {
                      const res = await authenticatedFetch(`/playlists/my/${encodeURIComponent(targetPlaylist.id)}/songs`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ fileName: songTarget, songFileName: songTarget, songId: songId || '' })
                      });
                      if (res.ok) {
                          showToast('success', 'Playlist', 'Song removed from playlist');
                          if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                          if (typeof openPlaylistById === 'function') await openPlaylistById(targetPlaylist.id);
                          if (typeof renderPlaylistSongs === 'function') renderPlaylistSongs();
                      } else {
                          showToast('error', 'Playlist', 'Could not remove song from playlist');
                      }
                  } catch(e) {
                      console.error(e);
                      showToast('error', 'Playlist', 'Failed to remove song');
                  }
              }
              break;
          case 'add-to-playlist':
              if (fileName || songId) {
                  openAddSongToPlaylistModal(songId || fileName);
              } else {
                  showToast('info', 'Add to Playlist', 'No song selected');
              }
              break;
          case 'go-to-artist':
              const targetArtist = artistId || artistName || (contextMenuTargetSong && (contextMenuTargetSong.artistId || contextMenuTargetSong.artistName));
              if (targetArtist && targetArtist !== 'null' && targetArtist !== '') {
                  openArtistDetailView(targetArtist);
              } else {
                  showToast('error', 'Navigation', 'Artist information not available.');
              }
              break;
          case 'go-to-album':
              if (contextMenuTargetSong && contextMenuTargetSong.albumId && contextMenuTargetSong.albumId !== 'null') {
                  window.openAlbumDetailView(contextMenuTargetSong.albumId);
              } else {
                  showToast('info', 'Not Available', 'Album information not available.');
              }
              break;
          case 'share':
              showToast('success', 'Share', 'Link copied to clipboard!');
              break;
      }
      contextMenuTargetSong = null;
  };

  window.openArtistDetailView = async function(artistId) {
      if (!artistId || artistId === 'null') {
          showToast('error', 'Navigation', 'Artist information not available.');
          return;
      }
      showSection('artist-view');
      try {
          const res = await authenticatedFetch(`/artist/details?name=${encodeURIComponent(artistId)}&artistId=${encodeURIComponent(artistId)}`);
          if (!res.ok) throw new Error('Failed to fetch artist');
          const data = await res.json();
          
          // 1. Hero Banner
          const heroBg = document.getElementById('artistHeroBg');
          if (heroBg) {
              const bgUrl = data.bannerUrl || data.profileUrl || '';
              if (bgUrl) {
                  heroBg.style.backgroundImage = `url('${bgUrl}')`;
              } else {
                  heroBg.style.backgroundImage = 'none';
                  heroBg.style.backgroundColor = '#222';
              }
          }
          
          const verifiedEl = document.getElementById('artistViewVerified');
          if (verifiedEl) {
              verifiedEl.hidden = !data.verified;
          }
          
          document.getElementById('artistViewName').textContent = data.name;
          document.getElementById('artistViewListeners').textContent = (data.monthlyListeners || 688312).toLocaleString() + ' monthly listeners';
          
          currentArtistContext = { name: data.name, songs: data.popularSongs || [] };
          currentViewedPlaylist = null;
          window.playArtistTrack = function(idx) {
              if (currentArtistContext && currentArtistContext.songs && currentArtistContext.songs.length) {
                  playPlaylistContext(currentArtistContext, idx);
              }
          };
          
          // 2. Action Bar
          const artistPlayBtn = document.getElementById('artistPlayBtn');
          if (artistPlayBtn) {
            artistPlayBtn.onclick = function() {
              if (currentArtistContext && currentArtistContext.songs.length) {
                playPlaylistContext(currentArtistContext, 0);
              }
            };
          }

          const followBtn = document.getElementById('artistFollowBtn');
          if (followBtn) {
              followBtn.onclick = function() {
                  const isFollowing = followBtn.classList.contains('following');
                  if (!isFollowing) {
                      followBtn.classList.add('following');
                      followBtn.textContent = 'Following';
                      showToast('success', 'Following Artist', `You are now following ${data.name}!`);
                  } else {
                      followBtn.classList.remove('following');
                      followBtn.textContent = 'Follow';
                      showToast('info', 'Unfollowed Artist', `You unfollowed ${data.name}.`);
                  }
              };
          }

          const moreBtn = document.getElementById('artistMoreBtn');
          if (moreBtn) {
              moreBtn.onclick = function(e) {
                  e.stopPropagation();
                  showToast('info', data.name, 'Artist options menu');
              };
          }

          // 3. Popular Tracks Table
          const popularContainer = document.getElementById('artistPopularTracks');
          const seeMoreBtn = document.getElementById('artistShowMorePopularBtn');
          let popularExpanded = false;

          function renderPopularRows() {
              if (!data.popularSongs || data.popularSongs.length === 0) {
                  popularContainer.innerHTML = '<div style="color:#b3b3b3; padding: 12px 16px;">No popular tracks found.</div>';
                  if (seeMoreBtn) seeMoreBtn.style.display = 'none';
                  return;
              }

              const visibleSongs = popularExpanded ? data.popularSongs : data.popularSongs.slice(0, 5);
              const curTrack = getCurrentQueue()[currentTrackIndex];
              const isCurrentPlayingArtist = currentArtistContext && currentArtistContext.name === data.name;

              popularContainer.innerHTML = visibleSongs.map((s, idx) => {
                  const isTrackActive = isCurrentPlayingArtist && curTrack && (curTrack.id === s.id || curTrack.title === s.title);
                  const isLiked = typeof isTrackLiked === 'function' ? isTrackLiked(s) : false;
                  const playsFormatted = (s.playCount || 0).toLocaleString();
                  const durationSec = s.duration || 180;
                  const durationStr = formatTime(durationSec);
                  const collabText = s.collabArtists ? `${s.collabArtists}, ${data.name}` : (s.artist || data.name);

                  return `
                      <div class="spotify-track-row ${isTrackActive ? 'is-active' : ''}" 
                           onclick="window.playArtistTrack(${idx})"
                           data-song-idx="${idx}">
                          <div class="track-index-col">
                              <span class="track-index-number">${idx + 1}</span>
                              <span class="track-index-play">▶</span>
                          </div>
                          <div class="track-main-col">
                              <img class="track-thumb-img" src="${s.coverUrl || 'https://via.placeholder.com/44'}" alt="art" onerror="this.src='https://via.placeholder.com/44'">
                              <div class="track-meta-stack">
                                  <div class="track-title-text" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</div>
                                  <div class="track-artist-subtext" title="${escapeHtml(collabText)}">${escapeHtml(collabText)}</div>
                              </div>
                          </div>
                          <div class="track-plays-col">${playsFormatted}</div>
                          <div class="track-actions-col">
                              <button class="track-row-heart-btn ${isLiked ? 'is-liked' : ''}" 
                                      title="Save to Liked Songs" 
                                      onclick="event.stopPropagation(); if (window.trackMenuAction) { contextMenuTargetSong = { fileName: '${escapeHtml(s.fileName)}', songId: '${escapeHtml(s.id)}' }; trackMenuAction('save-to-liked'); this.classList.toggle('is-liked'); }">
                                  <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                  </svg>
                              </button>
                              <span class="track-duration-text">${durationStr}</span>
                              <button class="track-row-more-btn" title="More options" onclick="event.stopPropagation(); openTrackMenu(event, '${escapeHtml(s.fileName)}', '${escapeHtml(s.id)}', '', '${escapeHtml(data.id)}')">
                                  <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                                  </svg>
                              </button>
                          </div>
                      </div>
                  `;
              }).join('');

              if (seeMoreBtn) {
                  if (data.popularSongs.length > 5) {
                      seeMoreBtn.style.display = 'inline-block';
                      seeMoreBtn.textContent = popularExpanded ? 'Show less' : 'See more';
                  } else {
                      seeMoreBtn.style.display = 'none';
                  }
              }
          }

          renderPopularRows();

          if (seeMoreBtn) {
              seeMoreBtn.onclick = function() {
                  popularExpanded = !popularExpanded;
                  renderPopularRows();
              };
          }

          // 4. Discography Section with Live Filtering
          const discoContainer = document.getElementById('artistDiscography');
          const filterChips = document.querySelectorAll('#discographyFilterChips .disco-filter-chip');
          let currentFilter = 'popular';

          function renderDiscography(filter) {
              if (!data.discography || data.discography.length === 0) {
                  discoContainer.innerHTML = '<div style="color:#b3b3b3; padding: 12px 16px;">No releases found.</div>';
                  return;
              }

              let filtered = data.discography;
              if (filter === 'albums') {
                  filtered = data.discography.filter(a => String(a.type).toLowerCase() === 'album');
              } else if (filter === 'singles') {
                  filtered = data.discography.filter(a => {
                      const t = String(a.type).toLowerCase();
                      return t === 'single' || t === 'ep';
                  });
              }

              if (filtered.length === 0) {
                  discoContainer.innerHTML = `<div style="color:#b3b3b3; padding: 12px 16px;">No ${filter} found for this artist.</div>`;
                  return;
              }

              discoContainer.innerHTML = filtered.map(a => {
                  const subtitleText = (a.isLatest ? 'Latest Release • ' : '') + `${a.year || '2024'} • ${a.type || 'Album'}`;
                  return `
                      <div class="spotify-release-card" onclick="window.openAlbumDetailView('${escapeHtml(a.id)}')">
                          <div class="release-img-wrap">
                              <img src="${a.coverUrl || 'https://via.placeholder.com/180'}" alt="${escapeHtml(a.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/180'">
                              <button class="release-floating-play" title="Play ${escapeHtml(a.title)}" onclick="event.stopPropagation(); if (window.openAlbumDetailView) { window.openAlbumDetailView('${escapeHtml(a.id)}'); }">
                                  <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                                  </svg>
                              </button>
                          </div>
                          <div class="release-card-title" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</div>
                          <div class="release-card-sub">${escapeHtml(subtitleText)}</div>
                      </div>
                  `;
              }).join('');
          }

          renderDiscography(currentFilter);

          filterChips.forEach(chip => {
              chip.onclick = function() {
                  filterChips.forEach(c => c.classList.remove('active'));
                  chip.classList.add('active');
                  currentFilter = chip.getAttribute('data-filter') || 'popular';
                  renderDiscography(currentFilter);
              };
          });

          const showAllBtn = document.getElementById('artistDiscographyShowAllBtn');
          if (showAllBtn) {
              showAllBtn.onclick = function() {
                  filterChips.forEach(c => c.classList.remove('active'));
                  const popChip = document.querySelector('#discographyFilterChips [data-filter="popular"]');
                  if (popChip) popChip.classList.add('active');
                  renderDiscography('popular');
              };
          }

          // 5. Featuring Section
          const featSection = document.getElementById('artistFeaturingSection');
          const featGrid = document.getElementById('artistFeaturingGrid');
          const featTitle = document.getElementById('artistFeaturingTitle');

          if (featTitle) featTitle.textContent = `Featuring ${data.name}`;

          if (data.featuring && data.featuring.length > 0 && featGrid) {
              featSection.style.display = 'block';
              featGrid.innerHTML = data.featuring.map(f => `
                  <div class="spotify-release-card" onclick="if (currentArtistContext && currentArtistContext.songs.length) { playPlaylistContext(currentArtistContext, 0); }">
                      <div class="release-img-wrap">
                          <img src="${f.coverUrl || 'https://via.placeholder.com/180'}" alt="${escapeHtml(f.title)}" loading="lazy">
                          <button class="release-floating-play" title="Play ${escapeHtml(f.title)}">
                              <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                              </svg>
                          </button>
                      </div>
                      <div class="release-card-title">${escapeHtml(f.title)}</div>
                      <div class="release-card-sub">${escapeHtml(f.desc || 'Playlist')}</div>
                  </div>
              `).join('');
          } else if (featSection) {
              featSection.style.display = 'none';
          }

          // 6. Fans Also Like (Related Artists) Section
          const relSection = document.getElementById('artistRelatedSection');
          const relGrid = document.getElementById('artistRelatedGrid');

          if (data.relatedArtists && data.relatedArtists.length > 0 && relGrid) {
              relSection.style.display = 'block';
              relGrid.innerHTML = data.relatedArtists.map(ra => `
                  <div class="spotify-circle-card" onclick="window.openArtistDetailView('${escapeHtml(ra.name || ra.id)}')">
                      <div class="circle-img-wrap">
                          <img src="${ra.profileUrl || 'https://via.placeholder.com/170'}" alt="${escapeHtml(ra.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/170'">
                          <button class="release-floating-play" title="Play ${escapeHtml(ra.name)}" onclick="event.stopPropagation(); window.openArtistDetailView('${escapeHtml(ra.name || ra.id)}');">
                              <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                              </svg>
                          </button>
                      </div>
                      <div class="release-card-title">${escapeHtml(ra.name)}</div>
                      <div class="release-card-sub">Artist</div>
                  </div>
              `).join('');
          } else if (relSection) {
              relSection.style.display = 'none';
          }

          // 7. About Section
          const aboutBg = document.getElementById('artistAboutBg');
          const aboutListeners = document.getElementById('artistAboutListeners');
          const aboutBio = document.getElementById('artistAboutBio');

          if (aboutBg) {
              const abPhoto = data.about?.bannerUrl || data.bannerUrl || data.profileUrl || '';
              if (abPhoto) {
                  aboutBg.style.backgroundImage = `url('${abPhoto}')`;
              }
          }
          if (aboutListeners) {
              aboutListeners.textContent = (data.monthlyListeners || 688312).toLocaleString() + ' monthly listeners';
          }
          if (aboutBio) {
              aboutBio.textContent = data.about?.bio || `${data.name} is a celebrated recording artist.`;
          }

      } catch (err) {
          console.error(err);
          showToast('error', 'Error', 'Could not load artist details.');
      }
  };

  // Sidebar Add Menu Popover Controls
  window.toggleSidebarAddMenu = function(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('sidebarAddMenu');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  };

  window.hideSidebarAddMenu = function() {
    const menu = document.getElementById('sidebarAddMenu');
    if (menu) menu.style.display = 'none';
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#sidebarAddMenu') && !e.target.closest('#quickCreatePlaylistBtn')) {
      window.hideSidebarAddMenu();
    }
  });

  // Modern Playlist Manager: Real-time search and add songs
  window.filterPlaylistSongAdd = function(query) {
    const resultsContainer = document.getElementById('playlistSongSearchResults');
    if (!resultsContainer) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      return;
    }
    const selected = getSelectedPlaylist();
    if (!selected) {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = '<div style="padding: 10px; font-size: 13px; color: #b3b3b3;">Please select a playlist on the left first.</div>';
      return;
    }
    const existingFileNames = new Set((selected.songs || []).map(s => s.fileName || s.id));
    const matches = (tracks || []).filter(t => 
      ((t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q))
    ).slice(0, 10);

    if (!matches.length) {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = '<div style="padding: 10px; font-size: 13px; color: #b3b3b3;">No songs found matching "' + escapeHtml(q) + '"</div>';
      return;
    }

    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = matches.map(t => {
      const alreadyIn = existingFileNames.has(t.fileName) || existingFileNames.has(t.id);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 6px; transition: background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background='transparent'">
          <div style="flex: 1; min-width: 0; padding-right: 8px;">
            <div style="font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t.title)}</div>
            <div style="font-size: 11px; color: #b3b3b3;">${escapeHtml(t.artist)}</div>
          </div>
          ${alreadyIn ? `
            <span style="font-size: 11px; color: #1db954; font-weight: bold; padding: 4px 8px;">Added</span>
          ` : `
            <button type="button" class="primary-action" onclick="window.addSongFromSearch('${escapeHtml(t.fileName || t.id)}')" style="font-size: 11px; padding: 4px 12px; border-radius: 12px; height: auto;">+ Add</button>
          `}
        </div>
      `;
    }).join('');
  };

  window.addSongFromSearch = async function(fileName) {
    if (!selectedPlaylistId) {
      showToast('info', 'Playlist', 'Select a playlist first.');
      return;
    }
    try {
      await addSpecificSongToPlaylist(selectedPlaylistId, fileName);
      showToast('success', 'Added', 'Song added to playlist.');
      const searchInput = document.getElementById('playlistSongSearchInput');
      if (searchInput && searchInput.value) {
        filterPlaylistSongAdd(searchInput.value);
      }
    } catch(e) {
      showToast('error', 'Error', e.message || 'Could not add song.');
    }
  };

  // Run init on load
  initAllHomeSections();
  populateBrowseAll();
  
  // ==========================================
  // PREMIUM CHECKOUT & BILLING SYSTEM
  // ==========================================

  function updatePremiumUI(user) {
    const isPrem = !!(user && (user.isPremium || user.premium || user.subscriptionTier === 'Premium'));
    const premiumBtn = document.getElementById('explorePremiumBtn');
    const premiumBadge = document.getElementById('premiumBadge');

    if (premiumBtn) premiumBtn.style.display = isPrem ? 'none' : 'inline-flex';
    if (premiumBadge) premiumBadge.style.display = isPrem ? 'inline-flex' : 'none';

    // If lyrics are currently rendered, refresh them
    const lyricsSection = document.getElementById('lyrics-view');
    if (lyricsSection && !lyricsSection.classList.contains('hidden') && lyricsSection.style.display !== 'none') {
      renderLyrics();
    }
  }

  function openCheckoutModal(planType = 'Individual') {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.hidden = false;
    modal.classList.remove('modal-hidden');
    selectPlan(planType, planType === 'Duo' ? 6.99 : (planType === 'Family' ? 9.99 : 4.99));
    const err = document.getElementById('checkoutError');
    if (err) err.style.display = 'none';
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.hidden = true;
  }

  function selectPlan(plan, price) {
    selectedCheckoutPlan = plan;
    selectedCheckoutPrice = price;

    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById('plan' + plan);
    if (targetCard) targetCard.classList.add('active');

    const nameEl = document.getElementById('summaryPlanName');
    const priceEl = document.getElementById('summaryPlanPrice');
    const totalEl = document.getElementById('summaryTotal');
    const btnText = document.getElementById('checkoutBtnText');

    if (nameEl) nameEl.textContent = `Spotifake ${plan} Plan`;
    if (priceEl) priceEl.textContent = `$${price.toFixed(2)} / mo`;
    if (totalEl) totalEl.textContent = `$${price.toFixed(2)}`;
    if (btnText) btnText.textContent = `Complete Purchase • $${price.toFixed(2)}`;
  }

  function handleCardNumberInput(e) {
    let input = e.target;
    let digits = input.value.replace(/\D/g, '').substring(0, 16);
    let formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = formatted;

    const brand = detectCardBrand(digits);
    const brandLogo = document.getElementById('mockBrandLogo');
    const brandIndicator = document.getElementById('ccBrandIndicator');
    if (brandLogo) brandLogo.textContent = brand.toUpperCase();
    if (brandIndicator) {
      if (brand === 'Visa') brandIndicator.textContent = '💳 Visa';
      else if (brand === 'Mastercard') brandIndicator.textContent = '💳 MC';
      else if (brand === 'Amex') brandIndicator.textContent = '💳 Amex';
      else if (brand === 'Discover') brandIndicator.textContent = '💳 Disc';
      else brandIndicator.textContent = '💳';
    }

    const mockNum = document.getElementById('mockCardNumber');
    if (mockNum) {
      mockNum.textContent = formatted || '•••• •••• •••• ••••';
    }
  }

  function handleExpiryInput(e) {
    let input = e.target;
    let digits = input.value.replace(/\D/g, '').substring(0, 4);
    if (digits.length >= 2) {
      input.value = digits.substring(0, 2) + '/' + digits.substring(2);
    } else {
      input.value = digits;
    }
    const mockExp = document.getElementById('mockCardExpiry');
    if (mockExp) {
      mockExp.textContent = input.value || 'MM/YY';
    }
  }

  function updateCardMockup() {
    const nameInput = document.getElementById('ccName');
    const mockHolder = document.getElementById('mockCardHolder');
    if (mockHolder && nameInput) {
      mockHolder.textContent = nameInput.value.trim() ? nameInput.value.toUpperCase() : 'YOUR NAME';
    }
  }

  function detectCardBrand(digits) {
    if (!digits) return 'CARD';
    if (digits.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'Mastercard';
    if (/^(34|37)/.test(digits)) return 'Amex';
    if (/^(6011|65|64[4-9])/.test(digits)) return 'Discover';
    return 'Card';
  }

  function fillTestCard(type) {
    const nameInput = document.getElementById('ccName');
    const numInput = document.getElementById('ccNumber');
    const expInput = document.getElementById('ccExpiry');
    const cvcInput = document.getElementById('ccCvc');
    const zipInput = document.getElementById('ccZip');

    if (nameInput) nameInput.value = 'Jane Doe';
    if (expInput) expInput.value = '12/28';
    if (cvcInput) cvcInput.value = '123';
    if (zipInput) zipInput.value = '90210';

    if (type === 'decline_funds') {
      if (numInput) numInput.value = '4242 4242 4242 0002';
    } else if (type === 'decline_expired') {
      if (numInput) numInput.value = '4242 4242 4242 0003';
      if (expInput) expInput.value = '01/20';
    } else if (type === 'decline_fraud') {
      if (numInput) numInput.value = '4242 4242 4242 0004';
    } else {
      // Valid card
      if (numInput) numInput.value = '4242 4242 4242 4242';
    }

    if (numInput) handleCardNumberInput({ target: numInput });
    if (expInput) handleExpiryInput({ target: expInput });
    updateCardMockup();
  }

  async function handleCheckoutSubmit(e) {
    if (e) e.preventDefault();

    const submitBtn = document.getElementById('checkoutSubmitBtn');
    const spinner = document.getElementById('checkoutSpinner');
    const btnText = document.getElementById('checkoutBtnText');
    const errBox = document.getElementById('checkoutError');

    const name = document.getElementById('ccName')?.value || '';
    const number = document.getElementById('ccNumber')?.value || '';
    const expiry = document.getElementById('ccExpiry')?.value || '';
    const cvc = document.getElementById('ccCvc')?.value || '';
    const zip = document.getElementById('ccZip')?.value || '';

    if (errBox) { errBox.style.display = 'none'; errBox.textContent = ''; }
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';

    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = 'Bearer ' + authToken;
    }

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: headers,
        credentials: 'same-origin',
        body: JSON.stringify({
          planType: selectedCheckoutPlan,
          cardholderName: name,
          cardNumber: number,
          expiryDate: expiry,
          cvc: cvc,
          billingZip: zip,
          username: currentUser?.username || 'user_test'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        if (errBox) {
          errBox.textContent = data.message || 'Payment processing failed. Please check your card details.';
          errBox.style.display = 'block';
        }
        showToast('error', 'Payment Failed', data.message || 'Payment declined.');
        return;
      }

      // Success!
      if (data.token) {
        authToken = data.token;
        localStorage.setItem(authTokenKey, authToken);
      }
      if (data.user) {
        currentUser = data.user;
        localStorage.setItem(authUserKey, currentUser.username || '');
        localStorage.setItem(authRoleKey, currentUser.role || 'user');
      } else if (currentUser) {
        currentUser.isPremium = true;
        currentUser.subscriptionTier = 'Premium';
      }
      updatePremiumUI(currentUser);

      // Close checkout modal
      closeCheckoutModal();

      // Show receipt modal
      currentTransactionId = data.transactionId || 'TX-SUCCESS';
      const rTx = document.getElementById('receiptTxId');
      const rPlan = document.getElementById('receiptPlan');
      const rAmt = document.getElementById('receiptAmount');
      const rCard = document.getElementById('receiptCard');
      const rAuth = document.getElementById('receiptAuth');

      if (rTx) rTx.textContent = '#' + currentTransactionId;
      if (rPlan) rPlan.textContent = `${data.planType} ($${data.amount.toFixed(2)}/mo)`;
      if (rAmt) rAmt.textContent = `$${data.amount.toFixed(2)}`;
      if (rCard) rCard.textContent = `${data.cardBrand} •••• ${data.cardLast4}`;
      if (rAuth) rAuth.textContent = data.authCode || 'AUTH-OK';

      const receiptModal = document.getElementById('receiptModal');
      if (receiptModal) {
        receiptModal.style.display = 'flex';
        receiptModal.hidden = false;
        receiptModal.classList.remove('modal-hidden');
      }

      showToast('success', 'Upgraded to Premium!', 'Enjoy unlimited skips and ad-free listening.');
    } catch (err) {
      if (errBox) {
        errBox.textContent = 'Network or server error during checkout: ' + err.message;
        errBox.style.display = 'block';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (spinner) spinner.style.display = 'none';
    }
  }

  function openPrintableReceipt() {
    if (!currentTransactionId) return;
    window.open('/api/subscription/receipt/' + encodeURIComponent(currentTransactionId), '_blank');
  }

  function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) {
      modal.style.display = 'none';
      modal.hidden = true;
    }
  }

  // Bind to window for HTML event handlers
  window.updatePremiumUI = updatePremiumUI;
  window.openCheckoutModal = openCheckoutModal;
  window.closeCheckoutModal = closeCheckoutModal;
  window.selectPlan = selectPlan;
  window.handleCardNumberInput = handleCardNumberInput;
  window.handleExpiryInput = handleExpiryInput;
  window.updateCardMockup = updateCardMockup;
  window.fillTestCard = fillTestCard;
  window.handleCheckoutSubmit = handleCheckoutSubmit;
  window.openPrintableReceipt = openPrintableReceipt;
  window.closeReceiptModal = closeReceiptModal;

  // Set Right Panel default state to "Now Playing"
  if (rightSidePanel) {
      rightSidePanel.hidden = false;
      if (typeof appShell !== 'undefined' && appShell) appShell.classList.add('right-panel-active');
      if (rightPanelNowPlayingView) rightPanelNowPlayingView.hidden = false;
      if (rightPanelQueueView) rightPanelQueueView.hidden = true;
      if (rightPanelContextTitle) rightPanelContextTitle.textContent = 'Now Playing';
      currentRightPanelMode = 'nowplaying';
  }
});
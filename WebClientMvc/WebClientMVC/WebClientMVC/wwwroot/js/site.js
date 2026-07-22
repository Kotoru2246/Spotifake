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

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const demoUsers = {
    user: { username: 'user_test', password: 'User@123', roleName: 'User' },
    artist: { username: 'artist_test', password: 'Artist@123', roleName: 'Artist' },
    admin: { username: 'admin_test', password: 'Admin@123', roleName: 'Admin' },
  };

  window.fillCredentials = function (username, password, role) {
    if (usernameInput) usernameInput.value = username;
    if (passwordInput) passwordInput.value = password;
    if (accountType) accountType.value = role;
  };

  let tracks = [];
  let currentTrackIndex = 0;
  let isPlaying = false;
  let shuffleEnabled = false;
  let loopMode = 'off';
  let uploadedTrackUrls = [];
  let authToken = localStorage.getItem(authTokenKey) || '';
  let currentAuthRole = localStorage.getItem(authRoleKey) || '';
  let queueOrder = [];
  let lastReportedListenFileName = '';
  let userPlaylists = [];
  let selectedPlaylistId = '';
  let pendingAddSongFileName = '';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeBackendSong(song) {
    const title = song.title || 'Untitled Track';
    return {
      id: song.id,
      title: title,
      artist: song.artist || 'Unknown Artist',
      album: song.album || 'Single',
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
      duration: Math.round((song.duration_ms || 0) / 1000),
      fileName: song.file_path || '',
      id: song.id,
      Id: song.id,
    };
  }


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
    } else {
      localStorage.removeItem(authTokenKey);
      localStorage.removeItem(authUserKey);
      localStorage.removeItem(authRoleKey);
    }
  }

  function setAuthPanelMode(mode) {
    const isSignup = mode === 'signup';
    if (authPanelTitle) authPanelTitle.textContent = isSignup ? 'Sign up' : 'Sign in';
    if (authPanelSubtitle) authPanelSubtitle.textContent = isSignup
      ? 'Demo mode uses the accounts below. Full signup is not connected yet.'
      : 'Use a demo account to unlock uploads and imports.';
    if (signupNote) signupNote.hidden = !isSignup;
    if (credentialsBox) credentialsBox.hidden = false;
  }

  function setAuthPanelOpen(isOpen, mode = 'login') {
    if (!authPanel || !loginGate) return;
    setAuthPanelMode(mode);
    loginGate.hidden = !isOpen;
  }

  function setAdminVisibility(role) {
    const isAdmin = String(role || '').toLowerCase() === 'admin';
    if (adminNavLink) {
      adminNavLink.hidden = !isAdmin;
    }

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
      option.value = track.fileName || '';
      option.textContent = `${track.title} - ${track.artist}`;
      playlistSongSelect.appendChild(option);
    });
  }

  function renderCreatePlaylistSongsOptions() {
    if (!createPlaylistSongs) return;

    createPlaylistSongs.innerHTML = '';
    tracks.forEach((track) => {
      const option = document.createElement('option');
      option.value = track.fileName || '';
      option.textContent = `${track.title} - ${track.artist}`;
      createPlaylistSongs.appendChild(option);
    });
  }

  function setModalOpen(modal, isOpen) {
    if (!modal) return;
    modal.hidden = !isOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function openCreatePlaylistModal() {
    if (!canManagePlaylists()) {
      if (playlistStatus) playlistStatus.textContent = 'Sign in first to create playlists.';
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

  function openAddSongToPlaylistModal(fileName) {
    if (!canManagePlaylists()) {
      if (playlistStatus) playlistStatus.textContent = 'Sign in first to manage playlists.';
      return;
    }

    if (!userPlaylists.length) {
      if (playlistStatus) playlistStatus.textContent = 'Create a playlist first before adding songs.';
      return;
    }

    pendingAddSongFileName = fileName;
    const track = tracks.find((item) => item.fileName === fileName);
    if (addSongModalTrackLabel) {
      addSongModalTrackLabel.textContent = `Song: ${track?.title || fileName}`;
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

    if (!selected) {
      playlistSongsList.innerHTML = '<div class="admin-empty-state">Select a playlist to view and manage songs.</div>';
      return;
    }

    if (!selected.songs.length) {
      playlistSongsList.innerHTML = '<div class="admin-empty-state">This playlist has no songs yet.</div>';
      return;
    }

    playlistSongsList.innerHTML = selected.songs.map((song) => `
      <article class="admin-list-item">
        <div class="admin-item-main">
          <div class="admin-item-title">${escapeHtml(song.displayName || song.fileName)}</div>
          <div class="admin-item-meta">${escapeHtml(song.artist || 'Unknown Artist')} • ${escapeHtml(song.fileName || '')}</div>
        </div>
        <button type="button" class="secondary-action" data-remove-song="${encodeURIComponent(song.fileName || '')}">Remove Song</button>
      </article>
    `).join('');
  }

  function renderUserPlaylists() {
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

    userPlaylistList.innerHTML = userPlaylists.map((playlist) => `
      <article class="admin-list-item">
        <div class="admin-item-main">
          <div class="admin-item-header">
            <div class="admin-item-title">${escapeHtml(playlist.name)}</div>
            <span class="admin-badge is-featured">${escapeHtml(playlist.songs.length)} songs</span>
          </div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="secondary-action" data-open-playlist="${escapeHtml(playlist.id)}">Open</button>
          <button type="button" class="secondary-action danger-action" data-delete-playlist="${escapeHtml(playlist.id)}">Delete</button>
        </div>
      </article>
    `).join('');

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
        playerTrack.onclick = () => { if(window.openWaveformView) window.openWaveformView(track); };
    }
    if (playerArtist) {
        playerArtist.textContent = artist;
    }
    
    // Right Side Panel "Now Playing" view elements
    const rightPanelTrackTitle = document.getElementById('rightPanelTrackTitle');
    const rightPanelTrackArtist = document.getElementById('rightPanelTrackArtist');
    if (rightPanelTrackTitle) {
        rightPanelTrackTitle.textContent = title;
        rightPanelTrackTitle.style.cursor = 'pointer';
        rightPanelTrackTitle.style.textDecoration = 'underline';
        rightPanelTrackTitle.onclick = () => { if(window.openWaveformView) window.openWaveformView(track); };
    }
    if (rightPanelTrackArtist) rightPanelTrackArtist.textContent = artist;
    if (miniArt) miniArt.textContent = track.color || 'AI';
    const albumArtBadge = document.getElementById('albumArtBadge');
    if (albumArtBadge) albumArtBadge.textContent = track.color || '♪';
    if (albumArt) {
      const accentColor = track.accent || '#1db954';
      albumArt.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), transparent 28%), linear-gradient(145deg, ${accentColor}, #101010 68%, #202020 100%)`;
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

      const items = await response.json();
      tracks = items.map(normalizeBackendSong);
      renderPlaylistSongOptions();
      renderQueue();
      renderLibraryGrid();

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
      section.classList.toggle('active', section.id === sectionId);
    });

    sidebarLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });

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
      shuffleButton.classList.toggle('active', shuffleEnabled);
      shuffleButton.setAttribute('aria-label', shuffleEnabled ? 'Shuffle on' : 'Shuffle off');
    }

    if (loopButton) {
      const loopLabel = loopMode === 'off' ? 'Loop off' : loopMode === 'track' ? 'Loop track' : 'Loop playlist';
      loopButton.textContent = '↻';
      loopButton.setAttribute('aria-label', loopLabel);
      loopButton.classList.toggle('active', loopMode !== 'off');
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
  }

  function buildQueueOrder() {
    if (!tracks.length) {
      queueOrder = [];
      return;
    }

    if (!shuffleEnabled) {
      queueOrder = Array.from({ length: tracks.length }, (_, index) => index);
      return;
    }

    const rest = Array.from({ length: tracks.length }, (_, index) => index)
      .filter((index) => index !== currentTrackIndex);

    for (let index = rest.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
    }

    queueOrder = [currentTrackIndex, ...rest];
  }

  function getQueuePosition(trackIndex) {
    return queueOrder.indexOf(trackIndex);
  }

  function renderQueue() {
    if (!queueList) return;

    if (!queueOrder.length || queueOrder.length !== tracks.length) {
      buildQueueOrder();
    }

    queueList.innerHTML = '';
    queueOrder.forEach((trackIndex) => {
      const track = tracks[trackIndex];
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'queue-item';
      item.dataset.trackIndex = String(trackIndex);
      item.innerHTML = `
        <div class="queue-thumb">${track.color}</div>
        <div>
          <div class="queue-title">${track.title}</div>
          <div class="queue-meta">${track.artist}</div>
        </div>
        <div class="queue-meta">${track.duration ? formatTime(track.duration) : 'Play'}</div>
      `;
      item.addEventListener('click', () => loadTrack(trackIndex, true));
      queueList.appendChild(item);
    });

    updateActiveQueueItem();
  }

  function updateActiveQueueItem() {
    const items = Array.from(document.querySelectorAll('.queue-item'));
    items.forEach((item) => {
      const trackIndex = Number(item.dataset.trackIndex);
      const active = trackIndex === currentTrackIndex;
      item.classList.toggle('active', active);
      const timeCell = item.querySelector('.queue-meta:last-child');
      if (timeCell) timeCell.textContent = active && isPlaying ? 'Now playing' : formatTime(tracks[trackIndex].duration || 0);
    });
  }

  function renderLibraryGrid() {
    if (!playlistGrid) return;

    playlistGrid.innerHTML = '';
    tracks.forEach((track, index) => {
      const row = document.createElement('article');
      row.className = 'song-row';
      row.innerHTML = `
        <div class="song-row-thumb">${track.color}</div>
        <div class="song-row-main">
          <div class="song-row-title">${track.title}</div>
          <div class="song-row-artist">${track.artist}</div>
        </div>
        <div class="song-row-meta">${track.playlist}</div>
        <div class="song-row-actions">
          <button type="button" class="secondary-action" data-song-play="${index}">Play</button>
          <button type="button" class="secondary-action" data-song-add="${encodeURIComponent(track.fileName || '')}">+ Add To Playlist</button>
        </div>
      `;
      playlistGrid.appendChild(row);
    });
  }

  function renderBrowseGrid() {
    if (!browsePlaylistGrid) return;

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
    if (!tracks.length) return;

    currentTrackIndex = (index + tracks.length) % tracks.length;
    lastReportedListenFileName = '';
    const track = tracks[currentTrackIndex];
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
    
    if (window.initializeWaveform) {
        window.initializeWaveform(track);
    }
  }

  function togglePlay() {
    if (!audioPlayer || !tracks.length) return;

    if (audioPlayer.paused) {
      audioPlayer.play().catch(() => { });
    } else {
      audioPlayer.pause();
    }
  }

  function toggleShuffle() {
    shuffleEnabled = !shuffleEnabled;
    buildQueueOrder();
    updateTransportUI();
    renderQueue();
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
      setLoopMode('track');
    } else if (loopMode === 'track') {
      setLoopMode('playlist');
    } else {
      setLoopMode('off');
    }
  }

  function previousTrack() {
    if (!tracks.length) return;
    if (audioPlayer && audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
      return;
    }

    if (shuffleEnabled && queueOrder.length) {
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
      ? (loopMode === 'playlist' ? tracks.length - 1 : 0)
      : currentTrackIndex - 1;
    loadTrack(nextIndex, true);
    renderQueue();
  }

  function nextTrack() {
    if (!tracks.length) return;

    let nextIndex;
    if (shuffleEnabled) {
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
    } else if (currentTrackIndex >= tracks.length - 1) {
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
    if (loopMode === 'track') {
      if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play().catch(() => { });
      }
      return;
    }

    if (shuffleEnabled) {
      nextTrack();
      return;
    }

    if (currentTrackIndex < tracks.length - 1) {
      nextTrack();
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
      const roleKey = String(accountType?.value || 'user').toLowerCase();
      const username = String(usernameInput?.value || '').trim();
      const password = String(passwordInput?.value || '');
      const demo = demoUsers[roleKey];

      if (!demo || demo.username !== username || demo.password !== password) {
        if (loginError) loginError.textContent = 'Invalid demo credentials. Use the username and password shown above.';
        if (loginStatus) loginStatus.textContent = '';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: roleKey,
        }),
      });


      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (loginError) loginError.textContent = payload.detail || 'Login failed.';
        if (loginStatus) loginStatus.textContent = '';
        return;
      }

      saveAuthSession(payload.access_token, payload.username, payload.role);
      updateLoginState(demo.roleName, username);
      if (payload.role === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
      }
      showSection('home');

      if (importStatus) {
        importStatus.textContent = 'You are signed in. Upload and import are now enabled.';
      }

      await refreshLibrary();
      await loadUserPlaylists().catch(() => { });
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
        if (newTrackIndex !== -1) loadTrack(newTrackIndex, true);
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

      const openBtn = target.closest('[data-open-playlist]');
      if (openBtn) {
        selectedPlaylistId = String(openBtn.getAttribute('data-open-playlist') || '');
        renderUserPlaylists();
        return;
      }

      const deleteBtn = target.closest('[data-delete-playlist]');
      if (deleteBtn) {
        try {
          await deletePlaylist(String(deleteBtn.getAttribute('data-delete-playlist') || ''));
        } catch (error) {
          if (playlistStatus) playlistStatus.textContent = error.message;
        }
      }
    });
  }

  if (playlistSongsList) {
    playlistSongsList.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
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
        if (Number.isFinite(index)) {
          loadTrack(index, true);
        }
        return;
      }

      const addBtn = target.closest('[data-song-add]');
      if (addBtn) {
        const fileName = decodeURIComponent(addBtn.getAttribute('data-song-add') || '');
        openAddSongToPlaylistModal(fileName);
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
      reportTrackListen(tracks[currentTrackIndex]).catch(() => { });
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
    const storedUser = localStorage.getItem(authUserKey) || 'user_test';
    const storedRole = localStorage.getItem(authRoleKey) || 'user';
    updateAuthChrome(storedUser, storedRole.charAt(0).toUpperCase() + storedRole.slice(1), true);
    setAdminVisibility(storedRole);
    loadUserPlaylists().catch(() => { });
  } else {
    updateAuthChrome('', '', false);
    setAdminVisibility('');
    setAuthPanelOpen(true, 'login');
  }

  refreshLibrary().catch(() => {
    seedDemoTracks();
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
    
    if (query.length < 2) {
      dropdown.hidden = true;
      return;
    }
    
    const results = tracks.filter(t => 
      t.Title.toLowerCase().includes(query) || 
      t.Artist.toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (results.length === 0) {
      dropdown.hidden = true;
      return;
    }
    
    dropdown.innerHTML = results.map(t => `
      <div class="search-dropdown-item" onclick="document.getElementById('searchInput').value='${t.Title.replace(/'/g, "\\'")}'; window.handleSearchSubmit({key: 'Enter'});">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.Artist)}&background=random&color=fff" alt="art">
        <div>
          <div style="font-weight: 500;">${t.Title}</div>
          <div style="font-size: 13px; color: var(--muted);">${t.Artist}</div>
        </div>
      </div>
    `).join('');
    dropdown.hidden = false;
  };

  window.handleSearchSubmit = function(event) {
    if (event.key === 'Enter') {
      const query = document.getElementById('searchInput').value.toLowerCase();
      document.getElementById('searchDropdown').hidden = true;
      if(!query) return;
      
      const results = tracks.filter(t => 
        t.Title.toLowerCase().includes(query) || 
        t.Artist.toLowerCase().includes(query)
      );
      
      showSection('search-results');
      
      const topResultCard = document.getElementById('topResultCard');
      const songsList = document.getElementById('searchSongsList');
      
      if(results.length > 0) {
        const top = results[0];
        topResultCard.innerHTML = `
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(top.Artist)}&background=random&color=fff&size=128" alt="art">
          <h1>${top.Title}</h1>
          <div style="color: var(--muted); font-size: 14px; font-weight: 500;">${top.Artist}</div>
          <div class="badge">Song</div>
          <div class="quick-card-play" style="opacity: 1; bottom: 20px;" onclick="loadTrack(${tracks.indexOf(top)}, true)">▶</div>
        `;
        
        songsList.innerHTML = results.slice(0, 4).map(t => `
          <div class="song-row" style="grid-template-columns: 50px minmax(0, 1fr) auto; border: none; background: transparent; padding: 8px; border-radius: 4px; cursor: pointer;" onclick="loadTrack(${tracks.indexOf(t)}, true)">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.Artist)}&background=random&color=fff" width="40" height="40" style="border-radius: 4px;">
            <div>
              <div style="font-weight: 500; color: #fff;">${t.Title}</div>
              <div style="font-size: 13px; color: var(--muted);">${t.Artist}</div>
            </div>
            <div style="color: var(--muted); font-size: 14px;">${window.formatTime ? window.formatTime(t.Duration) : '0:00'}</div>
          </div>
        `).join('');
      } else {
        topResultCard.innerHTML = `<h2>No results found for "${query}"</h2>`;
        songsList.innerHTML = '';
      }
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
  
  function renderLyrics() {
    const activeTrack = tracks[currentTrackIndex];
    if(!activeTrack) return;
    const lyricsContainer = document.getElementById('lyricsTextContainer');
    if(lyricsContainer) {
      lyricsContainer.innerHTML = '';
      const line = document.createElement('div');
      line.className = 'lyric-line active';
      line.textContent = `♪ Synchronized lyrics for ${activeTrack.Title} coming soon ♪`;
      lyricsContainer.appendChild(line);
    }
  }

  function populateHomeGrid() {
    const grid = document.getElementById('homeQuickGrid');
    if(!grid) return;
    const items = ['Liked Songs', 'Daily Mix 1', 'Discover Weekly', 'Release Radar', 'On Repeat', 'Time Capsule', 'Your Top Songs 2026', 'Jazz Vibes'];
    grid.innerHTML = items.map(title => `
      <div class="quick-card">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random&color=fff&size=64" alt="art">
        <div class="quick-card-title">${title}</div>
        <div class="quick-card-play">▶</div>
      </div>
    `).join('');
  }

  function populateMadeForYou() {
    const carousel = document.getElementById('homeMadeForYouCarousel');
    if(!carousel) return;
    const mixes = [
      { title: 'Daily Mix 1', desc: 'Luna Waves, Neon Nights and more' },
      { title: 'Daily Mix 2', desc: 'Chill beats to study to' },
      { title: 'Daily Mix 3', desc: 'Upbeat pop hits' },
      { title: 'Discover Weekly', desc: 'New music based on your listening' }
    ];
    carousel.innerHTML = mixes.map(mix => `
      <div class="mix-card">
        <div class="mix-card-img-wrapper">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(mix.title)}&background=random&color=fff&size=300" alt="mix">
        </div>
        <div class="mix-card-title">${mix.title}</div>
        <div class="mix-card-desc">${mix.desc}</div>
      </div>
    `).join('');
  }

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

  // Waveform & Danmaku Logic
  let currentWaveformComments = [];
  let lastDanmakuTime = 0;
  let activeTrackId = null;
  
  window.openWaveformView = function(track) {
    if(!track) track = tracks[currentTrackIndex];
    if(!track) return;
    
    showSection('playlist-view');
    document.getElementById('pvTitle').textContent = track.Title || track.title || 'Unknown';
    document.getElementById('pvCreatorName').textContent = track.Artist || track.artist || 'Unknown';
    
    // Attempt to match album art background if it exists
    const pvCoverArt = document.getElementById('pvCoverArt');
    if (pvCoverArt) {
        pvCoverArt.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.Artist || track.artist)}&background=random&color=fff&size=300`;
    }
    
    window.initializeWaveform(track);
  };
  
  window.initializeWaveform = function(track) {
    // If it's a demo track, use its index as ID
    activeTrackId = track.Id || track.id || tracks.indexOf(track) || 1;
    
    let waveformContainer = document.getElementById('waveformContainer');
    const descriptionEl = document.getElementById('pvDescription');
    
    if (!waveformContainer && descriptionEl) {
        // Dynamically inject the HTML so we don't need a C# restart for the view
        waveformContainer = document.createElement('div');
        waveformContainer.className = 'waveform-container';
        waveformContainer.id = 'waveformContainer';
        waveformContainer.style.display = 'none';
        waveformContainer.innerHTML = `
            <div class="danmaku-layer" id="danmakuLayer"></div>
            <canvas id="waveformCanvas" width="800" height="80"></canvas>
            <div class="comment-input-popover" id="commentPopover" style="display: none;">
                <input type="text" id="commentInput" placeholder="Add a comment..." onkeypress="handleCommentSubmit(event)">
            </div>
        `;
        descriptionEl.parentNode.insertBefore(waveformContainer, descriptionEl.nextSibling);
    }
    
    if (waveformContainer && descriptionEl) {
      waveformContainer.style.display = 'block';
      descriptionEl.style.display = 'none';
      drawSimulatedWaveform();
      fetchTrackComments(activeTrackId);
      
      waveformContainer.onclick = (e) => {
        if(e.target.id === 'commentInput') return;
        const rect = waveformContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = clickX / rect.width;
        
        if (audioPlayer && audioPlayer.duration) {
            audioPlayer.currentTime = progress * audioPlayer.duration;
            drawSimulatedWaveform(progress);
        }
        
        // Hide comment box if left clicking to seek
        document.getElementById('commentPopover').style.display = 'none';
      };

      waveformContainer.oncontextmenu = (e) => {
        e.preventDefault(); // Prevent default browser right-click menu
        if(e.target.id === 'commentInput') return;
        
        const rect = waveformContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = clickX / rect.width;
        
        const popover = document.getElementById('commentPopover');
        popover.style.display = 'block';
        popover.style.left = `${Math.min(clickX, rect.width - 220)}px`;
        // Position it nicely in the middle vertically instead of off-screen
        popover.style.bottom = '20px'; 
        
        const input = document.getElementById('commentInput');
        input.dataset.timestamp = Math.floor(progress * (audioPlayer ? (audioPlayer.duration || track.Duration) : track.Duration) * 1000);
        input.focus();
      };
    }
  };

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function fetchRealAudioData(track) {
      if (track.isFetchingRealData || track.realAudioData) return;
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
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
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
    document.getElementById('danmakuLayer').innerHTML = ''; 
    
    fetch(`http://localhost:8000/songs/${songId}/comments`)
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
        
        const token = localStorage.getItem('spotifake.jwt');
        if (!token) {
            showToast('error', 'Authentication', 'Please log in to comment.');
            return;
        }

        fetch(`http://localhost:8000/songs/${activeTrackId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                song_id: activeTrackId,
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
            document.getElementById('commentPopover').style.display = 'none';
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

  // Run init on load
  populateHomeGrid();
  populateMadeForYou();
  populateBrowseAll();
  
  // Set Right Panel default state to "Now Playing"
  if(rightSidePanel) {
      rightSidePanel.hidden = false;
      appShell.classList.add('right-panel-active');
      rightPanelNowPlayingView.hidden = false;
      rightPanelQueueView.hidden = true;
      rightPanelContextTitle.textContent = 'Now Playing';
      currentRightPanelMode = 'nowplaying';
  }
});
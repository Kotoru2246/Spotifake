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

  const demoUsers = {
    user: { username: 'user_test', password: 'user123', roleName: 'User' },
    artist: { username: 'artist_test', password: 'artist123', roleName: 'Artist' },
    admin: { username: 'admin_test', password: 'admin123', roleName: 'Admin' },
  };

  const demoTracks = [
    { title: 'Midnight Dreams', artist: 'Luna Waves', playlist: 'Neon Nights', color: 'MD', frequencies: [196, 247, 330], accent: '#1db954' },
    { title: 'After Hours Drive', artist: 'Chrome Avenue', playlist: 'Roadtrip Mix', color: 'AH', frequencies: [220, 277, 349], accent: '#23c55e' },
    { title: 'Greenlight Pulse', artist: 'Soft Signal', playlist: 'Focus Flow', color: 'GP', frequencies: [174, 220, 262], accent: '#15b86d' },
    { title: 'Loop City', artist: 'Velvet Lines', playlist: 'Repeat Ready', color: 'LC', frequencies: [233, 294, 370], accent: '#19d36e' },
    { title: 'Static Bloom', artist: 'North Array', playlist: 'Fresh Finds', color: 'SB', frequencies: [208, 262, 311], accent: '#16a34a' },
  ];

  const browsePlaylists = [
    { name: 'Neon Nights', subtitle: 'Atmospheric pop and synth', badge: 'NN' },
    { name: 'Roadtrip Mix', subtitle: 'Driving beats and bright hooks', badge: 'RM' },
    { name: 'Focus Flow', subtitle: 'Soft layered loops for work', badge: 'FF' },
    { name: 'Repeat Ready', subtitle: 'Tracks built for looping', badge: 'RR' },
  ];

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

  function normalizeLibraryTrack(item) {
    const title = item.displayName || 'Untitled Track';
    return {
      title,
      artist: 'Local Library',
      playlist: 'C:\\Music',
      color: initials(title) || 'MU',
      accent: '#1db954',
      src: item.streamUrl,
      duration: 0,
      fileName: item.fileName,
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

  async function authenticatedFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async function refreshLibrary() {
    const response = await fetch('/music/library');
    if (!response.ok) {
      throw new Error('Unable to load music library.');
    }

    const items = await response.json();
    tracks = items.map(normalizeLibraryTrack);
    renderPlaylistSongOptions();

    renderQueue();
    renderLibraryGrid();

    if (tracks.length > 0) {
      currentTrackIndex = 0;
      setNowPlayingMeta(tracks[0]);
      loadTrack(0, false);
      if (libraryStatus) libraryStatus.textContent = `Loaded ${tracks.length} local song${tracks.length === 1 ? '' : 's'} from C:\Music.`;
    } else {
      if (libraryStatus) libraryStatus.textContent = 'No local songs were found in C:\Music.';
      if (sidebarTrackTitle) sidebarTrackTitle.textContent = 'No Local Songs';
      if (sidebarTrackArtist) sidebarTrackArtist.textContent = 'Add audio files to C:\Music';
      if (currentTrackTitle) currentTrackTitle.textContent = 'No Local Songs';
      if (currentTrackArtist) currentTrackArtist.textContent = 'Add audio files to C:\Music';
      if (currentPlaylistName) currentPlaylistName.textContent = 'Playlist: C:\Music';
      if (playerTrack) playerTrack.textContent = 'No Local Songs';
      if (playerArtist) playerArtist.textContent = 'Add audio files to C:\Music';
      if (miniArt) miniArt.textContent = 'MU';
      if (queueList) queueList.innerHTML = '';
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

  function setNowPlayingMeta(track) {
    if (!track) return;
    if (sidebarTrackTitle) sidebarTrackTitle.textContent = track.title;
    if (sidebarTrackArtist) sidebarTrackArtist.textContent = track.artist;
    if (currentTrackTitle) currentTrackTitle.textContent = track.title;
    if (currentTrackArtist) currentTrackArtist.textContent = track.artist;
    if (currentPlaylistName) currentPlaylistName.textContent = `Playlist: ${track.playlist}`;
    if (playerTrack) playerTrack.textContent = track.title;
    if (playerArtist) playerArtist.textContent = track.artist;
    if (miniArt) miniArt.textContent = track.color;
    if (albumArt) albumArt.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), transparent 28%), linear-gradient(145deg, ${track.accent}, #101010 68%, #202020 100%)`;
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
  }

  function togglePlay() {
    if (!audioPlayer || !tracks.length) return;

    if (audioPlayer.paused) {
      audioPlayer.play().catch(() => {});
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
        audioPlayer.play().catch(() => {});
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

      const response = await fetch('/auth/login', {
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
      await loadUserPlaylists().catch(() => {});
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
      reportTrackListen(tracks[currentTrackIndex]).catch(() => {});
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
    loadUserPlaylists().catch(() => {});
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
});
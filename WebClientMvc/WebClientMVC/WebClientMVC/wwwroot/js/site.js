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

  const API_BASE_URL = 'http://localhost:8000';

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

  let currentInspectedTrack = null;
  let tracks = [];
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
      artistId: song.artistId || song.ArtistId,
      albumId: song.albumId || song.AlbumId,
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
      const songFileName = typeof song === 'string' ? song : (song.fileName || song.title);
      const songTitle = typeof song === 'string' ? song.replace(/\.[^.]+$/, '') : (song.displayName || song.title || songFileName);
      
      const found = tracks.find(t => (t.fileName || t.title) === songFileName || (t.title && t.title === songTitle));
      if (found) {
        return found;
      }
      return {
        id: songFileName,
        title: songTitle,
        artist: typeof song === 'string' ? 'Artist' : (song.artist || 'Artist'),
        album: typeof song === 'string' ? 'Single' : (song.album || 'Single'),
        fileName: songFileName,
        src: `/music/stream?fileName=${encodeURIComponent(songFileName)}`,
        color: '🎵',
        duration: 0
      };
    });
  }

  function playPlaylistContext(playlist, startIndex = 0) {
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
      descEl.textContent = playlist.name === 'Liked Songs'
        ? 'Your favorite saved tracks'
        : (playlist.songs ? `${playlist.songs.length} song${playlist.songs.length === 1 ? '' : 's'}` : 'Playlist');
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
        pvCoverArt.src = playlist.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=random&color=fff&size=300`;
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
                const s = song.durationSeconds || 0;
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
            if (playlist.name === 'Liked Songs') {
                moreOptionsBtn.style.display = 'none'; // No options for Liked Songs
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
          const songFileName = typeof song === 'string' ? song : (song.fileName || song.title);
          const songTitle = typeof song === 'string' ? song.replace(/\.[^.]+$/, '') : (song.displayName || song.title || songFileName);
          const songArtist = typeof song === 'string' ? 'Artist' : (song.artist || 'Artist');
          const songAlbum = typeof song === 'string' ? 'Single' : (song.album || 'Single');

          return `
            <tr data-song-file="${escapeHtml(songFileName)}">
              <td class="col-index">
                <span class="index-num">${idx + 1}</span>
                <span class="index-play" onclick="playPlaylistTrack('${escapeHtml(songFileName)}', ${idx})">▶</span>
              </td>
              <td class="col-title">
                <div class="track-name-artist">
                  <div class="t-name">${escapeHtml(songTitle)}</div>
                  <div class="t-artist">${escapeHtml(songArtist)}</div>
                </div>
              </td>
              <td class="col-album">${escapeHtml(songAlbum)}</td>
              <td class="col-date">Recently</td>
              <td class="col-duration" style="padding-right: 16px;">
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 48px; width: 100%;">
                      <span>${formatTime((song.durationSeconds || 0) > 1000 ? (song.durationSeconds || 0) / 1000 : (song.durationSeconds || 0))}</span>
                      <button class="track-options-btn" style="background: transparent; border: none; color: #b3b3b3; font-size: 18px; cursor: pointer; display: flex; align-items: center;" onclick="openTrackMenu(event, '${escapeHtml(songFileName)}', '${escapeHtml(song.id || '')}', '${escapeHtml(song.albumId || '')}', '${escapeHtml(song.artistId || '')}')">...</button>
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
    if (currentViewedPlaylist) {
      playPlaylistContext(currentViewedPlaylist, typeof playlistIdx === 'number' && playlistIdx >= 0 ? playlistIdx : 0);
    } else {
      const foundIndex = tracks.findIndex(t => t.fileName === fileName || t.title === fileName);
      if (foundIndex !== -1) {
        activeQueue = [...tracks];
        currentQueueTitle = 'Library';
        buildQueueOrder();
        loadTrack(foundIndex, true);
        renderQueue();
      } else {
        showToast('info', 'Playback', `Playing ${fileName}`);
      }
    }
  };

  window.openPlaylistById = async function(playlistId) {
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
    const rightPanelMoreBtn = document.getElementById('rightPanelMoreOptionsBtn');
    if (rightPanelMoreBtn) {
        rightPanelMoreBtn.onclick = (e) => {
            if (window.openTrackMenu) {
                window.openTrackMenu(e, track.fileName || title, track.id || '', track.albumId || '', track.artistId || '');
            }
        };
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

      const data = await response.json();
      const songArray = Array.isArray(data) ? data : (data.songs || []);
      tracks = songArray.map(normalizeBackendSong);
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

    const rest = Array.from({ length: list.length }, (_, index) => index)
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
      item.className = 'queue-item';
      item.dataset.trackIndex = String(trackIndex);
      item.innerHTML = `
        <div class="queue-thumb">${track.color || '🎵'}</div>
        <div>
          <div class="queue-title">${escapeHtml(track.title || 'Unknown')}</div>
          <div class="queue-meta">${escapeHtml(track.artist || 'Unknown')}</div>
        </div>
        <div class="queue-meta">${track.duration ? formatTime(track.duration) : 'Play'}</div>
      `;
      item.addEventListener('click', () => loadTrack(trackIndex, true));
      queueList.appendChild(item);
    });

    updateActiveQueueItem();
  }

  function updateActiveQueueItem() {
    const list = getCurrentQueue();
    const items = Array.from(document.querySelectorAll('.queue-item'));
    items.forEach((item) => {
      const trackIndex = Number(item.dataset.trackIndex);
      const active = trackIndex === currentTrackIndex;
      item.classList.toggle('active', active);
      const timeCell = item.querySelector('.queue-meta:last-child');
      if (timeCell && list[trackIndex]) {
        timeCell.textContent = active && isPlaying ? 'Now playing' : formatTime(list[trackIndex].duration || 0);
      }
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
    const list = getCurrentQueue();
    if (!list.length) return;

    currentTrackIndex = (index + list.length) % list.length;
    lastReportedListenFileName = '';
    currentTrackPlayRecorded = false;
    const track = list[currentTrackIndex];
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
    const list = getCurrentQueue();
    if (!audioPlayer || !list.length) return;

    if (audioPlayer.paused) {
      audioPlayer.play().catch(() => { });
    } else {
      audioPlayer.pause();
    }
  }

  async function toggleShuffle() {
    if (shuffleMode === 'off') {
      shuffleMode = 'standard';
    } else if (shuffleMode === 'standard') {
      shuffleMode = 'smart';
      await runSmartShuffle();
    } else {
      shuffleMode = 'off';
    }
    buildQueueOrder();
    updateTransportUI();
    renderQueue();
  }

  async function runSmartShuffle() {
    const list = getCurrentQueue();
    if (!list || list.length === 0) return;
    try {
      showToast('info', 'Smart Shuffle', 'Fetching recommendations...');
      const songIds = list.map(t => t.songID).filter(id => id);
      if (songIds.length === 0) return;
      
      const response = await fetch('http://127.0.0.1:8000/api/smart-shuffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlist_song_ids: songIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.song_ids && data.song_ids.length > 0) {
          // Fetch full track details for the recommended IDs from C# backend
          const trackRes = await fetch('/api/music/tracks-by-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.song_ids)
          });
          
          if (trackRes.ok) {
            const newTracks = await trackRes.json();
            if (newTracks.length > 0) {
              if (activeQueue && activeQueue.length > 0) {
                activeQueue.push(...newTracks);
              } else {
                tracks.push(...newTracks);
              }
              showToast('success', 'Smart Shuffle Active', `Added ${newTracks.length} AI recommendations to the queue.`);
              buildQueueOrder();
              renderQueue();
            }
          }
        }
      } else {
        showToast('error', 'Smart Shuffle Failed', 'Failed to fetch recommendations.');
      }
    } catch(err) {
      console.error('Smart shuffle error:', err);
      showToast('error', 'Smart Shuffle Error', 'Could not connect to AI backend.');
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

  function nextTrack() {
    const list = getCurrentQueue();
    if (!list.length) return;

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
    const list = getCurrentQueue();
    if (loopMode === 'track') {
      if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play().catch(() => { });
      }
      return;
    }

    if (shuffleMode !== 'off') {
      nextTrack();
      return;
    }

    if (currentTrackIndex < list.length - 1) {
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
      
      const roleKey = String(accountType?.value || 'user').toLowerCase();
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

      const roleLabel = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
      const endpoint = isSignup ? `${API_BASE_URL}/auth/register` : `${API_BASE_URL}/auth/login`;

      const displayName = String(signupDisplayName?.value || '').trim() || username;
      const email = String(signupEmail?.value || '').trim() || `${username}@musicplayer.local`;

      const requestBody = isSignup ? {
        username,
        email,
        password,
        role: roleKey,
        display_name: displayName
      } : {
        username,
        password,
        role: roleKey
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
          if (loginError) loginError.textContent = payload.detail || (isSignup ? 'Registration failed.' : 'Login failed.');
          if (loginStatus) loginStatus.textContent = '';
          return;
        }

        const authenticatedUser = payload.username || username;
        const authenticatedRole = payload.role || roleKey;
        const authenticatedToken = payload.access_token;

        saveAuthSession(authenticatedToken, authenticatedUser, authenticatedRole);
        updateLoginState(roleLabel, authenticatedUser);

        if (authenticatedRole === 'admin') {
          window.location.href = '/admin/dashboard';
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
      <div class="search-dropdown-item" onclick="document.getElementById('searchInput').value=''; document.getElementById('searchDropdown').hidden=true; window.loadTrack(${idx}, true);">
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
          let results = data.items || [];
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
            topResultCard.innerHTML = `<h2 style="color:#fff;">No results found for "${query}"</h2>`;
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
      if (type === 'Song' && fileName) {
          const idx = tracks.findIndex(t => t.fileName === fileName);
          if(idx !== -1) {
              loadTrack(idx, true);
          } else {
              // Try to find it in the last search results
              let t = window.lastSearchResults ? window.lastSearchResults.find(x => x.id === id) : null;
              if (t) {
                  const mockTrack = {
                      id: fileName,
                      title: t.title || fileName,
                      artist: t.creator || 'Unknown',
                      album: 'Single',
                      coverArt: t.imageUrl || '',
                      fileName: fileName,
                      src: `/api/music/stream/${encodeURIComponent(fileName)}`,
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
                  body: JSON.stringify({ fileName: fileName })
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
    const btns = ['pvLikeBtn', 'playerLikeBtn', 'topResultLikeBtn'].map(id => document.getElementById(id)).filter(b => b);
    
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
    if (!fileName) return;

    try {
      const response = await authenticatedFetch('/playlists/my/liked/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
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

  window.openWaveformView = function(track) {
    if(!track) track = tracks[currentTrackIndex];
    if(!track) return;
    
    currentInspectedTrack = track;
    showSection('playlist-view');
    document.getElementById('pvTitle').textContent = track.Title || track.title || 'Unknown';
    const typeLabel = document.getElementById('pvTypeLabel');
    if (typeLabel) typeLabel.textContent = 'SONG';
    document.getElementById('pvCreatorName').textContent = track.Artist || track.artist || 'Unknown';
    
    // Fix the big green Play button for the waveform view
    const pvPlayBtn = document.getElementById('pvPlayBtn');
    if (pvPlayBtn) {
        pvPlayBtn.onclick = function() {
            const idx = tracks.indexOf(track);
            if (idx !== -1) {
                loadTrack(idx, true);
            } else if (window.playSearchResult) {
                window.playSearchResult(track.id, 'Song', track.fileName || track.title);
            }
        };
    }
    
    // Populate the ... options dropdown for the waveform view
    const optionsDropdown = document.getElementById('pvMoreOptionsDropdown');
    if (optionsDropdown) {
        const safeFileName = escapeHtml(track.fileName || track.title).replace(/'/g, "\\'");
        const safeId = escapeHtml(track.id || '').replace(/'/g, "\\'");
        const safeAlbumId = escapeHtml(track.albumId || '').replace(/'/g, "\\'");
        const safeArtistId = escapeHtml(track.artistId || '').replace(/'/g, "\\'");
        
        optionsDropdown.innerHTML = `
            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="window.executeWaveformAction('add-to-playlist', '${safeFileName}', '${safeId}', '${safeAlbumId}', '${safeArtistId}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                Add to playlist
            </div>
            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="window.executeWaveformAction('add-to-queue', '${safeFileName}', '${safeId}', '${safeAlbumId}', '${safeArtistId}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                Add to queue
            </div>
            <div style="border-top: 1px solid #3e3e3e; margin: 4px 0;"></div>
            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="window.executeWaveformAction('go-to-artist', '${safeFileName}', '${safeId}', '${safeAlbumId}', '${safeArtistId}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                Go to artist
            </div>
            ${safeAlbumId && safeAlbumId !== 'null' ? `
            <div style="padding: 10px 16px; font-size: 14px; color: #fff; cursor: pointer;" class="dropdown-item-hover" onclick="window.executeWaveformAction('go-to-album', '${safeFileName}', '${safeId}', '${safeAlbumId}', '${safeArtistId}'); document.getElementById('pvMoreOptionsDropdown').style.display='none';">
                Go to album
            </div>` : ''}
        `;
    }
    const moreOptionsBtn = document.getElementById('pvMoreOptionsBtn');
    if (moreOptionsBtn) moreOptionsBtn.style.display = 'inline-block';
    
    // Hide playlist specific elements
    const songCountEl = document.getElementById('pvSongCount');
    if (songCountEl) songCountEl.textContent = '1 song';
    const durationEl = document.getElementById('pvTotalDuration');
    if (durationEl) durationEl.textContent = '';
    
    const trackListEl = document.getElementById('pvTrackList');
    if (trackListEl) trackListEl.innerHTML = '';
    
    const listHeader = document.querySelector('.track-table thead');
    if (listHeader) listHeader.style.display = 'none';
    
    // Attempt to match album art background if it exists
    const pvCoverArt = document.getElementById('pvCoverArt');
    if (pvCoverArt) {
        pvCoverArt.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.Artist || track.artist)}&background=random&color=fff&size=300`;
    }
    
    updateLikeButtonState(track);
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
  window.fillCredentials = fillCredentials;
  
  // Expose player functions to global scope for HTML onclick
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
  window.fillCredentials = fillCredentials;

  // --- Track Context Menu & Artist View Logic ---
  let contextMenuTargetSong = null;
  
  window.openTrackMenu = function(e, fileName, songId, albumId, artistId) {
      e.stopPropagation();
      contextMenuTargetSong = { fileName, songId, albumId, artistId };
      const menu = document.getElementById('trackContextMenu');
      if (menu) {
          menu.style.display = 'block';
          menu.style.left = e.pageX + 'px';
          menu.style.top = e.pageY + 'px';
          
          const goToAlbumOption = document.getElementById('trackMenuGoToAlbum');
          if (goToAlbumOption) {
              if (albumId && albumId !== 'null' && albumId !== '') {
                  goToAlbumOption.style.display = 'block';
              } else {
                  goToAlbumOption.style.display = 'none';
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
      const { fileName, songId, albumId, artistId } = contextMenuTargetSong;

      switch(action) {
          case 'add-to-queue':
              if (fileName) {
                  // Find song in playlist, or fetch it. For now, we push to global queue logic.
                  // The playlist array is global.
                  const targetSongObj = typeof userPlaylists !== 'undefined' ? 
                     userPlaylists.flatMap(p => p.songs || []).find(s => s.fileName === fileName || s === fileName) : fileName;
                  
                  if (typeof currentTrackIndex !== 'undefined' && playlist && playlist.length > 0) {
                      playlist.splice(currentTrackIndex + 1, 0, targetSongObj);
                      showToast('success', 'Queue Updated', 'Song added to queue.');
                  } else {
                      playlist = [targetSongObj];
                      currentTrackIndex = 0;
                      loadTrack(0);
                      audio.play();
                  }
              }
              break;
          case 'save-to-liked':
              if (songId) {
                  try {
                      const res = await authenticatedFetch(`/api/music/favorite/${songId}`, { method: 'POST' });
                      if (res.ok) {
                          showToast('success', 'Liked Songs', 'Added to Liked Songs');
                          if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                      }
                  } catch(e) {}
              }
              break;
          case 'add-to-playlist':
              showToast('info', 'Add to Playlist', 'Select a playlist (Feature WIP)');
              // Open modal logic to add to playlist could go here
              break;
          case 'go-to-artist':
              if (artistId && artistId !== 'null' && artistId !== '') {
                  openArtistDetailView(artistId);
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
      showSection('artist-view');
      try {
          const res = await fetch(`/artist/details/${artistId}`);
          if (!res.ok) throw new Error('Failed to fetch artist');
          const data = await res.json();
          
          document.getElementById('artistViewName').textContent = data.name;
          document.getElementById('artistViewListeners').textContent = data.monthlyListeners.toLocaleString() + ' monthly listeners';
          document.getElementById('artistViewVerified').hidden = !data.verified;
          
          const header = document.querySelector('.artist-header');
          if (data.bannerUrl) {
              header.style.backgroundImage = `url('${data.bannerUrl}')`;
          } else {
              header.style.background = 'linear-gradient(135deg, #333, #000)';
          }
          
          const profileImg = document.getElementById('artistViewProfileImage');
          if (data.profileUrl) {
              profileImg.src = data.profileUrl;
          } else {
              profileImg.src = 'https://via.placeholder.com/150';
          }
          
          const popularContainer = document.getElementById('artistPopularTracks');
          if (data.popularSongs && data.popularSongs.length > 0) {
              popularContainer.innerHTML = data.popularSongs.map((s, idx) => `
                  <div class="track-row" style="display:flex; align-items:center; padding:10px; border-radius:4px; transition:0.3s;" onmouseover="this.style.background='#2a2a2a'" onmouseout="this.style.background='transparent'">
                      <div style="width:30px; text-align:center; color:#b3b3b3;">${idx + 1}</div>
                      <div style="width:40px; height:40px; margin-right:15px; cursor:pointer;" onclick="playPlaylistTrack('${escapeHtml(s.fileName)}', ${idx})">
                          <img src="${s.coverUrl || 'https://via.placeholder.com/40'}" style="width:100%; height:100%; border-radius:4px;">
                      </div>
                      <div style="flex:1;">
                          <div style="color:#fff; font-weight:bold;">${escapeHtml(s.title)}</div>
                      </div>
                      <div style="color:#b3b3b3; font-size:14px; width:150px; text-align:right;">${s.playCount.toLocaleString()}</div>
                      <div style="width:50px; text-align:right; color:#b3b3b3;">
                          <button class="track-options-btn" style="background: transparent; border: none; color: #b3b3b3; font-size: 18px; cursor: pointer;" onclick="openTrackMenu(event, '${escapeHtml(s.fileName)}', '${escapeHtml(s.id)}', '', '${escapeHtml(data.id)}')">...</button>
                      </div>
                  </div>
              `).join('');
          } else {
              popularContainer.innerHTML = '<div style="color:#b3b3b3;">No popular tracks found.</div>';
          }
          
          const discoContainer = document.getElementById('artistDiscography');
          if (data.discography && data.discography.length > 0) {
              discoContainer.innerHTML = data.discography.map(a => `
                  <div class="card" onclick="alert('Open album: ${escapeHtml(a.id)}')">
                      <div class="card-img-container">
                          <img src="${a.coverUrl || 'https://via.placeholder.com/150'}" alt="${escapeHtml(a.title)}">
                          <button class="card-play-btn">▶</button>
                      </div>
                      <div class="card-title">${escapeHtml(a.title)}</div>
                      <div class="card-subtitle">${a.year} • ${a.type}</div>
                  </div>
              `).join('');
          } else {
              discoContainer.innerHTML = '<div style="color:#b3b3b3;">No albums found.</div>';
          }
      } catch (err) {
          console.error(err);
          showToast('error', 'Error', 'Could not load artist details.');
      }
  };

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
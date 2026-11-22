// Split from the former site.js (feature: library). See docs/architecture.md.
import { state } from './state.js';
import { loadAdminDashboard } from './admin.js';
import { API_BASE_URL, authenticatedFetch } from './api.js';
import { aiUploadForm, btnUploadSubmit, setAuthPanelOpen, uploadAiStatus } from './auth.js';
import { backendUpload, browsePlaylistGrid, currentTrackArtist, currentTrackTitle, importStatus, importUrl, importUrlButton, libraryStatus, playerArtist, playerTrack, playlistGrid, playlistStatus, sections, sidebarLinks, sidebarTrackArtist, sidebarTrackTitle, trackLoader, uploadToBackendButton } from './dom.js';
import { initAllHomeSections, populateHomeGrid, populateMadeForYou } from './home.js';
import { loadTrack, setNowPlayingMeta } from './player.js';
import { loadUserPlaylists, renderPlaylistSongOptions } from './playlists.js';
import { buildQueueOrder, renderQueue } from './queue.js';
import { initials, normalizeBackendSong, showToast } from './utils.js';

export async function refreshLibrary() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/music`);
    if (!response.ok) {
      throw new Error('Unable to load songs from SQL Server backend.');
    }

    const data = await response.json();
    const songArray = Array.isArray(data) ? data : (data.songs || []);
    state.tracks = songArray.map(normalizeBackendSong);
    renderPlaylistSongOptions();
    renderQueue();
    renderLibraryGrid();
    if (typeof initAllHomeSections === 'function') {
      initAllHomeSections();
    } else {
      populateHomeGrid();
      populateMadeForYou();
    }

    if (state.tracks.length > 0) {
      state.currentTrackIndex = 0;
      setNowPlayingMeta(state.tracks[0]);
      loadTrack(0, false);
      if (libraryStatus) libraryStatus.textContent = `Loaded ${state.tracks.length} track(s) from SQL Server (MusicPlayerDb).`;
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

export function showSection(sectionId) {
  if (sectionId === 'admin' && String(state.currentAuthRole || '').toLowerCase() !== 'admin') {
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

  if (sectionId === 'admin' && String(state.currentAuthRole || '').toLowerCase() === 'admin') {
    window.location.href = '/admin/dashboard';
    return;
  }

  if (sectionId === 'playlists') {
    loadUserPlaylists().catch((error) => {
      if (playlistStatus) playlistStatus.textContent = error.message;
    });
  }
}

export function renderLibraryGrid() {
  if (!playlistGrid) return;

  playlistGrid.innerHTML = '';
  state.tracks.forEach((track, index) => {
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

export function renderBrowseGrid() {
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

export function createDemoAudioUrl(track) {
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

export function seedDemoTracks() {
  state.tracks = demoTracks.map((track) => ({
    ...track,
    src: createDemoAudioUrl(track),
    duration: 24,
  }));
}

export function revokeUploadedTrackUrls() {
  state.uploadedTrackUrls.forEach((url) => URL.revokeObjectURL(url));
  state.uploadedTrackUrls = [];
}

export async function uploadBackendFiles() {
  const files = Array.from(backendUpload?.files || []);
  if (!files.length) {
    if (importStatus) importStatus.textContent = 'Select one or more local audio files first.';
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await authenticatedFetch('/api/music/upload', {
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
  if (String(state.currentAuthRole || '').toLowerCase() === 'admin') {
    await loadAdminDashboard();
  }
}

export async function importDirectAudioUrl() {
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

export function loadUploadedTracks(fileList) {
  const files = Array.from(fileList || []).filter((file) => file && file.type.startsWith('audio/'));
  if (!files.length) {
    if (libraryStatus) libraryStatus.textContent = 'No supported audio files were selected.';
    return;
  }

  revokeUploadedTrackUrls();
  state.tracks = files.map((file) => {
    const url = URL.createObjectURL(file);
    state.uploadedTrackUrls.push(url);
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

  state.currentTrackIndex = 0;
  state.activeQueue = [...state.tracks];
  state.currentQueueTitle = 'Uploaded Music';
  state.currentViewedPlaylist = null;
  buildQueueOrder();
  renderQueue();
  renderLibraryGrid();
  setNowPlayingMeta(state.tracks[0]);
  if (libraryStatus) libraryStatus.textContent = `${state.tracks.length} local audio file${state.tracks.length === 1 ? '' : 's'} loaded.`;
  loadTrack(0, true);
}

export function initLibrary1() {
if (aiUploadForm) {
    aiUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.authToken) {
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

        const response = await authenticatedFetch(`${API_BASE_URL}/api/music/upload`, {
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
        const newTrackIndex = state.tracks.findIndex(t => t.id === data.id);
        if (newTrackIndex !== -1) {
          state.activeQueue = [...state.tracks];
          state.currentQueueTitle = 'Library';
          state.currentViewedPlaylist = null;
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
        if (String(state.currentAuthRole || '').toLowerCase() === 'admin') {
          await loadAdminDashboard();
        }
      } catch (error) {
        if (importStatus) importStatus.textContent = error.message;
      }
    });
  }
}

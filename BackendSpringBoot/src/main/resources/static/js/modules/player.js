// Split from the former site.js (feature: player). See docs/architecture.md.
import { state } from './state.js';
import { loadAdminDashboard } from './admin.js';
import { API_BASE_URL, authenticatedFetch } from './api.js';
import { syncLoginHint } from './auth.js';
import { openCheckoutModal } from './checkout.js';
import { albumArt, audioPlayer, currentPlaylistName, currentTimeEl, currentTrackArtist, currentTrackTitle, loopButton, miniArt, playPauseButton, playerArtist, playerTrack, progressFill, shuffleButton, sidebarTrackArtist, sidebarTrackTitle, totalTimeEl, volumeControl } from './dom.js';
import { SpotifakeHistory } from './history.js';
import { renderBrowseGrid, renderLibraryGrid, showSection } from './library.js';
import { renderLyrics, syncLyricsTime } from './lyrics.js';
import { renderPlaylistSongOptions, renderUserPlaylists } from './playlists.js';
import { activeShuffleMode, buildQueueOrder, forgetPlayed, getCurrentQueue, getPlayingTrack, getQueuePosition, rememberPlayed, renderQueue, skipsPlayed, startNewSmartRound, updateActiveQueueItem, wasPlayed } from './queue.js';
import { escapeHtml, formatTime, showToast } from './utils.js';
import { currentPlayContext } from './shortcuts.js';

export function setNowPlayingMeta(track) {
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
              window.openTrackMenu(e, track.fileName || title, track.id || '', track.albumId || '', track.artistId || track.artist || '', track.artist || '', state.currentViewedPlaylist?.id || '');
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
  const trackCoverUrl = track.coverUrl || (track.id ? `${API_BASE_URL}/api/music/cover/${track.id}` : '');
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

// Per-loaded-track listen tracker (a play counts after 5 seconds of actual listening).
const listenTracker = { acc: 0, lastTime: 0, recorded: false, ctx: null };

export async function reportTrackListen(track, ctx) {
  if (!track?.fileName) return;

  const response = await authenticatedFetch('/api/music/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName: track.fileName, ...(ctx || {}) }),
  });

  if (response.ok) {
    if (ctx && state.authToken) {
      window.dispatchEvent(new CustomEvent('spotifake:shortcutsChanged'));
    }
    if (String(state.currentAuthRole || '').toLowerCase() === 'admin') {
      await loadAdminDashboard();
    }
  }
}

export function updateTransportUI() {
  const icon = state.isPlaying ? '❚❚' : '▶';
  if (playPauseButton) {
    playPauseButton.textContent = icon;
    playPauseButton.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');
  }

  if (shuffleButton) {
    const isSmart = activeShuffleMode() === 'smart';
    const isStd = activeShuffleMode() === 'standard';
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
    const isOff = state.loopMode === 'off';
    const isTrack = state.loopMode === 'track';
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
    const curTrack = curList[state.currentTrackIndex];
    const isCur = window.currentSongDetailTrack && curTrack && (
      (curTrack.id && (curTrack.id === window.currentSongDetailTrack.id || curTrack.id === window.currentSongDetailTrack.Id)) ||
      (curTrack.fileName && curTrack.fileName === window.currentSongDetailTrack.fileName) ||
      (curTrack.title && window.currentSongDetailTrack.title && curTrack.title === window.currentSongDetailTrack.title)
    );
    if (isCur && state.isPlaying) {
      sdPlayBtn.innerHTML = '<svg height="28" width="28" viewBox="0 0 24 24" fill="#000"><path d="M5.7 3a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7H5.7zm10 0a.7.7 0 00-.7.7v16.6a.7.7 0 00.7.7h2.6a.7.7 0 00.7-.7V3.7a.7.7 0 00-.7-.7h-2.6z"></path></svg>';
    } else {
      sdPlayBtn.innerHTML = '<svg height="28" width="28" viewBox="0 0 24 24" fill="#000"><path d="M7.05 3.606l13.49 7.788a.7.7 0 010 1.212L7.05 20.394A.7.7 0 016 19.788V4.212a.7.7 0 011.05-.606z"></path></svg>';
    }
  }
}

export function updateProgressUI() {
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
  if (!state.currentTrackPlayRecorded && duration > 0 && current > 0) {
      if (current >= 30 || current >= (duration / 2)) {
          state.currentTrackPlayRecorded = true;
          const trackList = getCurrentQueue();
          const track = trackList[state.currentTrackIndex];
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

export function loadTrack(index, autoplay = false) {
  if (typeof index === 'object' && index !== null) {
    const target = index;
    const curList = getCurrentQueue();
    let pos = curList.findIndex(t => (target.id && (t.id === target.id || t.Id === target.id)) || (target.fileName && t.fileName === target.fileName) || (t.title && target.title && t.title.toLowerCase() === target.title.toLowerCase()));
    if (pos === -1) {
      const libPos = state.tracks.findIndex(t => (target.id && (t.id === target.id || t.Id === target.id)) || (target.fileName && t.fileName === target.fileName) || (t.title && target.title && t.title.toLowerCase() === target.title.toLowerCase()));
      if (libPos !== -1) {
        state.activeQueue = [...state.tracks];
        state.currentQueueTitle = 'Library';
        state.currentViewedPlaylist = null;
        buildQueueOrder();
        pos = libPos;
      } else {
        state.activeQueue.unshift(target);
        state.currentQueueTitle = 'Now Playing';
        state.currentViewedPlaylist = null;
        buildQueueOrder();
        pos = 0;
      }
    }
    index = pos;
  }

  const list = getCurrentQueue();
  if (!list.length) return;

  if (state.activeQueue && state.activeQueue.length > 0 && state.activeQueue !== state.tracks && typeof index === 'number' && index >= list.length && state.tracks[index]) {
    state.activeQueue = [...state.tracks];
    state.currentQueueTitle = 'Library';
    state.currentViewedPlaylist = null;
    buildQueueOrder();
    renderQueue();
    return loadTrack(index, autoplay);
  }

  state.currentTrackIndex = (index + list.length) % list.length;
  if (state.shuffleMode !== 'off') {
    buildQueueOrder();
  }
  state.currentTrackPlayRecorded = false;
  const track = list[state.currentTrackIndex];
  if (autoplay) rememberPlayed(track);
  listenTracker.acc = 0;
  listenTracker.lastTime = 0;
  listenTracker.recorded = false;
  listenTracker.ctx = currentPlayContext(track);
  listenTracker.track = track;
  if (audioPlayer && track.src) {
    audioPlayer.src = track.src;
    audioPlayer.loop = state.loopMode === 'track';
    audioPlayer.load();
    if (autoplay) {
      audioPlayer.play().then(() => {
        state.isPlaying = true;
        updateTransportUI();
        updateActiveQueueItem();
      }).catch(() => {
        state.isPlaying = false;
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

export function togglePlay() {
  const list = getCurrentQueue();
  if (!audioPlayer || !list.length) return;

  if (audioPlayer.paused) {
    audioPlayer.play().catch(() => { });
  } else {
    audioPlayer.pause();
  }
}

export function setLoopMode(mode) {
  state.loopMode = mode;
  if (audioPlayer) {
    audioPlayer.loop = mode === 'track';
  }
  try { localStorage.setItem('spotifake.loopMode', mode); } catch (e) {}
  updateTransportUI();
  renderQueue();
}

export function cycleLoop() {
  if (state.loopMode === 'off') {
    setLoopMode('playlist');
  } else if (state.loopMode === 'playlist') {
    setLoopMode('track');
  } else {
    setLoopMode('off');
  }
}

export function previousTrack() {
  const list = getCurrentQueue();
  if (!list.length) return;
  if (audioPlayer && audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
    return;
  }

  if (state.shuffleMode !== 'off' && state.queueOrder.length) {
    const queuePosition = getQueuePosition(state.currentTrackIndex);
    if (queuePosition > 0) {
      loadTrack(state.queueOrder[queuePosition - 1], true);
      renderQueue();
      return;
    }

    if (state.loopMode === 'playlist' && state.queueOrder.length > 1) {
      loadTrack(state.queueOrder[state.queueOrder.length - 1], true);
      renderQueue();
      return;
    }
  }

  const nextIndex = state.currentTrackIndex === 0
    ? (state.loopMode === 'playlist' ? list.length - 1 : 0)
    : state.currentTrackIndex - 1;
  loadTrack(nextIndex, true);
  renderQueue();
}

export function nextTrack(isAutoAdvance) {
  const list = getCurrentQueue();
  if (!list.length) return;

  // Check free tier skip limits for manual skips
  const isPrem = !!(state.currentUser && (state.currentUser.isPremium || state.currentUser.premium || state.currentUser.subscriptionTier === 'Premium'));
  if (!isPrem && isAutoAdvance !== true) {
    const now = Date.now();
    state.skipTimestamps = state.skipTimestamps.filter(ts => (now - ts) < 3600000);
    const limit = (window.platformSettings && window.platformSettings.skipLimit) ? window.platformSettings.skipLimit : 6;
    if (state.skipTimestamps.length >= limit) {
      showToast('warning', 'Skip Limit Reached', `You've reached your ${limit} skips per hour limit. Upgrade to Premium for unlimited skips!`);
      openCheckoutModal('Individual');
      return;
    }
    state.skipTimestamps.push(now);
    try { localStorage.setItem('spotifake_skips', JSON.stringify(state.skipTimestamps)); } catch (e) {}
  }

  let nextIndex;
  if (state.shuffleMode === 'smart' && state.loopMode === 'playlist' && state.smartOrderList === list
      && getQueuePosition(state.currentTrackIndex) === state.queueOrder.length - 1) {
    startNewSmartRound();
    return;
  }
  if (skipsPlayed()) {
    const position = Math.max(0, getQueuePosition(state.currentTrackIndex));
    const order = [...state.queueOrder.slice(position + 1), ...state.queueOrder.slice(0, position)];
    nextIndex = order.find(i => list[i] && !wasPlayed(list[i]));
    if (nextIndex === undefined) {
      forgetPlayed(); // the next press of Next starts the queue over
      if (audioPlayer) audioPlayer.pause();
      state.isPlaying = false;
      updateTransportUI();
      updateActiveQueueItem();
      showToast('info', 'Shuffle', 'You have played every song in this queue.');
      return;
    }
  } else if (state.shuffleMode !== 'off') {
    const queuePosition = getQueuePosition(state.currentTrackIndex);
    if (queuePosition >= 0 && queuePosition < state.queueOrder.length - 1) {
      nextIndex = state.queueOrder[queuePosition + 1];
    } else if (state.loopMode === 'playlist') {
      buildQueueOrder();
      nextIndex = state.queueOrder.length > 1 ? state.queueOrder[1] : state.queueOrder[0];
    } else {
      if (audioPlayer) audioPlayer.pause();
      state.isPlaying = false;
      updateTransportUI();
      updateActiveQueueItem();
      return;
    }
  } else if (state.currentTrackIndex >= list.length - 1) {
    if (state.loopMode === 'playlist') {
      nextIndex = 0;
    } else {
      if (audioPlayer) audioPlayer.pause();
      state.isPlaying = false;
      updateTransportUI();
      updateActiveQueueItem();
      return;
    }
  } else {
    nextIndex = state.currentTrackIndex + 1;
  }

  loadTrack(nextIndex, true);
  renderQueue();
}

export function handleTrackEnded() {
  const isPrem = !!(state.currentUser && (state.currentUser.isPremium || state.currentUser.premium || state.currentUser.subscriptionTier === 'Premium'));
  if (!isPrem) {
    state.freeTierSongCount++;
    try { localStorage.setItem('spotifake_free_songs', String(state.freeTierSongCount)); } catch (e) {}
    const adFreq = (window.platformSettings && window.platformSettings.adFrequency) ? window.platformSettings.adFrequency : 3;
    if (state.freeTierSongCount >= adFreq) {
      playAudioAdBreak(() => {
        advanceToNextSong();
      });
      return;
    }
  }
  advanceToNextSong();
}

export function advanceToNextSong() {
  const list = getCurrentQueue();
  if (state.loopMode === 'track') {
    if (audioPlayer) {
      audioPlayer.currentTime = 0;
      audioPlayer.play().catch(() => { });
    }
    return;
  }

  if (state.shuffleMode !== 'off') {
    nextTrack(true);
    return;
  }

  if (state.currentTrackIndex < list.length - 1) {
    nextTrack(true);
    return;
  }

  if (state.loopMode === 'playlist') {
    loadTrack(0, true);
    return;
  }

  state.isPlaying = false;
  updateTransportUI();
  updateActiveQueueItem();
}

export function playAudioAdBreak(onFinished) {
  if (state.isPlayingAdBreak) return;
  state.isPlayingAdBreak = true;
  const overlay = document.getElementById('adBreakOverlay');
  const fill = document.getElementById('adProgressBarFill');
  if (overlay) overlay.style.display = 'flex';
  if (fill) fill.style.width = '0%';

  fetch('/api/public/ads/stream').then(r => r.ok ? r.json() : null).then(ad => {
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
      state.freeTierSongCount = 0;
      try { localStorage.setItem('spotifake_free_songs', '0'); } catch (e) {}
      state.isPlayingAdBreak = false;
      if (typeof onFinished === 'function') onFinished();
    }
  }, intervalMs);
}

export function playAdSound() {
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

export function seekFromClick(event) {
  if (!audioPlayer || !audioPlayer.duration) return;
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  audioPlayer.currentTime = audioPlayer.duration * ratio;
  updateProgressUI();
}

export function setVolume(value) {
  if (!audioPlayer) return;
  const normalized = Math.max(0, Math.min(100, Number(value)));
  audioPlayer.volume = normalized / 100;
}

export function toggleMute() {
  if (!audioPlayer) return;
  if (audioPlayer.volume > 0) {
    state.previousVolume = audioPlayer.volume;
    audioPlayer.volume = 0;
  } else {
    audioPlayer.volume = state.previousVolume || 1;
  }
}

export function initPlayer1() {
if (audioPlayer) {
    audioPlayer.addEventListener('play', () => {
      state.isPlaying = true;
      updateTransportUI();
      updateActiveQueueItem();
      listenTracker.lastTime = audioPlayer.currentTime || 0;
    });
    const resyncListen = () => { listenTracker.lastTime = audioPlayer.currentTime || 0; };
    audioPlayer.addEventListener('seeking', resyncListen);
    audioPlayer.addEventListener('seeked', resyncListen);
    audioPlayer.addEventListener('timeupdate', () => {
      const now = audioPlayer.currentTime || 0;
      const delta = now - listenTracker.lastTime;
      listenTracker.lastTime = now;
      if (listenTracker.recorded || audioPlayer.paused || audioPlayer.seeking) return;
      if (delta > 0) listenTracker.acc += Math.min(delta, 1.0);
      const dur = audioPlayer.duration;
      const threshold = Number.isFinite(dur) && dur > 0 ? Math.min(5, dur * 0.5) : 5;
      if (listenTracker.acc >= threshold) {
        listenTracker.recorded = true;
        const t = listenTracker.track;
        if (t) {
          if (typeof SpotifakeHistory !== 'undefined') {
            SpotifakeHistory.recordPlay(t, { playlistName: state.currentQueueTitle });
          }
          reportTrackListen(t, listenTracker.ctx).catch(() => { });
        }
      }
    });
    audioPlayer.addEventListener('pause', () => {
      state.isPlaying = false;
      updateTransportUI();
      updateActiveQueueItem();
    });
    audioPlayer.addEventListener('timeupdate', updateProgressUI);
    audioPlayer.addEventListener('playing', () => rememberPlayed(getPlayingTrack()));
    audioPlayer.addEventListener('loadedmetadata', () => {
      const playing = getPlayingTrack();
      if (playing && !playing.duration) {
        playing.duration = Math.floor(audioPlayer.duration || 0);
      }
      updateProgressUI();
      renderQueue();
    });
    audioPlayer.addEventListener('ended', handleTrackEnded);
    audioPlayer.addEventListener('error', (e) => {
      console.warn('Audio playback error:', e);
      state.isPlaying = false;
      updateTransportUI();
      const list = getCurrentQueue();
      const track = list && list[state.currentTrackIndex] ? list[state.currentTrackIndex] : null;
      const trackName = track ? (track.title || track.fileName || 'track') : 'track';
      if (typeof window.showToast === 'function') {
        window.showToast(`Cannot play "${trackName}". Auto-skipping to next song...`, 'warning');
      }
      setTimeout(() => {
        if (list && list.length > 1) {
          playNextTrack(true);
        }
      }, 1500);
    });
    audioPlayer.addEventListener('volumechange', () => {
      const vol = Math.round((audioPlayer.volume || 0) * 100);
      if (volumeControl) {
        volumeControl.value = String(vol);
      }
      const volumeIcon = document.getElementById('volumeIcon');
      if (volumeIcon) {
        if (vol === 0) {
          volumeIcon.innerHTML = '<path d="M13.86 5.47a.75.75 0 0 0-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 0 0 8.8 6.53L10.27 8l-1.47 1.47a.75.75 0 1 0 1.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 0 0 1.06-1.06L12.39 8l1.47-1.47a.75.75 0 0 0 0-1.06zM9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4H0V4.85h2.066l6.925-4a.75.75 0 0 1 .75 0zM8.616 2.606 2.657 6.05H1.5v3.9h1.157l5.959 3.444V2.606z"/>';
        } else if (vol < 50) {
          volumeIcon.innerHTML = '<path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4H0V4.85h2.066l6.925-4a.75.75 0 0 1 .75 0zM8.616 2.606 2.657 6.05H1.5v3.9h1.157l5.959 3.444V2.606zm3.396 2.406a.75.75 0 0 1 1.06 0 5.485 5.485 0 0 1 0 7.776.75.75 0 1 1-1.06-1.06 3.985 3.985 0 0 0 0-5.656.75.75 0 0 1 0-1.06z"/>';
        } else {
          volumeIcon.innerHTML = '<path d="M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4H0V4.85h2.066l6.925-4a.75.75 0 0 1 .75 0zM8.616 2.606 2.657 6.05H1.5v3.9h1.157l5.959 3.444V2.606zm3.396 2.406a.75.75 0 0 1 1.06 0 5.485 5.485 0 0 1 0 7.776.75.75 0 1 1-1.06-1.06 3.985 3.985 0 0 0 0-5.656.75.75 0 0 1 0-1.06zm1.905-2.09a.75.75 0 0 1 1.06 0 8.474 8.474 0 0 1 0 12.008.75.75 0 1 1-1.06-1.06 6.974 6.974 0 0 0 0-9.888.75.75 0 0 1 0-1.06z"/>';
        }
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
}

export function toggleMiniPlayer() {
  showToast('info', 'Mini Player', 'Mini Player popped out.');
}

export function playLibraryTrack(trackIndex) {
  if (typeof trackIndex === 'number' && state.tracks[trackIndex]) {
    state.activeQueue = [...state.tracks];
    state.currentQueueTitle = 'Library';
    state.currentViewedPlaylist = null;
    buildQueueOrder();
    loadTrack(trackIndex, true);
    renderQueue();
  }
}

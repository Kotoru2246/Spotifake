// Split from the former site.js (feature: songDetail). See docs/architecture.md.
import { state } from './state.js';
import { navSetRestore } from './nav.js';
import { API_BASE_URL, authTokenKey, authenticatedFetch } from './api.js';
import { setAuthPanelOpen } from './auth.js';
import { audioPlayer } from './dom.js';
import { showSection } from './library.js';
import { loadTrack, togglePlay, updateTransportUI } from './player.js';
import { renderUserPlaylists } from './playlists.js';
import { getCurrentQueue, getPlayingTrack } from './queue.js';
import { escapeHtml, formatTime, showToast } from './utils.js';

export function isTrackLiked(track) {
  if (!track || !state.userPlaylists) return false;
  const likedPlaylist = state.userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
  if (!likedPlaylist || !likedPlaylist.songs) return false;
  const targetFile = (track.fileName || track.title || '').trim().toLowerCase();
  return likedPlaylist.songs.some(s => {
    const sName = (s.fileName || s.title || s.displayName || (typeof s === 'string' ? s : '')).trim().toLowerCase();
    return sName === targetFile || (targetFile && sName.includes(targetFile));
  });
}

export function toggleFollowArtist() {
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

export function updateLikeButtonState(track) {
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

export async function toggleLikeInspectedTrack(inspected) {
  if (!state.authToken) {
    showToast('error', 'Authentication Required', 'Please log in to save songs to your Liked Songs.');
    setAuthPanelOpen(true, 'login');
    return;
  }

  const track = inspected || getPlayingTrack();
  if (!track) return;

  const fileName = track.fileName || track.title;
  if (!fileName && !track.id) return;

  try {
    const response = await authenticatedFetch('/api/playlists/toggle-favorite', {
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

    state.userPlaylists = payload;
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
}

export function executeWaveformAction(action, trackFileName, trackId, albumId, artistId) {
    if (window.trackMenuAction) {
        window.contextMenuTargetSong = { fileName: trackFileName, songId: trackId, albumId: albumId || '', artistId: artistId || '' };
        window.trackMenuAction(action);
    }
}

export function initSongDetail1() {
window.currentSongDetailTrack = null;
}

export function openSongDetailView(track) {
  if (!track) {
    const list = getCurrentQueue();
    track = list[state.currentTrackIndex] || state.tracks[state.currentTrackIndex];
  }
  if (!track && state.tracks.length > 0) {
    track = state.tracks[0];
  }
  if (!track) return;

  state.isSongDetailLyricsExpanded = false;
  showSection('song-detail-view');
  navSetRestore(() => openSongDetailView(track));

  const mainPanel = document.querySelector('.main-panel');
  if (mainPanel) mainPanel.scrollTop = 0;

  window.renderSongDetailView(track);
}

export function renderSongDetailView(track) {
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
      const curTrack = curList[state.currentTrackIndex];
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
      if (typeof window.toggleLikeInspectedTrack === 'function') {
        await window.toggleLikeInspectedTrack(track);
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
        window.openTrackMenu(e, track.fileName || title, track.id || '', track.albumId || '', track.artistId || track.artist || '', track.artist || '', state.currentViewedPlaylist?.id || '');
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
}

export function renderSongDetailLyrics(track) {
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
  const isPrem = !!(state.currentUser && (state.currentUser.isPremium || state.currentUser.premium || state.currentUser.subscriptionTier === 'Premium'));

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
  const shouldTruncate = lines.length > maxInitial && !state.isSongDetailLyricsExpanded;
  const displayLines = shouldTruncate ? lines.slice(0, maxInitial) : lines;

  container.innerHTML = displayLines.map(line => `<p>${escapeHtml(line)}</p>`).join('');

  if (showMoreBtn) {
    if (lines.length > maxInitial) {
      showMoreBtn.style.display = 'block';
      showMoreBtn.textContent = state.isSongDetailLyricsExpanded ? 'Show less' : '...Show more';
      showMoreBtn.onclick = () => {
        state.isSongDetailLyricsExpanded = !state.isSongDetailLyricsExpanded;
        renderSongDetailLyrics(track);
      };
    } else {
      showMoreBtn.style.display = 'none';
    }
  }
}

export function renderSongDetailRecommended(track) {
  const container = document.getElementById('sdRecommendedTracks');
  if (!container) return;

  const candidates = state.tracks.filter(t => (t.id !== track.id && t.fileName !== track.fileName));
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
    const playing = getPlayingTrack();
    const isCur = playing && (playing.id === t.id || playing.fileName === t.fileName);
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

export function renderSongDetailPopularArtistTracks(track) {
  const container = document.getElementById('sdPopularArtistTracks');
  const titleEl = document.getElementById('sdPopularArtistTitle');
  if (!container) return;

  const artistName = track.artist || 'Artist';
  if (titleEl) titleEl.textContent = artistName;

  let artistTracks = state.tracks.filter(t => t.artist && t.artist.trim().toLowerCase() === artistName.trim().toLowerCase());
  if (artistTracks.length < 5) {
    const extra = state.tracks.filter(t => !artistTracks.includes(t));
    artistTracks = artistTracks.concat(extra);
  }
  const top5 = artistTracks.slice(0, 5);

  container.innerHTML = top5.map((t, idx) => {
    const tDur = t.durationSeconds || Math.round((t.durationMs || 180000) / 1000);
    const tCover = t.coverArtUrl || t.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.title)}&background=333&color=fff&size=60`;
    const tPlays = (t.playCount || t.views || (2500000 - idx * 250000)).toLocaleString();
    const playing = getPlayingTrack();
    const isCur = playing && (playing.id === t.id || playing.fileName === t.fileName);
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

export function playSongDirectly(identifier) {
  const target = state.tracks.find(t => t.id === identifier || t.fileName === identifier) || getCurrentQueue().find(t => t.id === identifier || t.fileName === identifier);
  if (target) {
    loadTrack(target, true);
  }
}

export function initializeWaveform(track) {
  if (!track) track = getPlayingTrack();
  if (!track) return;

  state.activeTrackId = track.Id || track.id || state.tracks.indexOf(track) || 1;
  
  const waveformContainer = document.getElementById('waveformContainer');
  if (!waveformContainer) return;
  
  waveformContainer.style.display = 'block';

  let initialProgress = 0;
  if (audioPlayer && audioPlayer.duration) {
    const curList = getCurrentQueue();
    const curTrack = curList[state.currentTrackIndex];
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
    fetchTrackComments(state.activeTrackId);
  }
  
  waveformContainer.onclick = (e) => {
    if(e.target.id === 'commentInput') return;
    const rect = waveformContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    
    const curList = getCurrentQueue();
    const curTrack = curList[state.currentTrackIndex];
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
}

export const AudioContextClass = window.AudioContext || window.webkitAudioContext;

export const audioCtx = AudioContextClass ? new AudioContextClass() : null;

// True while the player is still downloading this track.
function isStillLoadingInPlayer(track) {
    if (!audioPlayer || audioPlayer.src !== new URL(track.src, window.location.href).href) return false;
    if (audioPlayer.currentTime > 20) return false; // long tracks may never buffer fully
    const ranges = audioPlayer.buffered;
    return !(audioPlayer.duration && ranges.length && ranges.end(ranges.length - 1) >= audioPlayer.duration - 1);
}

export function fetchRealAudioData(track) {
    if (!audioCtx || track.isFetchingRealData || track.realAudioData) return;
    if (!track.src) return;
    // The waveform needs the whole file; don't compete with playback for it.
    // The next waveform redraw tries again.
    if (isStillLoadingInPlayer(track)) return;

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
            const currentActiveId = track.Id || track.id || (state.tracks.indexOf(track) !== -1 ? state.tracks.indexOf(track) : 1);
            if (state.activeTrackId === currentActiveId && window.audioPlayer) {
                drawSimulatedWaveform(window.audioPlayer.duration ? window.audioPlayer.currentTime / window.audioPlayer.duration : 0);
            }
        })
        .catch(e => {
            console.error("Failed to decode real audio for waveform:", e);
            track.isFetchingRealData = false;
        });
}

export function getPseudoAudioData(track) {
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

export function drawSimulatedWaveform(progress = 0) {
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
  
  let track = getPlayingTrack();
  if (state.activeTrackId) {
      track = state.tracks.find(t => (t.Id || t.id || state.tracks.indexOf(t) || 1) === state.activeTrackId) || track;
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

export function updateWaveformProgress(current, duration) {
  if (!duration) return;
  const progress = current / duration;
  drawSimulatedWaveform(progress);
  
  const progBar = document.getElementById('waveformProgress');
  if (progBar) {
    progBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  }
  
  const currentMs = Math.floor(current * 1000);
  if (Math.abs(currentMs - state.lastDanmakuTime) > 200) {
      // if user seeks backwards or seeks far ahead, just reset lastDanmakuTime
      if (currentMs < state.lastDanmakuTime || currentMs - state.lastDanmakuTime > 2000) {
          state.lastDanmakuTime = currentMs;
          return;
      }
      const toSpawn = state.currentWaveformComments.filter(c => c.timestampMs > state.lastDanmakuTime && c.timestampMs <= currentMs);
      toSpawn.forEach(c => spawnDanmaku(c.content));
      state.lastDanmakuTime = currentMs;
  }
}

export function fetchTrackComments(songId) {
  if(!songId) return;
  state.currentWaveformComments = [];
  const layer = document.getElementById('danmakuLayer');
  if (layer) layer.innerHTML = ''; 
  
  fetch(`${API_BASE_URL}/api/music/comments/${encodeURIComponent(songId)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
          if (state.activeTrackId !== songId) return; // another song was opened meanwhile
          state.currentWaveformComments = data || [];
      })
      .catch(err => console.error("Failed to load comments:", err));
}

export function handleCommentSubmit(event) {
  if (event.key === 'Enter') {
      const input = document.getElementById('commentInput');
      const content = input.value.trim();
      const timestampMs = parseInt(input.dataset.timestamp || 0);
      
      if (!content || !state.activeTrackId) return;
      
      const token = localStorage.getItem(authTokenKey) || state.authToken;
      if (!token) {
          showToast('error', 'Authentication', 'Please log in to comment.');
          return;
      }

      const songId = state.activeTrackId;
      fetch(`${API_BASE_URL}/api/music/comments/${encodeURIComponent(songId)}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ timestampMs, content })
      }).then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to post comment");
      }).then(comment => {
          if (state.activeTrackId === songId) {
              state.currentWaveformComments.push(comment);
              state.currentWaveformComments.sort((a,b) => a.timestampMs - b.timestampMs);
          }
          input.value = '';
          const popover = document.getElementById('commentPopover');
          if (popover) popover.style.display = 'none';
          spawnDanmaku(comment.content);
          showToast('success', 'Comment Added', 'Your comment was added to the timeline!');
      }).catch(err => {
          showToast('error', 'Error', 'Failed to add comment.');
      });
  }
}

export function spawnDanmaku(text) {
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

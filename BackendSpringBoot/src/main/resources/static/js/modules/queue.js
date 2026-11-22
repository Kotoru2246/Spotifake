// Split from the former site.js (feature: queue). See docs/architecture.md.
import { state } from './state.js';
import { API_BASE_URL } from './api.js';
import { appShell, queueList } from './dom.js';
import { loadTrack, updateTransportUI } from './player.js';
import { escapeHtml, formatTime, normalizeBackendSong, showToast } from './utils.js';

export function getCurrentQueue() {
  return (state.activeQueue && state.activeQueue.length > 0) ? state.activeQueue : state.tracks;
}

export function buildQueueOrder() {
  const list = getCurrentQueue();
  if (!list || !list.length) {
    state.queueOrder = [];
    return;
  }

  if (state.shuffleMode === 'off') {
    state.queueOrder = Array.from({ length: list.length }, (_, index) => index);
    return;
  }

  const smartIndices = [];
  const normalIndices = [];

  for (let i = 0; i < list.length; i++) {
    if (i === state.currentTrackIndex) continue;
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

  if (state.shuffleMode === 'smart' && smartIndices.length > 0) {
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

    state.queueOrder = [state.currentTrackIndex, ...interleaved];
    return;
  }

  state.queueOrder = [state.currentTrackIndex, ...normalIndices];
}

export function getQueuePosition(trackIndex) {
  return state.queueOrder.indexOf(trackIndex);
}

export function renderQueue() {
  if (!queueList) return;
  const list = getCurrentQueue();

  if (!state.queueOrder.length || state.queueOrder.length !== list.length) {
    buildQueueOrder();
  }

  queueList.innerHTML = '';

  const queueHeader = document.createElement('div');
  queueHeader.className = 'queue-header-subtitle';
  queueHeader.style.cssText = 'padding: 10px 16px; font-size: 13px; font-weight: bold; color: #1db954; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px;';
  queueHeader.textContent = `Playing from: ${state.currentQueueTitle || 'Library'}`;
  queueList.appendChild(queueHeader);

  state.queueOrder.forEach((trackIndex) => {
    const track = list[trackIndex];
    if (!track) return;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'queue-item' + (track.isSmartRecommendation ? ' smart-rec-item' : '');
    item.dataset.trackIndex = String(trackIndex);
    const cover = track.coverUrl || track.coverArt || (track.id ? `${API_BASE_URL}/api/music/cover/${track.id}` : '');
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
    const currentTrack = list[state.currentTrackIndex];
    if (currentTrack) {
      const npCover = currentTrack.coverUrl || currentTrack.coverArt || (currentTrack.id ? `${API_BASE_URL}/api/music/cover/${currentTrack.id}` : '');
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

export function updateActiveQueueItem() {
  const list = getCurrentQueue();
  const items = Array.from(document.querySelectorAll('.queue-item'));
  items.forEach((item) => {
    const trackIndex = Number(item.dataset.trackIndex);
    const active = trackIndex === state.currentTrackIndex;
    item.classList.toggle('active', active);
    const timeCell = item.querySelector('.queue-time');
    if (timeCell && list[trackIndex]) {
      timeCell.textContent = active && state.isPlaying ? 'Now playing' : formatTime(list[trackIndex].duration || 0);
    }
  });

  const artistRows = Array.from(document.querySelectorAll('#artistPopularTracks .spotify-track-row'));
  if (artistRows.length && typeof currentArtistContext !== 'undefined' && currentArtistContext && list[state.currentTrackIndex]) {
    const cur = list[state.currentTrackIndex];
    artistRows.forEach((row, idx) => {
      const rowSong = currentArtistContext.songs ? currentArtistContext.songs[idx] : null;
      const isActive = rowSong && ((rowSong.id && (rowSong.id === cur.id || rowSong.id === cur.Id)) || (rowSong.title && rowSong.title === cur.title) || (rowSong.fileName && rowSong.fileName === cur.fileName));
      row.classList.toggle('is-active', Boolean(isActive));
    });
  }
}

export function removeSmartRecommendations() {
  if (state.activeQueue && state.activeQueue.length > 0) {
    state.activeQueue = state.activeQueue.filter(t => !t.isNewlyInjected);
    state.activeQueue.forEach(t => {
      delete t.isSmartRecommendation;
      delete t.isNewlyInjected;
    });
  }
  state.tracks.forEach(t => {
    delete t.isSmartRecommendation;
    delete t.isNewlyInjected;
  });
}

export async function toggleShuffle() {
  if (state.shuffleMode === 'off') {
    state.shuffleMode = 'standard';
    buildQueueOrder();
    updateTransportUI();
    renderQueue();
  } else if (state.shuffleMode === 'standard') {
    state.shuffleMode = 'smart';
    updateTransportUI();
    await runSmartShuffle();
  } else {
    state.shuffleMode = 'off';
    removeSmartRecommendations();
    const list = getCurrentQueue();
    if (state.currentTrackIndex >= list.length) {
      state.currentTrackIndex = Math.max(0, list.length - 1);
    }
    buildQueueOrder();
    updateTransportUI();
    renderQueue();
  }
  try { localStorage.setItem('spotifake.shuffleMode', state.shuffleMode); } catch (e) {}
}

export async function runSmartShuffle() {
  const list = getCurrentQueue();
  if (!list || list.length === 0) return;
  try {
    showToast('info', 'Smart Shuffle', 'Fetching recommendations...');
    
    const currentTrack = list[state.currentTrackIndex];
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
        if (!state.activeQueue || state.activeQueue.length === 0) {
          state.activeQueue = [...state.tracks];
        }

        const currentTrackId = String(state.activeQueue[state.currentTrackIndex]?.id || '');
        const existingIds = new Set(state.activeQueue.map(t => String(t.id || t.Id)));
        
        for (const r of rawRecs) {
          const rid = String(r.id);
          if (rid === currentTrackId) continue;
          if (existingIds.has(rid)) {
            const found = state.activeQueue.find(t => String(t.id || t.Id) === rid);
            if (found) found.isSmartRecommendation = true;
          } else {
            const t = normalizeBackendSong(r);
            t.isSmartRecommendation = true;
            t.isNewlyInjected = true;
            state.activeQueue.push(t);
            existingIds.add(rid);
          }
        }

        const recIdSet = new Set(rawRecs.map(r => String(r.id)));
        state.activeQueue.forEach(t => {
          if (recIdSet.has(String(t.id || t.Id)) && String(t.id || t.Id) !== currentTrackId) {
            t.isSmartRecommendation = true;
          }
        });

        buildQueueOrder();
        renderQueue();

        const totalSmartCount = state.activeQueue.filter(t => t.isSmartRecommendation).length;
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

export function smartShuffle() {
  alert('Smart Shuffle is not implemented yet.');
}

export const rightSidePanel = document.getElementById('rightSidePanel');

export const rightPanelNowPlayingView = document.getElementById('rightPanelNowPlayingView');

export const rightPanelQueueView = document.getElementById('rightPanelQueueView');

export const rightPanelContextTitle = document.getElementById('rightPanelContextTitle');

export function closeRightPanel() {
  if(rightSidePanel) {
    rightSidePanel.hidden = true;
    appShell.classList.remove('right-panel-active');
    state.currentRightPanelMode = 'none';
    document.querySelectorAll('.player-bar .right-icon-btn').forEach(btn => btn.classList.remove('active'));
  }
}

export function toggleQueuePanel() {
  if(!rightSidePanel) return;
  
  // Ensure panel is open
  rightSidePanel.hidden = false;
  appShell.classList.add('right-panel-active');
  
  if (state.currentRightPanelMode === 'queue') {
      // Switch back to Now Playing
      rightPanelNowPlayingView.hidden = false;
      rightPanelQueueView.hidden = true;
      rightPanelContextTitle.textContent = 'Now Playing';
      state.currentRightPanelMode = 'nowplaying';
      document.querySelectorAll('.player-bar .right-icon-btn').forEach(btn => btn.classList.remove('active'));
  } else {
      // Switch to Queue
      rightPanelNowPlayingView.hidden = true;
      rightPanelQueueView.hidden = false;
      rightPanelContextTitle.textContent = 'Queue';
      state.currentRightPanelMode = 'queue';
  }
}

export function initQueue1() {
if (rightSidePanel) {
      rightSidePanel.hidden = false;
      if (typeof appShell !== 'undefined' && appShell) appShell.classList.add('right-panel-active');
      if (rightPanelNowPlayingView) rightPanelNowPlayingView.hidden = false;
      if (rightPanelQueueView) rightPanelQueueView.hidden = true;
      if (rightPanelContextTitle) rightPanelContextTitle.textContent = 'Now Playing';
      state.currentRightPanelMode = 'nowplaying';
  }
}

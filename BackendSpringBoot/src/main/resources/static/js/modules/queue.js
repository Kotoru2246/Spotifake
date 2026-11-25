// Split from the former site.js (feature: queue). See docs/architecture.md.
import { state } from './state.js';
import { API_BASE_URL, authenticatedFetch } from './api.js';
import { appShell, queueList } from './dom.js';
import { loadTrack, updateTransportUI } from './player.js';
import { escapeHtml, formatTime, normalizeBackendSong, showToast } from './utils.js';

export function getCurrentQueue() {
  return (state.activeQueue && state.activeQueue.length > 0) ? state.activeQueue : state.tracks;
}

/** Smart Shuffle works on playlists only: not the library, albums, artists, mixes or searched songs. */
export function isPlaylistQueue() {
  return !!state.playlistQueueTitle && state.currentQueueTitle === state.playlistQueueTitle;
}

/** The shuffle mode in effect: a saved "smart" acts as plain shuffle outside a playlist. */
export function activeShuffleMode() {
  return state.shuffleMode === 'smart' && !isPlaylistQueue() ? 'standard' : state.shuffleMode;
}

/** The song loaded in the player. currentTrackIndex is a position in the queue, not in the library. */
export function getPlayingTrack() {
  return getCurrentQueue()[state.currentTrackIndex];
}

// Songs already heard from the queue being played, whether or not shuffle was on at the time.
// The history belongs to the queue's name, so it ends when a different queue starts.
function playedKeys() {
  const title = state.currentQueueTitle || 'Library';
  if (state.playedQueueTitle !== title) {
    state.playedQueueTitle = title;
    state.playedKeys = new Set();
  }
  return state.playedKeys;
}

const playedKey = (track) => String(track?.id || track?.fileName || '');

export function rememberPlayed(track) {
  if (track) playedKeys().add(playedKey(track));
}

export function wasPlayed(track) {
  return playedKeys().has(playedKey(track));
}

export function forgetPlayed() {
  playedKeys().clear();
}

/** Shuffle with repeat off plays each song of the queue once. */
export function skipsPlayed() {
  return state.shuffleMode !== 'off' && state.loopMode === 'off';
}

export function buildQueueOrder() {
  const list = getCurrentQueue();
  if (!list || !list.length) {
    state.queueOrder = [];
    return;
  }

  // Keep a Smart Shuffle order while it plays; reshuffling on every track would repeat the picks.
  if (state.shuffleMode === 'smart' && state.smartOrderList === list && state.queueOrder.length === list.length) {
    return;
  }
  state.smartOrderList = null;

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

  if (state.shuffleMode === 'smart' && smartIndices.length > 0) {
    smartIndices.sort((x, y) => (list[x].smartRank ?? 0) - (list[y].smartRank ?? 0));
    // Spread the picks evenly between the playlist's own songs, so none bunch up at the end.
    const upcoming = [];
    let used = 0;
    smartIndices.forEach((pick, i) => {
      const upTo = Math.round((i + 0.5) * normalIndices.length / smartIndices.length);
      upcoming.push(...normalIndices.slice(used, upTo), pick);
      used = upTo;
    });
    upcoming.push(...normalIndices.slice(used));
    state.queueOrder = [state.currentTrackIndex, ...upcoming];
    state.smartOrderList = list;
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

  // Smart Shuffle lists only what comes next; the current song has its own card above.
  const smartView = state.shuffleMode === 'smart' && state.smartOrderList === list;
  const position = state.queueOrder.indexOf(state.currentTrackIndex);
  // Played songs won't come up again with shuffle on and repeat off, so don't list them.
  const pending = (index) => !skipsPlayed() || index === state.currentTrackIndex || !wasPlayed(list[index]);
  const shown = smartView
    ? state.queueOrder.slice(position + 1).filter(pending).slice(0, 50)
    : state.queueOrder.filter(pending);

  shown.forEach((trackIndex) => {
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
      ? `<span class="smart-rec-badge">✨ Pick</span>`
      : '';
    item.innerHTML = `
      ${thumbHtml}
      <div class="queue-info">
        <div class="queue-title" title="${escapeHtml(track.title || 'Unknown')}">${escapeHtml(track.title || 'Unknown')}</div>
        <div class="queue-meta" title="${escapeHtml(track.artist || 'Unknown')}">${recBadge}${escapeHtml(track.artist || 'Unknown')}</div>
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
    const prevQueue = state.activeQueue;
    const playing = prevQueue[state.currentTrackIndex];
    state.activeQueue = prevQueue.filter(t => !t.isNewlyInjected || t === playing);
    if (state.currentQueueContext && state.currentQueueContext.queue === prevQueue) {
      state.currentQueueContext.queue = state.activeQueue;
    }
    state.activeQueue.forEach(t => {
      delete t.isSmartRecommendation;
      delete t.isNewlyInjected;
      delete t.smartRank;
    });
    if (playing) state.currentTrackIndex = state.activeQueue.indexOf(playing);
  }
  state.smartOrderList = null;
  state.tracks.forEach(t => {
    delete t.smartRank;
    delete t.isSmartRecommendation;
    delete t.isNewlyInjected;
  });
}

export async function toggleShuffle() {
  const mode = activeShuffleMode();
  if (mode === 'off') {
    state.shuffleMode = 'standard';
    buildQueueOrder();
    updateTransportUI();
    renderQueue();
  } else if (mode === 'standard' && isPlaylistQueue()) {
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

// Picks already offered for this queue, so a repeat of the queue brings different ones.
function seenPicks() {
  const title = state.currentQueueTitle || 'Library';
  if (state.smartSeenTitle !== title) {
    state.smartSeenTitle = title;
    state.smartSeen = new Set();
  }
  return state.smartSeen;
}

const trackId = (t) => String(t?.id || t?.Id || t?.songID || '');

async function fetchPicks(seedIds, excludeIds, count) {
  const response = await authenticatedFetch('/api/recommendations/smart-shuffle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed_track_ids: seedIds, exclude_track_ids: excludeIds, n_recommendations: count })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).recommendations || [];
}

/** Gets a fresh set of picks: one for every three songs of the playlist. */
export async function runSmartShuffle() {
  const list = getCurrentQueue();
  if (!list || list.length === 0 || !isPlaylistQueue()) return false;
  const playing = list[state.currentTrackIndex];
  const own = list.filter(t => !t.isNewlyInjected);
  const count = Math.max(1, Math.floor(own.length / 3));

  // The current song decides the language; a few of the playlist's other songs describe it too.
  const seeds = [];
  if (playing && !playing.isNewlyInjected) seeds.push(trackId(playing));
  for (const t of [...own].sort(() => Math.random() - 0.5)) {
    if (seeds.length >= 5) break;
    if (trackId(t) && !seeds.includes(trackId(t))) seeds.push(trackId(t));
  }

  try {
    showToast('info', 'Smart Shuffle', 'Fetching recommendations...');
    const seen = seenPicks();
    const ownIds = own.map(trackId);
    let picks = await fetchPicks(seeds, [...ownIds, ...seen], count);
    if (!picks.length && seen.size) {
      seen.clear(); // nothing new is left to suggest, so start over
      picks = await fetchPicks(seeds, ownIds, count);
    }
    // The listener may have moved to another queue while this was loading.
    if (getCurrentQueue() !== list || state.shuffleMode !== 'smart') return false;
    if (!picks.length) {
      showToast('info', 'Smart Shuffle Active', 'No matching recommendations found.');
      return false;
    }
    picks.forEach(r => seen.add(String(r.id)));

    const current = list[state.currentTrackIndex];
    list.forEach(t => {
      delete t.isSmartRecommendation;
      delete t.smartRank;
    });
    const added = picks.map((r, i) => Object.assign(normalizeBackendSong(r),
      { isSmartRecommendation: true, isNewlyInjected: true, smartRank: i }));
    const queue = [...own, ...added];
    // A pick from the previous round that is still playing stays until it finishes.
    if (current && !queue.includes(current)) queue.push(current);
    if (state.currentQueueContext && state.currentQueueContext.queue === state.activeQueue) {
      state.currentQueueContext.queue = queue;
    }
    state.activeQueue = queue;

    state.currentTrackIndex = Math.max(0, queue.indexOf(current));
    state.smartOrderList = null;
    buildQueueOrder();
    renderQueue();
    showToast('success', 'Smart Shuffle Active', `Smart shuffle active with ${picks.length} AI recommendations.`);
    return true;
  } catch (err) {
    console.error('Smart shuffle error:', err);
    showToast('error', 'Smart Shuffle Error', 'Could not connect to recommendation service.');
    return false;
  }
}

/** Plays one chosen song and queues songs related to it (not the whole library) behind it. */
export async function playSongWithRelated(track) {
  const queue = [track];
  queue.forEach(clearPickMarks);
  state.activeQueue = queue;
  state.currentQueueTitle = `Songs like ${track.title}`;
  state.currentViewedPlaylist = null;
  state.smartOrderList = null;
  forgetPlayed();
  buildQueueOrder();
  loadTrack(0, true); // play now, the related songs arrive a moment later
  renderQueue();

  try {
    const picks = await fetchPicks([trackId(track)], [], 30);
    if (state.activeQueue !== queue) return; // something else was started meanwhile
    const library = new Map(state.tracks.map(t => [trackId(t), t]));
    picks.forEach(pick => {
      const related = library.get(String(pick.id)) || normalizeBackendSong(pick);
      clearPickMarks(related);
      queue.push(related);
    });
    buildQueueOrder();
    renderQueue();
  } catch (err) {
    console.error('Related songs error:', err);
    showToast('error', 'Queue', 'Could not load related songs.');
  }
}

function clearPickMarks(track) {
  delete track.isSmartRecommendation;
  delete track.isNewlyInjected;
  delete track.smartRank;
}

let startingRound = false;

/** Called when a repeating queue reaches its end: new picks, then play the queue again. */
export async function startNewSmartRound() {
  if (startingRound) return;
  startingRound = true;
  try {
    await runSmartShuffle();
    const list = getCurrentQueue();
    const finished = list[state.currentTrackIndex];
    const choices = list.map((t, i) => i).filter(i =>
      !list[i].isNewlyInjected && !list[i].isSmartRecommendation && list[i] !== finished);
    const start = choices.length ? choices[Math.floor(Math.random() * choices.length)] : state.currentTrackIndex;
    // A pick left over from the last round is dropped now that it has finished.
    let index = start;
    if (finished && finished.isNewlyInjected && !finished.isSmartRecommendation) {
      const first = list[start];
      const trimmed = list.filter(t => t !== finished);
      if (state.currentQueueContext && state.currentQueueContext.queue === list) {
        state.currentQueueContext.queue = trimmed;
      }
      state.activeQueue = trimmed;
      index = trimmed.indexOf(first);
    }
    state.currentTrackIndex = index;
    state.smartOrderList = null;
    buildQueueOrder();
    loadTrack(index, true);
  } finally {
    startingRound = false;
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

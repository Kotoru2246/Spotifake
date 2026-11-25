// Split from the former site.js (feature: playlists). See docs/architecture.md.
import { state } from './state.js';
import { navSetRestore } from './nav.js';
import { API_BASE_URL, authenticatedFetch } from './api.js';
import { setAuthPanelOpen } from './auth.js';
import { addSongModalTrackLabel, addSongPlaylistSelect, addSongToPlaylistButton, addSongToPlaylistModal, cancelAddSongModalButton, cancelCreatePlaylistButton, confirmAddSongModalButton, createPlaylistButton, createPlaylistCoverInput, createPlaylistCoverPickBtn, createPlaylistCoverPreview, createPlaylistCoverRemoveBtn, createPlaylistModal, createPlaylistName, playlistGrid, playlistSelect, playlistSongSelect, playlistSongsList, playlistStatus, submitCreatePlaylistButton, userPlaylistList } from './dom.js';
import { playlistCoverHtml } from './playlistCover.js';
import { SpotifakeHistory } from './history.js';
import { populateHomeFeaturedPlaylists, populateHomeGrid } from './home.js';
import { showSection } from './library.js';
import { loadTrack } from './player.js';
import { buildQueueOrder, forgetPlayed, getPlayingTrack, renderQueue, runSmartShuffle } from './queue.js';
import { updateLikeButtonState } from './songDetail.js';
import { contextFromPlaylist } from './shortcuts.js';
import { escapeHtml, formatTime, normalizeBackendSong, setModalOpen, showToast } from './utils.js';

export function canManagePlaylists() {
  return Boolean(state.authToken);
}

export function getSelectedPlaylist() {
  if (!state.selectedPlaylistId) return null;
  return state.userPlaylists.find((item) => item.id === state.selectedPlaylistId) || null;
}

export function renderPlaylistSongOptions() {
  if (!playlistSongSelect) return;

  playlistSongSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a song';
  playlistSongSelect.appendChild(defaultOption);

  state.tracks.forEach((track) => {
    const option = document.createElement('option');
    option.value = track.id || track.fileName || track.title;
    option.textContent = `${track.title} - ${track.artist}`;
    playlistSongSelect.appendChild(option);
  });
}

const MAX_COVER_BYTES = 5 * 1024 * 1024;
let createCoverFile = null;
let editCoverFile = null;
const coverPreviewUrls = new WeakMap();

// Wires a hidden file input: validates, previews into previewEl, reports the file (or null) via onChange.
function bindCoverPicker(input, previewEl, onChange) {
  if (!input) return;
  input.onchange = () => {
    const file = input.files && input.files[0];
    const oldUrl = coverPreviewUrls.get(input);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Cover', 'Please choose an image file.');
      input.value = '';
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      showToast('error', 'Cover', 'Image is too large (max 5 MB).');
      input.value = '';
      return;
    }
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    const url = URL.createObjectURL(file);
    coverPreviewUrls.set(input, url);
    if (previewEl) previewEl.innerHTML = `<img class="pl-cover" src="${url}" alt="">`;
    if (onChange) onChange(file);
  };
}

function resetCreateCover() {
  createCoverFile = null;
  if (createPlaylistCoverInput) {
    const oldUrl = coverPreviewUrls.get(createPlaylistCoverInput);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    coverPreviewUrls.delete(createPlaylistCoverInput);
    createPlaylistCoverInput.value = '';
  }
  if (createPlaylistCoverPreview) createPlaylistCoverPreview.innerHTML = playlistCoverHtml(null, { iconSize: 32 });
  if (createPlaylistCoverRemoveBtn) createPlaylistCoverRemoveBtn.hidden = true;
}

export function openCreatePlaylistModal() {
  if (!canManagePlaylists()) {
    showToast('info', 'Authentication Required', 'Please sign in first to create playlists.');
    setAuthPanelOpen(true, 'login');
    return;
  }

  if (createPlaylistName) createPlaylistName.value = '';
  resetCreateCover();
  setModalOpen(createPlaylistModal, true);
}

export function openLikedSongsPlaylist() {
  if (!state.userPlaylists || state.userPlaylists.length === 0) {
    showToast('info', 'Not Available', 'You do not have a Liked Songs playlist yet.');
    return;
  }
  const likedPlaylist = state.userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
  if (likedPlaylist) {
    if (window.openPlaylistById) {
      window.openPlaylistById(likedPlaylist.id);
    }
  } else {
    showToast('info', 'Not Available', 'You do not have a Liked Songs playlist yet.');
  }
}

export function openAddSongToPlaylistModal(identifier) {
  if (!canManagePlaylists()) {
    if (playlistStatus) playlistStatus.textContent = 'Sign in first to manage playlists.';
    return;
  }

  if (!state.userPlaylists.length) {
    if (playlistStatus) playlistStatus.textContent = 'Create a playlist first before adding songs.';
    return;
  }

  state.pendingAddSongFileName = identifier;
  const track = state.tracks.find((item) => item.id === identifier || item.Id === identifier || item.fileName === identifier || item.title === identifier);
  if (addSongModalTrackLabel) {
    addSongModalTrackLabel.textContent = `Song: ${track?.title || identifier}`;
  }

  if (addSongPlaylistSelect) {
    addSongPlaylistSelect.innerHTML = '';
    state.userPlaylists.forEach((playlist) => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = `${playlist.name} (${playlist.songs.length})`;
      addSongPlaylistSelect.appendChild(option);
    });
    addSongPlaylistSelect.value = state.selectedPlaylistId || state.userPlaylists[0]?.id || '';
  }

  setModalOpen(addSongToPlaylistModal, true);
}

export function renderPlaylistSelect() {
  if (!playlistSelect) return;

  playlistSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a playlist';
  playlistSelect.appendChild(defaultOption);

  state.userPlaylists.forEach((playlist) => {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = `${playlist.name} (${playlist.songs.length})`;
    playlistSelect.appendChild(option);
  });

  if (state.selectedPlaylistId && state.userPlaylists.some((item) => item.id === state.selectedPlaylistId)) {
    playlistSelect.value = state.selectedPlaylistId;
  } else {
    state.selectedPlaylistId = '';
    playlistSelect.value = '';
  }
}

export function renderPlaylistSongs() {
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
    const coverSrc = song.coverUrl || (song.id ? `${API_BASE_URL}/api/music/cover/${song.id}` : '') || '';
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

export function renderSidebarPlaylists() {
  const container = document.getElementById('sidebarUserPlaylists');
  if (!container) return;

  if (state.userPlaylists && state.userPlaylists.length) {
    const otherPlaylists = state.userPlaylists.filter(p => (p.name || '').toLowerCase() !== 'liked songs');
    container.innerHTML = otherPlaylists.map((playlist) => {
      return `
        <div class="sidebar-playlist-tile" onclick="openPlaylistById('${escapeHtml(playlist.id)}')" title="${escapeHtml(playlist.name)} (${playlist.songs ? playlist.songs.length : 0} songs)">
          ${playlistCoverHtml(playlist)}
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

export function getPlaylistTrackObjects(playlist) {
  if (!playlist || !playlist.songs) return [];
  return playlist.songs.map((song, idx) => {
    if (song && typeof song === 'object' && song.src) {
      return song;
    }
    const songFileName = typeof song === 'string' ? song : (song.fileName || song.title);
    const songTitle = typeof song === 'string' ? song.replace(/\.[^.]+$/, '') : (song.displayName || song.title || songFileName);
    const songId = typeof song === 'object' ? (song.id || song.Id) : null;
    
    const found = state.tracks.find(t => (songId && (t.id === songId || t.Id === songId)) || (t.fileName || t.title) === songFileName || (t.title && t.title === songTitle));
    if (found) {
      return found;
    }
    return {
      id: songId || songFileName,
      title: songTitle,
      artist: typeof song === 'string' ? 'Artist' : (song.artist || 'Artist'),
      album: typeof song === 'string' ? 'Single' : (song.album || 'Single'),
      fileName: songFileName,
      src: `/api/music/stream?fileName=${encodeURIComponent(songFileName)}`,
      color: '🎵',
      duration: 0,
      durationSeconds: 0
    };
  });
}

export function playPlaylistContext(playlist, startIndex = 0) {
  if (typeof SpotifakeHistory !== 'undefined' && playlist) {
    SpotifakeHistory.recordContainerPlay(playlist);
  }
  const playlistTracks = getPlaylistTrackObjects(playlist);
  if (!playlistTracks.length) {
    showToast('info', 'Empty Playlist', 'There are no songs in this playlist to play.');
    return;
  }
  state.activeQueue = playlistTracks;
  state.currentQueueTitle = playlist.name || 'Playlist';
  state.currentQueueContext = contextFromPlaylist(playlist, playlistTracks);
  // Albums, artists and generated mixes are played through here too, but are not playlists.
  const generated = /^(mix-|this-is-|radio-|album-|alb-|artist-)/.test(String(playlist.id || ''));
  const isPlaylist = playlist.id && !generated && playlist.type !== 'Album' && playlist.type !== 'Artist';
  state.playlistQueueTitle = isPlaylist ? state.currentQueueTitle : null;
  forgetPlayed();
  buildQueueOrder();
  loadTrack(startIndex, true);
  renderQueue();
  if (state.shuffleMode === 'smart') runSmartShuffle(); // picks for the new queue
}

export function openPlaylistDetailView(playlist) {
  if (!playlist) return;
  state.currentViewedPlaylist = playlist;
  state.selectedPlaylistId = playlist.id;

  showSection('playlist-view');
  navSetRestore(() => openPlaylistDetailView(playlist));
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
  const pvCoverMosaic = document.getElementById('pvCoverMosaic');
  const isUserPlaylist = playlist.type !== 'Album' && !playlist.isMix && !(playlist.id && String(playlist.id).startsWith('mix-'));
  const useMosaic = Boolean(pvCoverMosaic) && isUserPlaylist && playlist.name !== 'Liked Songs' && !playlist.imageUrl && !playlist.coverUrl;
  if (pvCoverMosaic) {
    pvCoverMosaic.hidden = !useMosaic;
    pvCoverMosaic.innerHTML = useMosaic ? playlistCoverHtml(playlist, { iconSize: 64 }) : '';
  }
  if (pvCoverArt) pvCoverArt.hidden = useMosaic;
  if (pvCoverArt && !useMosaic) {
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

export function playPlaylistTrack(fileName, playlistIdx) {
  if (state.currentViewedPlaylist && state.currentViewedPlaylist.songs && state.currentViewedPlaylist.songs.length) {
    let idx = -1;
    if (typeof playlistIdx === 'number' && playlistIdx >= 0 && playlistIdx < state.currentViewedPlaylist.songs.length) {
      const candidate = state.currentViewedPlaylist.songs[playlistIdx];
      if (!fileName || (candidate && ((candidate.id || candidate.Id) === fileName || candidate.fileName === fileName || candidate.title === fileName))) {
        idx = playlistIdx;
      }
    }
    if (idx === -1) {
      idx = state.currentViewedPlaylist.songs.findIndex(s => (s.id || s.Id) === fileName || s.fileName === fileName || s.title === fileName);
    }
    if (idx !== -1) {
      playPlaylistContext(state.currentViewedPlaylist, idx);
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
  const foundIndex = state.tracks.findIndex(t => t.id === fileName || t.Id === fileName || t.fileName === fileName || t.title === fileName);
  if (foundIndex !== -1) {
    state.activeQueue = [...state.tracks];
    state.currentQueueTitle = 'Library';
    state.currentViewedPlaylist = null;
    buildQueueOrder();
    loadTrack(foundIndex, true);
    renderQueue();
  } else {
    showToast('info', 'Playback', `Playing ${fileName}`);
  }
}

export async function openPlaylistById(playlistId) {
  if (typeof state.currentMadeForYouMixes !== 'undefined' && Array.isArray(state.currentMadeForYouMixes)) {
    const foundMix = state.currentMadeForYouMixes.find(m => m.id === playlistId);
    if (foundMix) {
      openPlaylistDetailView(foundMix);
      return;
    }
  }
  const playlist = state.userPlaylists.find(p => p.id === playlistId);
  if (playlist) {
    openPlaylistDetailView(playlist);
  } else {
    try {
        const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}`);
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
}

export async function openAlbumDetailView(albumId) {
    if (!albumId || albumId === 'null') {
        showToast('info', 'Not Available', 'Album information not available.');
        return;
    }
    try {
        const res = await authenticatedFetch(`/api/albums/${encodeURIComponent(albumId)}`);
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
}

export function togglePlaylistDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('pvMoreOptionsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

export function initPlaylists1() {
document.addEventListener('click', function(e) {
      const dropdown = document.getElementById('pvMoreOptionsDropdown');
      const btn = document.getElementById('pvMoreOptionsBtn');
      if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
          dropdown.style.display = 'none';
      }
  });
}

export function openEditPlaylistModal(playlistId) {
    const playlist = state.userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;
    document.getElementById('editPlaylistName').value = playlist.name;
    document.getElementById('editPlaylistDescription').value = ''; // We don't track descriptions right now

    const editInput = document.getElementById('editPlaylistCoverInput');
    const editPreview = document.getElementById('editPlaylistCoverPreview');
    editCoverFile = null;
    if (editInput) {
        const prevUrl = coverPreviewUrls.get(editInput);
        if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
            coverPreviewUrls.delete(editInput);
        }
        editInput.value = '';
    }
    if (editPreview) editPreview.innerHTML = playlistCoverHtml(playlist, { iconSize: 48 });
    bindCoverPicker(editInput, editPreview, (file) => { editCoverFile = file; });

    const saveBtn = document.getElementById('saveEditPlaylistButton');
    saveBtn.onclick = async function() {
        const newName = document.getElementById('editPlaylistName').value.trim();

        if (!newName) {
            showToast('error', 'Error', 'Playlist name cannot be empty');
            return;
        }
        
        try {
            const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                if (editCoverFile) {
                    const fd = new FormData();
                    fd.append('cover', editCoverFile);
                    const coverRes = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}/cover`, { method: 'POST', body: fd });
                    if (!coverRes.ok) {
                        const payload = await coverRes.json().catch(() => ({}));
                        showToast('error', 'Cover', payload.error || 'Failed to upload cover');
                        await loadUserPlaylists();
                        return;
                    }
                    editCoverFile = null;
                }
                showToast('success', 'Saved', 'Playlist details updated');
                setModalOpen(document.getElementById('editPlaylistModal'), false);
                await loadUserPlaylists();
                
                // Refresh the detail view if it's currently open
                if (state.currentViewedPlaylist && state.currentViewedPlaylist.id === playlistId) {
                    const updatedPlaylist = state.userPlaylists.find(p => p.id === playlistId);
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
}

export async function removeSavedItem(id, type) {
    try {
        if (type === 'Playlist') {
            const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(id)}/unsave`, { method: 'POST' });
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
}

export async function removePlaylist(id) {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;
    try {
        const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
}

export async function togglePlaylistVisibility(playlistId, isPublic) {
    try {
        const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}/visibility`, {
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
}

export function initPlaylists2() {
window.openLikedSongsPlaylist = function() {
    if (!canManagePlaylists()) {
      showToast('info', 'Liked Songs', 'Sign in to access your Liked Songs playlist.');
      setAuthPanelOpen(true, 'login');
      return;
    }

    const likedPlaylist = state.userPlaylists.find(p => (p.name || '').toLowerCase() === 'liked songs');
    if (likedPlaylist) {
      openPlaylistDetailView(likedPlaylist);
    } else {
      showSection('playlists');
    }
  };
}

export function refreshCurrentPlaylistView() {
  if (!state.currentViewedPlaylist) return;
  const updated = state.userPlaylists.find(p => p.id === state.currentViewedPlaylist.id || (p.name && p.name.toLowerCase() === state.currentViewedPlaylist.name.toLowerCase()));
  if (updated) {
    openPlaylistDetailView(updated);
  }
}

export function renderUserPlaylists() {
  renderSidebarPlaylists();
  populateHomeFeaturedPlaylists();
  refreshCurrentPlaylistView();
  if (getPlayingTrack()) {
    updateLikeButtonState(getPlayingTrack());
  }
  if (!userPlaylistList) return;

  if (!canManagePlaylists()) {
    userPlaylistList.innerHTML = '<div class="admin-empty-state">Sign in to create and manage your playlists.</div>';
    renderPlaylistSelect();
    renderPlaylistSongs();
    return;
  }

  if (!state.userPlaylists.length) {
    userPlaylistList.innerHTML = '<div class="admin-empty-state">No playlists yet. Create your first playlist above.</div>';
    renderPlaylistSelect();
    renderPlaylistSongs();
    return;
  }

  userPlaylistList.innerHTML = state.userPlaylists.map((playlist) => {
    const isSelected = playlist.id === state.selectedPlaylistId;
    const songCount = playlist.songs ? playlist.songs.length : 0;
    
    return `
      <article class="playlist-manage-item ${isSelected ? 'active' : ''}" data-select-playlist="${escapeHtml(playlist.id)}" style="display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 8px; background: ${isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)'}; cursor: pointer; transition: background 0.2s, transform 0.2s; border-left: ${isSelected ? '4px solid #1db954' : '4px solid transparent'}; margin-bottom: 8px;">
        <div style="width: 48px; height: 48px; min-width: 48px; border-radius: 4px; overflow: hidden; background: #282828; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${playlistCoverHtml(playlist)}
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

export async function loadUserPlaylists() {
  if (!canManagePlaylists()) {
    state.userPlaylists = [];
    state.selectedPlaylistId = '';
    renderUserPlaylists();
    if (playlistStatus) playlistStatus.textContent = 'Sign in as a user or artist to create playlists.';
    return;
  }

  const response = await authenticatedFetch('/api/playlists');
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to load playlists.');
  }

  state.userPlaylists = Array.isArray(payload) ? payload : [];
  if (!state.selectedPlaylistId && state.userPlaylists.length) {
    state.selectedPlaylistId = state.userPlaylists[0].id;
  }
  renderUserPlaylists();
  populateHomeGrid();
  if (playlistStatus) playlistStatus.textContent = `Loaded ${state.userPlaylists.length} playlist${state.userPlaylists.length === 1 ? '' : 's'}.`;
}

export async function createPlaylist() {
  const name = String(createPlaylistName?.value || '').trim();
  if (!name) {
    if (playlistStatus) playlistStatus.textContent = 'Enter a playlist name first.';
    showToast('error', 'Playlist', 'Enter a playlist name first.');
    return;
  }

  const fd = new FormData();
  fd.append('name', name);
  if (createCoverFile) fd.append('cover', createCoverFile);

  const beforeIds = new Set((state.userPlaylists || []).map((p) => p.id));
  const response = await authenticatedFetch('/api/playlists', { method: 'POST', body: fd });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload && (payload.error || payload.detail)) || 'Unable to create playlist.';
    showToast('error', 'Playlist', message);
    return;
  }

  state.userPlaylists = Array.isArray(payload) ? payload : [];
  const created = state.userPlaylists.find((p) => !beforeIds.has(p.id));
  if (created) state.selectedPlaylistId = created.id;
  renderUserPlaylists();
  populateHomeGrid();
  if (playlistStatus) playlistStatus.textContent = 'Playlist created.';
  showToast('success', 'Playlist', 'Playlist created.');
  setModalOpen(createPlaylistModal, false);
  resetCreateCover();
}

export async function deletePlaylist(playlistId) {
  const response = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}`, {
    method: 'DELETE',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to delete playlist.');
  }

  state.userPlaylists = payload;
  if (state.selectedPlaylistId === playlistId) {
    state.selectedPlaylistId = state.userPlaylists[0]?.id || '';
  }
  renderUserPlaylists();
  if (playlistStatus) playlistStatus.textContent = 'Playlist deleted.';
}

export async function addSongToPlaylist() {
  const playlistId = state.selectedPlaylistId || String(playlistSelect?.value || '');
  const fileName = String(playlistSongSelect?.value || '');
  if (!playlistId) {
    if (playlistStatus) playlistStatus.textContent = 'Select a playlist first.';
    return;
  }
  if (!fileName) {
    if (playlistStatus) playlistStatus.textContent = 'Select a song to add.';
    return;
  }

  const response = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to add song to playlist.');
  }

  state.userPlaylists = payload;
  state.selectedPlaylistId = playlistId;
  renderUserPlaylists();
  
  // Auto-update playlist view and active queue
  const updatedPlaylist = state.userPlaylists.find(p => p.id === playlistId);
  if (updatedPlaylist && state.currentViewedPlaylist && state.currentViewedPlaylist.id === playlistId) {
    openPlaylistById(playlistId); // Refresh the UI view seamlessly
  }
  
  // Auto-update active queue if the playlist is currently playing
  if (state.activeQueue && state.currentQueueTitle === (updatedPlaylist?.name || 'Playlist')) {
     const trackToAdd = state.tracks.find(t => t.fileName === fileName || t.title === fileName);
     if (trackToAdd && !state.activeQueue.some(t => t.songID === trackToAdd.songID)) {
         state.activeQueue.push(trackToAdd);
         buildQueueOrder();
         renderQueue();
     }
  }

  if (playlistSongSelect) playlistSongSelect.value = '';
  if (playlistStatus) playlistStatus.textContent = 'Song added to playlist.';
}

export async function removeSongFromPlaylist(fileName) {
  const playlistId = state.selectedPlaylistId;
  if (!playlistId) return;

  const response = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to remove song from playlist.');
  }

  state.userPlaylists = payload;
  renderUserPlaylists();
  if (playlistStatus) playlistStatus.textContent = 'Song removed from playlist.';
}

export async function addSpecificSongToPlaylist(playlistId, fileName) {
  if (!playlistId || !fileName) return;

  const matchedTrack = state.tracks.find(t => t.id === fileName || t.Id === fileName || t.fileName === fileName || t.title === fileName);
  const payloadBody = {
    fileName: matchedTrack?.fileName || fileName,
    songFileName: matchedTrack?.fileName || fileName,
    songId: matchedTrack?.id || (fileName.length >= 32 ? fileName : '')
  };

  const response = await authenticatedFetch(`/api/playlists/${encodeURIComponent(playlistId)}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadBody),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to add song to playlist.');
  }

  state.userPlaylists = payload;
  state.selectedPlaylistId = playlistId;
  renderUserPlaylists();

  const updatedPlaylist = state.userPlaylists.find(p => p.id === playlistId);
  if (updatedPlaylist && state.currentViewedPlaylist && state.currentViewedPlaylist.id === playlistId) {
    state.currentViewedPlaylist = updatedPlaylist;
    openPlaylistDetailView(updatedPlaylist);
  }

  if (state.activeQueue && state.currentQueueTitle === (updatedPlaylist?.name || 'Playlist')) {
     const trackToAdd = matchedTrack || normalizeBackendSong({ fileName });
     if (trackToAdd && !state.activeQueue.some(t => (t.id && t.id === trackToAdd.id) || (t.fileName && t.fileName === trackToAdd.fileName))) {
         state.activeQueue.push(trackToAdd);
         buildQueueOrder();
         renderQueue();
     }
  }

  if (playlistStatus) playlistStatus.textContent = 'Song added to playlist.';
}

export function initPlaylists3() {
if (createPlaylistButton) {
    createPlaylistButton.addEventListener('click', async () => {
      openCreatePlaylistModal();
    });
  }

if (submitCreatePlaylistButton) {
    submitCreatePlaylistButton.addEventListener('click', async () => {
      if (submitCreatePlaylistButton.disabled) return;
      submitCreatePlaylistButton.disabled = true;
      try {
        await createPlaylist();
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      } finally {
        submitCreatePlaylistButton.disabled = false;
      }
    });
  }

if (cancelCreatePlaylistButton) {
    cancelCreatePlaylistButton.addEventListener('click', () => {
      setModalOpen(createPlaylistModal, false);
    });
  }

if (createPlaylistCoverInput) {
    bindCoverPicker(createPlaylistCoverInput, createPlaylistCoverPreview, (file) => {
      createCoverFile = file;
      if (createPlaylistCoverRemoveBtn) createPlaylistCoverRemoveBtn.hidden = !file;
    });
  }
if (createPlaylistCoverPickBtn) {
    createPlaylistCoverPickBtn.addEventListener('click', () => createPlaylistCoverInput && createPlaylistCoverInput.click());
  }
if (createPlaylistCoverRemoveBtn) {
    createPlaylistCoverRemoveBtn.addEventListener('click', resetCreateCover);
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
        await addSpecificSongToPlaylist(playlistId, state.pendingAddSongFileName);
        setModalOpen(addSongToPlaylistModal, false);
      } catch (error) {
        if (playlistStatus) playlistStatus.textContent = error.message;
      }
    });
  }

if (playlistSelect) {
    playlistSelect.addEventListener('change', () => {
      state.selectedPlaylistId = String(playlistSelect.value || '');
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
        const pl = state.userPlaylists.find(p => p.id === plId);
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
          state.selectedPlaylistId = plId;
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
        state.selectedPlaylistId = String(selectItem.getAttribute('data-select-playlist') || '');
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
        const idx = state.tracks.findIndex(t => t.fileName === ident || t.id === ident);
        if (idx !== -1) {
          state.activeQueue = [...state.tracks];
          state.currentQueueTitle = 'Library';
          state.currentViewedPlaylist = null;
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
        if (Number.isFinite(index) && state.tracks[index]) {
          state.activeQueue = [...state.tracks];
          state.currentQueueTitle = 'Library';
          state.currentViewedPlaylist = null;
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
}

export function openAddToPlaylistModal() {
  const track = getPlayingTrack();
  if (track) {
    openAddSongToPlaylistModal(track.fileName || track.title);
  } else {
    showToast('info', 'No Track', 'There is no track to add.');
  }
}

export function toggleSidebarAddMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('sidebarAddMenu');
  if (!menu) return;
  const isVisible = menu.style.display === 'block';
  menu.style.display = isVisible ? 'none' : 'block';
}

export function hideSidebarAddMenu() {
  const menu = document.getElementById('sidebarAddMenu');
  if (menu) menu.style.display = 'none';
}

export function initPlaylists4() {
document.addEventListener('click', (e) => {
    if (!e.target.closest('#sidebarAddMenu') && !e.target.closest('#quickCreatePlaylistBtn')) {
      window.hideSidebarAddMenu();
    }
  });
}

export function filterPlaylistSongAdd(query) {
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
  const matches = (state.tracks || []).filter(t => 
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
}

export async function addSongFromSearch(fileName) {
  if (!state.selectedPlaylistId) {
    showToast('info', 'Playlist', 'Select a playlist first.');
    return;
  }
  try {
    await addSpecificSongToPlaylist(state.selectedPlaylistId, fileName);
    showToast('success', 'Added', 'Song added to playlist.');
    const searchInput = document.getElementById('playlistSongSearchInput');
    if (searchInput && searchInput.value) {
      filterPlaylistSongAdd(searchInput.value);
    }
  } catch(e) {
    showToast('error', 'Error', e.message || 'Could not add song.');
  }
}

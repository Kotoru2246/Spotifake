// Split from the former site.js (feature: search). See docs/architecture.md.
import { state } from './state.js';
import { authenticatedFetch } from './api.js';
import { setAuthPanelOpen } from './auth.js';
import { showSection } from './library.js';
import { loadTrack } from './player.js';
import { loadUserPlaylists, playPlaylistContext } from './playlists.js';
import { buildQueueOrder, renderQueue } from './queue.js';
import { escapeHtml, showToast } from './utils.js';

export function handleSearchInput(event) {
  const rawQuery = (event.target.value || '').trim();
  const dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;

  if (rawQuery.length < 1) {
    dropdown.hidden = true;
    return;
  }

  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(rawQuery)}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        if (items.length > 0) {
          dropdown.innerHTML = items.slice(0, 8).map(item => {
            const type = item.type || item.Type || 'Song';
            const title = item.title || item.Title || 'Unknown';
            const creator = item.creator || item.Creator || 'Spotifake';
            const img = item.imageUrl || item.ImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=333&color=fff`;
            const idVal = item.id || item.Id || title;
            const isSong = type.toLowerCase() === 'song';
            const clickAction = isSong
              ? `document.getElementById('searchInput').value=''; document.getElementById('searchDropdown').hidden=true; window.playSearchResult('${encodeURIComponent(idVal)}', 'Song', '${encodeURIComponent(title)}');`
              : `document.getElementById('searchInput').value=''; document.getElementById('searchDropdown').hidden=true; window.openProfileOrPlaylist('${encodeURIComponent(idVal)}', '${type}');`;
            return `
            <div class="search-dropdown-item" onclick="${clickAction}">
              <img src="${img}" alt="art" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Music&background=333&color=fff';">
              <div class="item-text">
                <div class="item-title">${escapeHtml(title)}</div>
                <div class="item-subtitle">${type} • ${escapeHtml(creator)}</div>
              </div>
            </div>`;
          }).join('');
          dropdown.hidden = false;
          return;
        }
      }
    } catch (ignored) {}

    // Local fallback
    const query = rawQuery.toLowerCase();
    const results = state.tracks.filter(t => 
      (t.title || '').toLowerCase().includes(query) || 
      (t.artist || '').toLowerCase().includes(query)
    ).slice(0, 8);
    
    if (results.length === 0) {
      dropdown.hidden = true;
      return;
    }
    
    dropdown.innerHTML = results.map(t => {
      const idx = state.tracks.indexOf(t);
      return `
      <div class="search-dropdown-item" onclick="document.getElementById('searchInput').value=''; document.getElementById('searchDropdown').hidden=true; window.playLibraryTrack(${idx});">
        <img src="${t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.artist)}&background=random&color=fff`}" alt="art">
        <div class="item-text">
          <div class="item-title">${escapeHtml(t.title)}</div>
          <div class="item-subtitle">Song • ${escapeHtml(t.artist)}</div>
        </div>
      </div>`;
    }).join('');
    dropdown.hidden = false;
  }, 250);
}

export function initSearch1() {
window.currentSearchFilter = 'all';
}

export function setSearchFilter(filter, btnElement) {
    window.currentSearchFilter = filter;
    const buttons = btnElement.parentElement.querySelectorAll('.filter-chip');
    buttons.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    handleSearchSubmit({key: 'Enter'});
}

export async function performSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (!query) return;
    document.getElementById('searchInput').value = query; // keep top bar in sync
    handleSearchSubmit({key: 'Enter'});
  }
}

export async function handleSearchSubmit(event) {
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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
}

export function viewSearchResult(id, type, fileName) {
    if (type === 'Song') {
        playSearchResult(id, type, fileName);
    } else if (type === 'Playlist') {
        window.openPlaylistById(id);
    } else if (type === 'Album') {
        window.openAlbumDetailView(id);
    } else if (type === 'Artist') {
        if (window.openArtistDetailView) window.openArtistDetailView(id);
    }
}

export async function playSearchResult(id, type, fileName) {
    if (type === 'Song') {
        const idx = state.tracks.findIndex(t => 
            (fileName && (t.fileName === fileName || t.title === fileName)) ||
            (id && (t.id === id || t.Id === id))
        );
        if(idx !== -1) {
            state.activeQueue = [...state.tracks];
            state.currentQueueTitle = 'Library';
            state.currentViewedPlaylist = null;
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
                if (state.activeQueue) {
                    state.activeQueue.unshift(mockTrack);
                } else {
                    state.activeQueue = [mockTrack];
                }
                state.currentQueueTitle = 'Search';
                state.currentViewedPlaylist = null;
                buildQueueOrder();
                loadTrack(0, true);
                renderQueue();
            } else {
                showToast('info', 'Play', 'Song not found in local library scope.');
            }
        }
    } else if (type === 'Playlist') {
        try {
            const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(id)}`);
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
            const res = await authenticatedFetch(`/api/albums/${encodeURIComponent(id)}`);
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
}

export async function saveSearchResult(id, type, fileName) {
    if (!state.authToken) {
        showToast('info', 'Not Signed In', 'Please sign in to save items.');
        setAuthPanelOpen(true, 'login');
        return;
    }
    try {
        if (type === 'Song') {
            const res = await authenticatedFetch('/api/playlists/toggle-favorite', {
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
}

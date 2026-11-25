// Split from the former site.js (feature: home). See docs/architecture.md.
import { state } from './state.js';
import { API_BASE_URL, authenticatedFetch, authTokenKey } from './api.js';
import { SpotifakeHistory } from './history.js';
import { showSection } from './library.js';
import { loadTrack } from './player.js';
import { playlistCoverHtml } from './playlistCover.js';
import { openPlaylistDetailView, playPlaylistContext } from './playlists.js';
import { buildQueueOrder, renderQueue } from './queue.js';
import { escapeHtml, showToast } from './utils.js';
import { fetchShortcuts } from './shortcuts.js';

export async function playQuickCardContainer(item) {
  if (!item) return;

  if (item.type === 'Album') {
    const albTracks = (state.tracks || []).filter(t => 
      (t.album && t.album.toLowerCase() === item.title.toLowerCase()) ||
      (item.albumId && (t.albumId == item.albumId || t.albumId === item.albumId))
    );
    if (albTracks.length > 0) {
      playPlaylistContext({
        id: item.albumId || 'album-' + item.title,
        name: item.title,
        type: 'Album',
        songs: albTracks
      }, 0);
      return;
    }
    if (item.albumId) {
      try {
        const res = await authenticatedFetch(`/api/albums/${encodeURIComponent(item.albumId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.songs && data.songs.length > 0) {
            playPlaylistContext({ ...data, type: 'Album' }, 0);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load album context', e);
      }
    }
    showToast('info', 'Album', `No playable songs found for "${item.title}".`);
  } else if (item.type === 'Artist') {
    const artTracks = (state.tracks || []).filter(t =>
      (t.artist && t.artist.toLowerCase() === item.title.toLowerCase()) ||
      (item.artistId && (t.artistId == item.artistId || t.artistId === item.artistId))
    );
    if (artTracks.length > 0) {
      playPlaylistContext({
        id: item.artistId || 'artist-' + item.title,
        name: item.title,
        type: 'Artist',
        songs: artTracks
      }, 0);
      return;
    }
    if (item.artistId) {
      try {
        const res = await fetch(`/api/artists/${encodeURIComponent(item.artistId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.popularSongs && data.popularSongs.length > 0) {
            playPlaylistContext({
              id: item.artistId,
              name: data.name || item.title,
              type: 'Artist',
              songs: data.popularSongs
            }, 0);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load artist songs', e);
      }
    }
    showToast('info', 'Artist', `No playable songs found for "${item.title}".`);
  } else if (item.type === 'Playlist') {
    const pl = (state.userPlaylists || []).find(p => item.playlistId
      ? p.id === item.playlistId
      : (p.name && p.name.toLowerCase() === item.title.toLowerCase())
    );
    if (pl && pl.songs && pl.songs.length > 0) {
      playPlaylistContext(pl, 0);
      return;
    }
    if (item.playlistId) {
      try {
        const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(item.playlistId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.songs && data.songs.length > 0) {
            playPlaylistContext(data, 0);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load playlist', e);
      }
    }
    showToast('info', 'Playlist', `Playlist "${item.title}" is empty.`);
  }
}

export async function openQuickCardDetail(item) {
  if (!item) return;

  if (item.type === 'Album') {
    if (item.albumId && typeof window.openAlbumDetailView === 'function') {
      window.openAlbumDetailView(item.albumId);
    } else {
      const albTracks = (state.tracks || []).filter(t => 
        (t.album && t.album.toLowerCase() === item.title.toLowerCase()) ||
        (item.albumId && (t.albumId == item.albumId || t.albumId === item.albumId))
      );
      if (albTracks.length > 0) {
        openPlaylistDetailView({
          id: item.albumId || 'album-' + item.title,
          name: item.title,
          type: 'Album',
          songs: albTracks
        });
      } else {
        playQuickCardContainer(item);
      }
    }
  } else if (item.type === 'Artist') {
    let artistId = item.artistId;
    if (!artistId && state.tracks) {
      const found = state.tracks.find(t => (t.artist || '').toLowerCase() === item.title.toLowerCase());
      if (found) artistId = found.artistId;
    }
    if (artistId && typeof window.openArtistDetailView === 'function') {
      window.openArtistDetailView(artistId);
    } else {
      playQuickCardContainer(item);
    }
  } else if (item.type === 'Playlist') {
    const pl = (state.userPlaylists || []).find(p => item.playlistId
      ? p.id === item.playlistId
      : (p.name && p.name.toLowerCase() === item.title.toLowerCase())
    );
    if (pl) {
      openPlaylistDetailView(pl);
    } else if (item.playlistId && typeof window.openPlaylistById === 'function') {
      window.openPlaylistById(item.playlistId);
    } else {
      showSection('playlists');
    }
  }
}

export function getCatalogBackfillCandidates() {
  const candidates = [];
  const seen = new Set();

  function addCandidate(c) {
    const key = `${c.type}:${c.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(c);
    }
  }

  // 1. Prominent albums in loaded tracks
  const albumCountMap = new Map();
  (state.tracks || []).forEach(t => {
    const alb = (t.album || '').trim();
    if (!alb || alb.toLowerCase() === 'single' || alb.toLowerCase() === 'unknown album') return;
    const lower = alb.toLowerCase();
    if (!albumCountMap.has(lower)) {
      albumCountMap.set(lower, {
        type: 'Album',
        title: alb,
        artist: t.artist || '',
        subtitle: `${t.artist || 'Album'} • Album`,
        albumId: t.albumId || null,
        id: t.albumId || alb,
        coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/api/music/cover/${t.id}` : ''),
        count: 1
      });
    } else {
      albumCountMap.get(lower).count++;
    }
  });
  Array.from(albumCountMap.values())
    .sort((a, b) => b.count - a.count)
    .forEach(addCandidate);

  // 2. Prominent artists in loaded tracks
  const artistCountMap = new Map();
  (state.tracks || []).forEach(t => {
    const art = (t.artist || '').trim();
    if (!art || art.toLowerCase() === 'unknown artist' || art.toLowerCase() === 'various artists') return;
    const lower = art.toLowerCase();
    if (!artistCountMap.has(lower)) {
      artistCountMap.set(lower, {
        type: 'Artist',
        title: art,
        artist: art,
        subtitle: 'Artist',
        artistId: t.artistId || null,
        id: t.artistId || art,
        coverUrl: t.coverUrl || (t.id ? `${API_BASE_URL}/api/music/cover/${t.id}` : ''),
        count: 1
      });
    } else {
      artistCountMap.get(lower).count++;
    }
  });
  Array.from(artistCountMap.values())
    .sort((a, b) => b.count - a.count)
    .forEach(addCandidate);

  // 3. Fallback prominent catalog items from specification
  const defaultCatalog = [
    { type: 'Album', title: 'Gieo', artist: 'Ngọt', subtitle: 'Ngọt • Album' },
    { type: 'Album', title: 'In The Lonely Hour', artist: 'Sam Smith', subtitle: 'Sam Smith • Album' },
    { type: 'Album', title: '3 (tuyển tập nhạc Ngọt...)', artist: 'Ngọt', subtitle: 'Ngọt • Album' },
    { type: 'Album', title: 'The Thrill Of It All', artist: 'Sam Smith', subtitle: 'Sam Smith • Album' },
    { type: 'Artist', title: 'Ngọt', artist: 'Ngọt', subtitle: 'Artist' },
    { type: 'Artist', title: 'Sam Smith', artist: 'Sam Smith', subtitle: 'Artist' },
    { type: 'Playlist', title: 'Discover Weekly', subtitle: 'Playlist' },
    { type: 'Playlist', title: 'Daily Mix 1', subtitle: 'Playlist' }
  ];

  defaultCatalog.forEach(item => {
    if (state.tracks && state.tracks.length) {
      if (item.type === 'Album') {
        const match = state.tracks.find(t => (t.album || '').toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes((t.album || '').toLowerCase()));
        if (match) {
          item.coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/api/music/cover/${match.id}` : '');
          if (match.albumId) item.albumId = match.albumId;
          if (match.artist) item.artist = match.artist;
        }
      } else if (item.type === 'Artist') {
        const match = state.tracks.find(t => (t.artist || '').toLowerCase() === item.title.toLowerCase());
        if (match) {
          item.coverUrl = match.coverUrl || (match.id ? `${API_BASE_URL}/api/music/cover/${match.id}` : '');
          if (match.artistId) item.artistId = match.artistId;
        }
      }
    }
    addCandidate(item);
  });

  return candidates;
}

let homeGridSeq = 0;

export async function populateHomeGrid() {
  const grid = document.getElementById('homeQuickGrid');
  if (!grid) return;
  const seq = ++homeGridSeq;

  // Tile 1: Liked Songs
  const likedPlaylist = (state.userPlaylists || []).find(p => (p.name || '').toLowerCase() === 'liked songs');
  const likedCount = likedPlaylist && likedPlaylist.songs ? likedPlaylist.songs.length : 0;
  const likedSubtitle = likedCount > 0 ? `${likedCount} liked song${likedCount === 1 ? '' : 's'}` : 'Playlist';

  // Remaining tiles (up to 7 items): Prioritize Containers (Albums, Playlists, Artists)
  const recentItems = [];
  const seenKeys = new Set();
  seenKeys.add('playlist:liked songs');

  if (state.authToken) {
    // Signed in: server-side shortcuts (most played / recent containers)
    const shortcuts = await fetchShortcuts(7);
    if (seq !== homeGridSeq) return;
    if (shortcuts === null) return; // fetch failed: keep the current tiles
    const cap =(s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    for (const s of shortcuts) {
      if (recentItems.length >= 7) break;
      recentItems.push({
        type: cap(s.type),
        id: s.openId,
        playlistId: s.playlistId,
        albumId: s.albumId,
        artistId: s.type === 'artist' ? (s.artistId || s.openId) : s.artistId,
        title: s.title,
        subtitle: s.subtitle,
        coverUrl: s.coverUrl,
        coverMosaic: s.coverMosaic
      });
    }
  } else {
  // 1. Containers from history (Albums, Playlists, Artists)
  const historyContainers = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getRecentContainers(7) : [];
  for (const c of historyContainers) {
    if (recentItems.length >= 7) break;
    const key = `${(c.type || 'container').toLowerCase()}:${(c.title || '').toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      recentItems.push(c);
    }
  }

  // 2. Also check explicit recentItems recorded via recordContainerPlay
  if (recentItems.length < 7 && typeof SpotifakeHistory !== 'undefined') {
    const explicitRecent = SpotifakeHistory.getRecentItems(15);
    for (const item of explicitRecent) {
      if (recentItems.length >= 7) break;
      if (item.type === 'Album' || item.type === 'Playlist' || item.type === 'Artist') {
        const key = `${item.type.toLowerCase()}:${(item.title || '').toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          recentItems.push(item);
        }
      }
    }
  }
  }

  if (seq !== homeGridSeq) return;
  grid.innerHTML = '';

  // Render Tile 1: Liked Songs
  const likedCard = document.createElement('div');
  likedCard.className = 'quick-card quick-card-liked';
  likedCard.title = 'Liked Songs';
  likedCard.innerHTML = `
    <div style="width: 64px; height: 64px; min-width: 64px; background: linear-gradient(135deg, #450af5, #8e8ee5); display: flex; align-items: center; justify-content: center; border-radius: 4px 0 0 4px; box-shadow: inset 0 0 12px rgba(0,0,0,0.15); flex-shrink: 0;">
      <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
    <div style="flex: 1; min-width: 0; padding: 0 12px; display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
      <div class="quick-card-title" style="padding: 0; margin: 0; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;">Liked Songs</div>
      <div style="font-size: 11px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">${likedSubtitle}</div>
    </div>
    <div class="quick-card-play" style="flex-shrink: 0; cursor: pointer;" title="Play Liked Songs">▶</div>
  `;

  likedCard.addEventListener('click', (e) => {
    if (e.target.closest('.quick-card-play')) return;
    if (typeof window.openLikedSongsPlaylist === 'function') {
      window.openLikedSongsPlaylist();
    } else if (likedPlaylist) {
      openPlaylistDetailView(likedPlaylist);
    } else {
      showSection('playlists');
    }
  });

  const likedPlayBtn = likedCard.querySelector('.quick-card-play');
  if (likedPlayBtn) {
    likedPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (likedPlaylist && likedPlaylist.songs && likedPlaylist.songs.length > 0) {
        playPlaylistContext(likedPlaylist, 0);
      } else {
        showToast('info', 'Liked Songs', 'Your Liked Songs playlist is empty. Like some songs first!');
      }
    });
  }

  grid.appendChild(likedCard);

  // Render Remaining Tiles (Albums, Playlists, and Songs)
  recentItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'quick-card';
    card.title = `${item.title || 'Item'} - ${item.subtitle || ''}`;

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Music')}&background=282828&color=1db954&size=128`;
    const coverSrc = item.coverUrl || fallbackAvatar;

    const imgEl = document.createElement('img');
    imgEl.src = coverSrc;
    imgEl.alt = item.title || '';
    imgEl.style.cssText = 'width: 64px; height: 64px; min-width: 64px; object-fit: cover; border-radius: 4px 0 0 4px; flex-shrink: 0;';
    imgEl.onerror = function() {
      this.onerror = null;
      this.src = fallbackAvatar;
    };

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex: 1; min-width: 0; padding: 0 12px; display: flex; flex-direction: column; justify-content: center; overflow: hidden;';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'quick-card-title';
    titleDiv.style.cssText = 'padding: 0; margin: 0; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;';
    titleDiv.textContent = item.title || 'Untitled';

    const subDiv = document.createElement('div');
    subDiv.style.cssText = 'font-size: 11px; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;';
    subDiv.textContent = item.subtitle || item.artist || item.type || '';

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(subDiv);

    const playDiv = document.createElement('div');
    playDiv.className = 'quick-card-play';
    playDiv.style.cssText = 'flex-shrink: 0; cursor: pointer;';
    playDiv.title = `Play ${item.title || ''}`;
    playDiv.textContent = '▶';

    const livePlaylist = item.type === 'Playlist'
      ? (state.userPlaylists || []).find(p => p.id === (item.id || item.playlistId) || p.id === item.playlistId)
      : null;
    if (livePlaylist || (item.type === 'Playlist' && Array.isArray(item.coverMosaic))) {
      const coverBox = document.createElement('div');
      coverBox.className = 'quick-card-cover';
      coverBox.innerHTML = playlistCoverHtml(livePlaylist || {
        name: item.title,
        imageUrl: item.coverUrl,
        songs: item.coverMosaic.map(u => ({ coverArtUrl: u }))
      });
      card.appendChild(coverBox);
    } else {
      card.appendChild(imgEl);
    }
    card.appendChild(infoDiv);
    card.appendChild(playDiv);

    const playAction = () => {
      if (item.type === 'Album' || item.type === 'Playlist' || item.type === 'Artist') {
        playQuickCardContainer(item);
      } else {
        // Song
        const idx = (state.tracks || []).findIndex(t => 
          (item.id && (t.id === item.id || t.fileName === item.id)) ||
          (item.fileName && t.fileName === item.fileName) ||
          (t.title && item.title && t.title.toLowerCase() === item.title.toLowerCase())
        );
        if (idx !== -1) {
          state.activeQueue = [...state.tracks];
          state.currentQueueTitle = 'Library';
          state.currentViewedPlaylist = null;
          buildQueueOrder();
          loadTrack(idx, true);
          renderQueue();
        } else if (typeof window.playSearchResult === 'function') {
          window.playSearchResult(item.id || item.fileName, 'Song', item.fileName || item.title);
        }
      }
    };

    card.addEventListener('click', (e) => {
      if (e.target.closest('.quick-card-play')) return;
      if (item.type === 'Album' || item.type === 'Artist' || item.type === 'Playlist') {
        openQuickCardDetail(item);
      } else {
        playAction();
      }
    });

    playDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      playAction();
    });

    grid.appendChild(card);
  });
}

export function initHome1() {
window.addEventListener('spotifake:shortcutsChanged', () => { populateHomeGrid(); });
window.addEventListener('spotifake:playRecorded', () => {
    if (typeof initAllHomeSections === 'function') {
      initAllHomeSections();
    }
  });
}

export function createMixCoverSvg(title, subtitle, color1, color2) {
  const safeTitle = (title || 'MIX').toUpperCase().replace(/[<>&"]/g, '');
  const safeSub = (subtitle || 'SPOTIFAKE').toUpperCase().replace(/[<>&"]/g, '');
  const c1 = encodeURIComponent(color1 || '#1db954');
  const c2 = encodeURIComponent(color2 || '#191414');
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="300" height="300" fill="url(%23g)"/><circle cx="260" cy="40" r="80" fill="rgba(255,255,255,0.08)"/><circle cx="40" cy="260" r="60" fill="rgba(0,0,0,0.15)"/><rect x="24" y="24" width="36" height="6" rx="3" fill="rgba(255,255,255,0.7)"/><text x="24" y="200" fill="%23ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="900" font-size="28" letter-spacing="-0.5">${safeTitle}</text><text x="24" y="226" fill="rgba(255,255,255,0.85)" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="600" font-size="12" letter-spacing="1.5">${safeSub}</text></svg>`;
}

export function generateMadeForYouMixes() {
  const catalog = Array.isArray(state.tracks) && state.tracks.length > 0 ? state.tracks : [];
  const history = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getHistory() : [];
  const topGenres = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getTopGenres(10) : [];

  // Helper: deduplicate tracks by ID/fileName/title
  const dedupe = (list) => {
    const seen = new Set();
    const out = [];
    (list || []).forEach(t => {
      if (!t) return;
      const key = (t.id || t.fileName || t.title || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    });
    return out;
  };

  // Helper: extract distinct artists for mix description
  const describeArtists = (mixSongs, primaryArtist, defaultDesc) => {
    const set = new Set();
    if (primaryArtist && primaryArtist !== 'Unknown Artist') set.add(primaryArtist);
    (mixSongs || []).forEach(s => {
      if (s && s.artist && s.artist !== 'Unknown Artist') {
        const parts = s.artist.split(/[\/,]/).map(p => p.trim());
        parts.forEach(p => { if (p && p !== 'Unknown Artist' && set.size < 4) set.add(p); });
      }
    });
    const list = Array.from(set);
    if (list.length === 0) return defaultDesc || 'Music curated for you';
    if (list.length === 1) return `${list[0]} and more`;
    if (list.length === 2) return `${list[0]}, ${list[1]} and more`;
    return `${list[0]}, ${list[1]}, ${list[2]} and more`;
  };

  // Helper: get cover art with fallback
  const resolveMixCover = (mixSongs, fallbackSvg) => {
    if (mixSongs && mixSongs.length > 0) {
      const first = mixSongs[0];
      if (first.coverUrl && typeof first.coverUrl === 'string' && first.coverUrl.trim().length > 0 && !first.coverUrl.includes('ui-avatars.com')) {
        return first.coverUrl;
      }
      if (first.id) {
        return `${API_BASE_URL}/api/music/cover/${first.id}`;
      }
    }
    return fallbackSvg;
  };

  // === 5. Discover Weekly / On Repeat ===
  const songPlayCounts = {};
  history.forEach(h => {
    const key = (h.id || h.title || '').trim().toLowerCase();
    if (key) songPlayCounts[key] = (songPlayCounts[key] || 0) + 1;
  });
  const repeatedKeys = Object.keys(songPlayCounts).filter(k => songPlayCounts[k] >= 2);

  let mix5;
  if (repeatedKeys.length >= 3) {
    let onRepeatSongs = catalog.filter(t => {
      const keyId = (t.id || '').trim().toLowerCase();
      const keyTitle = (t.title || '').trim().toLowerCase();
      return (keyId && repeatedKeys.includes(keyId)) || (keyTitle && repeatedKeys.includes(keyTitle));
    });
    onRepeatSongs.sort((a, b) => {
      const countA = (songPlayCounts[(a.id || '').toLowerCase()] || 0) + (songPlayCounts[(a.title || '').toLowerCase()] || 0);
      const countB = (songPlayCounts[(b.id || '').toLowerCase()] || 0) + (songPlayCounts[(b.title || '').toLowerCase()] || 0);
      return countB - countA;
    });
    onRepeatSongs = dedupe(onRepeatSongs);
    const onRepeatSvg = createMixCoverSvg('ON REPEAT', 'FAVORITES', '#11998e', '#38ef7d');
    const onRepeatCover = resolveMixCover(onRepeatSongs, onRepeatSvg);

    mix5 = {
      id: 'mix-on-repeat',
      name: 'On Repeat',
      title: 'On Repeat',
      desc: describeArtists(onRepeatSongs, null, 'The songs you love most right now'),
      description: 'The songs you love most right now',
      type: 'Playlist',
      isMix: true,
      coverUrl: onRepeatCover,
      imageUrl: onRepeatCover,
      fallbackSvg: onRepeatSvg,
      songs: onRepeatSongs
    };
  } else {
    const listenedKeys = new Set(history.map(h => (h.id || h.title || '').trim().toLowerCase()).filter(Boolean));
    let unlistened = catalog.filter(t => {
      const keyId = (t.id || '').trim().toLowerCase();
      const keyTitle = (t.title || '').trim().toLowerCase();
      return !listenedKeys.has(keyId) && !listenedKeys.has(keyTitle);
    });

    const topGenreSet = new Set(topGenres.map(g => (g.genre || '').toLowerCase()).filter(Boolean));
    if (topGenreSet.size > 0 && unlistened.length > 5) {
      unlistened.sort((a, b) => {
        const matchA = topGenreSet.has((a.genre || '').toLowerCase()) ? 1 : 0;
        const matchB = topGenreSet.has((b.genre || '').toLowerCase()) ? 1 : 0;
        return matchB - matchA;
      });
    }

    let discoverSongs = unlistened.slice(0, 15);
    if (discoverSongs.length < 5) {
      discoverSongs = dedupe([...discoverSongs, ...catalog.slice(0, 15)]);
    }

    const discoverSvg = createMixCoverSvg('DISCOVER', 'WEEKLY', '#654ea3', '#eaafc8');
    const discoverCover = resolveMixCover(discoverSongs, discoverSvg);

    mix5 = {
      id: 'mix-discover-weekly',
      name: 'Discover Weekly',
      title: 'Discover Weekly',
      desc: describeArtists(discoverSongs, null, 'New music based on your listening'),
      description: 'New music based on your listening',
      type: 'Playlist',
      isMix: true,
      coverUrl: discoverCover,
      imageUrl: discoverCover,
      fallbackSvg: discoverSvg,
      songs: discoverSongs
    };
  }

  return [...buildDailyMixCards(catalog), mix5];
}

// Daily mixes are built by the server (same on every device); this only turns them into cards.
const MIX_COLORS = [['#00b4db', '#0083b0'], ['#ec008c', '#fc6767'], ['#f12711', '#f5af19'], ['#134e5e', '#71b280']];
let dailyMixes = [];
let dailyMixKey = '';
let dailyMixFetchedAt = 0;

function buildDailyMixCards(catalog) {
  const byId = new Map(catalog.map(t => [String(t.id), t]));
  return dailyMixes.map((mix, i) => {
    const songs = mix.songIds.map(id => byId.get(String(id))).filter(Boolean);
    const [from, to] = MIX_COLORS[i % MIX_COLORS.length];
    const fallbackSvg = createMixCoverSvg(mix.title, mix.anchor, from, to);
    const first = songs.find(s => s.artist && s.artist.startsWith(mix.anchor)) || songs[0];
    const cover = (first && first.coverUrl) || fallbackSvg;
    return {
      id: mix.id,
      name: mix.title,
      title: mix.title,
      desc: mix.description,
      description: mix.description,
      type: 'Playlist',
      isMix: true,
      coverUrl: cover,
      imageUrl: cover,
      fallbackSvg,
      songs
    };
  }).filter(mix => mix.songs.length > 0);
}

// Re-fetches when the account or day changes, otherwise at most every 10 minutes.
async function refreshDailyMixes() {
  const key = `${localStorage.getItem(authTokenKey) || 'guest'}|${new Date().toDateString()}`;
  if (key === dailyMixKey && Date.now() - dailyMixFetchedAt < 600000) return;
  dailyMixKey = key;
  dailyMixFetchedAt = Date.now();
  try {
    const response = await authenticatedFetch('/api/recommendations/daily-mixes');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const mixes = data.mixes || [];
    if (JSON.stringify(mixes) !== JSON.stringify(dailyMixes)) {
      dailyMixes = mixes;
      populateMadeForYou();
    }
  } catch (err) {
    console.warn('Daily mixes unavailable:', err);
    dailyMixFetchedAt = 0;
  }
}

export function populateMadeForYou() {
  const carousel = document.getElementById('homeMadeForYouCarousel');
  if (!carousel) return;

  refreshDailyMixes();
  state.currentMadeForYouMixes = generateMadeForYouMixes();
  if (!state.currentMadeForYouMixes || !state.currentMadeForYouMixes.length) {
    carousel.innerHTML = '<div style="color: var(--muted); padding: 16px;">No recommendations available yet.</div>';
    return;
  }

  carousel.innerHTML = '';
  state.currentMadeForYouMixes.forEach(mix => {
    const card = document.createElement('div');
    card.className = 'mix-card';
    card.setAttribute('data-mix-id', mix.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.title = `${mix.title} - ${mix.desc}`;

    const coverSrc = mix.coverUrl || mix.imageUrl || mix.fallbackSvg;

    card.innerHTML = `
      <div class="mix-card-img-wrapper">
        <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(mix.title)}" onerror="this.onerror=null; this.src='${escapeHtml(mix.fallbackSvg || '')}';" loading="lazy">
        <button class="mix-card-play-btn" title="Play ${escapeHtml(mix.title)}" aria-label="Play ${escapeHtml(mix.title)}">
          <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
          </svg>
        </button>
      </div>
      <div class="mix-card-title">${escapeHtml(mix.title)}</div>
      <div class="mix-card-desc">${escapeHtml(mix.desc)}</div>
    `;

    // Play button starts playback immediately
    const playBtn = card.querySelector('.mix-card-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playPlaylistContext(mix, 0);
      });
    }

    // Card body click opens playlist detail view
    card.addEventListener('click', (e) => {
      if (e.target.closest('.mix-card-play-btn')) return;
      openPlaylistDetailView(mix);
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        openPlaylistDetailView(mix);
      }
    });

    carousel.appendChild(card);
  });
}

export function updateHomeGreeting() {
  const el = document.getElementById('homeGreeting');
  if (!el) return;
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) el.textContent = 'Good morning';
  else if (hour >= 12 && hour < 18) el.textContent = 'Good afternoon';
  else el.textContent = 'Good evening';
}

export function setHomeCategoryFilter(filter, btn) {
  document.querySelectorAll('.home-header .pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const madeForYouSec = document.getElementById('homeMadeForYouSection');
  const recentlyPlayedSec = document.getElementById('homeRecentlyPlayedSection');
  const popularAlbumsSec = document.getElementById('homePopularAlbumsSection');
  const popularArtistsSec = document.getElementById('homePopularArtistsSection');
  const featuredPlaylistsSec = document.getElementById('homeFeaturedPlaylistsSection');
  const podcastsSec = document.getElementById('homePodcastsSection');
  const quickGrid = document.getElementById('homeQuickGrid');
  const greeting = document.getElementById('homeGreeting');

  if (filter === 'podcasts') {
    if (quickGrid) quickGrid.style.display = 'none';
    if (greeting) greeting.style.display = 'none';
    if (madeForYouSec) madeForYouSec.style.display = 'none';
    if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'none';
    if (popularAlbumsSec) popularAlbumsSec.style.display = 'none';
    if (popularArtistsSec) popularArtistsSec.style.display = 'none';
    if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'none';
    if (podcastsSec) {
      podcastsSec.style.display = 'block';
      populateHomePodcasts();
    }
  } else if (filter === 'music') {
    if (quickGrid) quickGrid.style.display = 'grid';
    if (greeting) greeting.style.display = 'block';
    if (madeForYouSec) madeForYouSec.style.display = 'block';
    if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'block';
    if (popularAlbumsSec) popularAlbumsSec.style.display = 'block';
    if (popularArtistsSec) popularArtistsSec.style.display = 'block';
    if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'block';
    if (podcastsSec) podcastsSec.style.display = 'none';
  } else {
    // all
    if (quickGrid) quickGrid.style.display = 'grid';
    if (greeting) greeting.style.display = 'block';
    if (madeForYouSec) madeForYouSec.style.display = 'block';
    if (recentlyPlayedSec) recentlyPlayedSec.style.display = 'block';
    if (popularAlbumsSec) popularAlbumsSec.style.display = 'block';
    if (popularArtistsSec) popularArtistsSec.style.display = 'block';
    if (featuredPlaylistsSec) featuredPlaylistsSec.style.display = 'block';
    if (podcastsSec) podcastsSec.style.display = 'none';
  }
}

export function renderCardCarousel(container, items) {
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `home-card ${item.isArtist ? 'is-artist' : ''}`;
    card.title = `${item.title} - ${item.subtitle}`;
    card.innerHTML = `
      <div class="home-card-img-wrap">
        ${item.coverHtml ? item.coverHtml : `<img src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://ui-avatars.com/api/?name=Music&background=282828&color=fff&size=180'" loading="lazy">`}
        <button class="home-card-play-btn" title="Play ${escapeHtml(item.title)}">
          <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"></path>
          </svg>
        </button>
      </div>
      <div class="home-card-title">${escapeHtml(item.title)}</div>
      <div class="home-card-desc">${escapeHtml(item.subtitle)}</div>
    `;

    const playBtn = card.querySelector('.home-card-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof item.playAction === 'function') item.playAction();
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.home-card-play-btn')) return;
      if (typeof item.clickAction === 'function') item.clickAction();
    });

    container.appendChild(card);
  });
}

export function populateHomeRecentlyPlayed() {
  const carousel = document.getElementById('homeRecentlyPlayedCarousel');
  const section = document.getElementById('homeRecentlyPlayedSection');
  if (!carousel) return;

  const history = typeof SpotifakeHistory !== 'undefined' ? SpotifakeHistory.getRecentItems(10) : [];
  if (!history || !history.length) {
    const fallback = (state.tracks || []).slice(0, 6);
    if (!fallback.length) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';
    renderCardCarousel(carousel, fallback.map(t => ({
      title: t.title || t.fileName,
      subtitle: t.artist || 'Song',
      coverUrl: t.coverUrl || t.coverArtUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.title)}&background=282828&color=1db954&size=180`,
      type: 'Song',
      id: t.id || t.fileName,
      playAction: () => {
        loadTrack(t, true);
      },
      clickAction: () => {
        if (window.openSongDetailView) window.openSongDetailView(t);
        else loadTrack(t, true);
      }
    })));
    return;
  }

  if (section) section.style.display = 'block';
  const seen = new Set();
  const uniqueItems = [];
  for (const h of history) {
    const key = (h.title || h.id || '').toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(h);
      if (uniqueItems.length >= 6) break;
    }
  }

  renderCardCarousel(carousel, uniqueItems.map(item => ({
    title: item.title || 'Untitled',
    subtitle: item.artist || item.type || 'Recent',
    coverUrl: item.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=282828&color=1db954&size=180`,
    type: item.type || 'Song',
    id: item.id,
    playAction: () => {
      const t = state.tracks.find(x => x.id === item.id || x.title === item.title);
      if (t) loadTrack(t, true);
      else loadTrack(item, true);
    },
    clickAction: () => {
      if (item.type === 'Album' && item.albumId && window.openAlbumDetailView) {
        window.openAlbumDetailView(item.albumId);
      } else if (item.type === 'Artist' && window.openArtistDetailView) {
        window.openArtistDetailView(item.artist || item.title);
      } else {
        const t = state.tracks.find(x => x.id === item.id || x.title === item.title);
        if (t && window.openSongDetailView) window.openSongDetailView(t);
        else loadTrack(t || item, true);
      }
    }
  })));
}

export async function populateHomePopularAlbums() {
  const carousel = document.getElementById('homePopularAlbumsCarousel');
  const section = document.getElementById('homePopularAlbumsSection');
  if (!carousel) return;

  let albumList = [];
  try {
    const res = await authenticatedFetch('/api/albums');
    if (res.ok) {
      albumList = await res.json();
    }
  } catch (e) {}

  if (!albumList || !albumList.length) {
    const map = new Map();
    (state.tracks || []).forEach(t => {
      if (t.album && t.album.toLowerCase() !== 'single' && t.album.toLowerCase() !== 'unknown album') {
        if (!map.has(t.album)) {
          map.set(t.album, {
            id: t.albumId || t.album,
            albumId: t.albumId,
            title: t.album,
            artist: t.artist || 'Various Artists',
            coverUrl: t.coverUrl || t.coverArtUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.album)}&background=282828&color=1db954&size=180`
          });
        }
      }
    });
    albumList = Array.from(map.values());
  }

  if (!albumList.length) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = 'block';

  renderCardCarousel(carousel, albumList.slice(0, 7).map(a => ({
    title: a.title || a.name,
    subtitle: `${a.artist || 'Album'} • Album`,
    coverUrl: a.coverArtUrl || a.coverUrl || a.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.title)}&background=282828&color=1db954&size=180`,
    type: 'Album',
    id: a.id || a.albumId,
    playAction: () => {
      if (window.openAlbumDetailView) window.openAlbumDetailView(a.id || a.albumId || a.title);
    },
    clickAction: () => {
      if (window.openAlbumDetailView) window.openAlbumDetailView(a.id || a.albumId || a.title);
    }
  })));
}

export function populateHomePopularArtists() {
  const carousel = document.getElementById('homePopularArtistsCarousel');
  const section = document.getElementById('homePopularArtistsSection');
  if (!carousel) return;

  const artistMap = new Map();
  (state.tracks || []).forEach(t => {
    if (t.artist && t.artist !== 'Unknown Artist') {
      const name = t.artist.trim();
      const prev = artistMap.get(name);
      const count = (prev?.count || 0) + 1;
      const cover = t.coverUrl || t.coverArtUrl || prev?.cover || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff&size=180`;
      artistMap.set(name, { name, count, cover, artistId: t.artistId });
    }
  });

  const topArtists = Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, 7);
  if (!topArtists.length) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = 'block';

  renderCardCarousel(carousel, topArtists.map(art => ({
    title: art.name,
    subtitle: 'Artist',
    coverUrl: art.cover,
    isArtist: true,
    type: 'Artist',
    id: art.name,
    playAction: () => {
      if (window.openArtistDetailView) window.openArtistDetailView(art.artistId || art.name);
    },
    clickAction: () => {
      if (window.openArtistDetailView) window.openArtistDetailView(art.artistId || art.name);
    }
  })));
}

export function populateHomeFeaturedPlaylists() {
  const carousel = document.getElementById('homeFeaturedPlaylistsCarousel');
  const section = document.getElementById('homeFeaturedPlaylistsSection');
  if (!carousel) return;

  const featured = [];
  (state.userPlaylists || []).forEach(pl => {
    if ((pl.name || '').toLowerCase() !== 'liked songs') {
      featured.push({
        title: pl.name,
        subtitle: `${pl.songs ? pl.songs.length : 0} songs • Playlist`,
        coverUrl: pl.imageUrl || (pl.songs && pl.songs[0] ? (pl.songs[0].coverUrl || '') : '') || `https://ui-avatars.com/api/?name=${encodeURIComponent(pl.name)}&background=1e3264&color=fff&size=180`,
        coverHtml: playlistCoverHtml(pl, { iconSize: 48 }),
        type: 'Playlist',
        id: pl.id,
        playAction: () => {
          if (pl.songs && pl.songs.length) playPlaylistContext(pl, 0);
        },
        clickAction: () => {
          openPlaylistDetailView(pl);
        }
      });
    }
  });

  if (featured.length < 5) {
    featured.push({
      title: "Today's Top Hits",
      subtitle: "The most played tracks right now",
      coverUrl: "https://ui-avatars.com/api/?name=Top+Hits&background=148a08&color=fff&size=180",
      type: 'Playlist',
      id: 'pl-tth',
      playAction: () => {
        state.activeQueue = [...state.tracks];
        state.currentQueueTitle = "Today's Top Hits";
        buildQueueOrder();
        loadTrack(0, true);
      },
      clickAction: () => {
        openPlaylistDetailView({ name: "Today's Top Hits", songs: state.tracks.slice(0, 15) });
      }
    });
    featured.push({
      title: "Best of Indie Việt",
      subtitle: "Thắng, Ngọt, Thịnh Suy, and more",
      coverUrl: "https://ui-avatars.com/api/?name=Indie+Viet&background=ec008c&color=fff&size=180",
      type: 'Playlist',
      id: 'pl-indie-viet',
      playAction: () => {
        const indieTracks = state.tracks.filter(t => /thắng|ngọt/i.test(t.artist || ''));
        state.activeQueue = indieTracks.length ? indieTracks : [...state.tracks];
        state.currentQueueTitle = "Best of Indie Việt";
        buildQueueOrder();
        loadTrack(0, true);
      },
      clickAction: () => {
        const indieTracks = state.tracks.filter(t => /thắng|ngọt/i.test(t.artist || ''));
        openPlaylistDetailView({ name: "Best of Indie Việt", songs: indieTracks.length ? indieTracks : state.tracks.slice(0, 10) });
      }
    });
  }

  if (section) section.style.display = 'block';
  renderCardCarousel(carousel, featured.slice(0, 7));
}

export function populateHomePodcasts() {
  const carousel = document.getElementById('homePodcastsCarousel');
  if (!carousel) return;

  const podcasts = [
    { title: "The Joe Rogan Experience", publisher: "Joe Rogan", cover: "https://ui-avatars.com/api/?name=JRE&background=bc5900&color=fff&size=180" },
    { title: "Huberman Lab", publisher: "Scicomm Media", cover: "https://ui-avatars.com/api/?name=Huberman&background=0083b0&color=fff&size=180" },
    { title: "TED Talks Daily", publisher: "TED", cover: "https://ui-avatars.com/api/?name=TED&background=e91429&color=fff&size=180" },
    { title: "Have A Sip", publisher: "Vietcetera", cover: "https://ui-avatars.com/api/?name=Vietcetera&background=8d67ab&color=fff&size=180" },
    { title: "Lex Fridman Podcast", publisher: "Lex Fridman", cover: "https://ui-avatars.com/api/?name=Lex&background=333&color=fff&size=180" }
  ];

  renderCardCarousel(carousel, podcasts.map(p => ({
    title: p.title,
    subtitle: `Show • ${p.publisher}`,
    coverUrl: p.cover,
    type: 'Podcast',
    id: p.title,
    playAction: () => {
      showToast('info', 'Podcasts', `Streaming ${p.title}`);
    },
    clickAction: () => {
      showToast('info', 'Podcasts', `Viewing ${p.title}`);
    }
  })));
}

export function initAllHomeSections() {
  updateHomeGreeting();
  populateHomeGrid();
  populateMadeForYou();
  populateHomeRecentlyPlayed();
  populateHomePopularAlbums();
  populateHomePopularArtists();
  populateHomeFeaturedPlaylists();
}

export function populateBrowseAll() {
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

export function initHome2() {
initAllHomeSections();

populateBrowseAll();
}

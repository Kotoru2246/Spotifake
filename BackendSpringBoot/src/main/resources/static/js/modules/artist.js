// Split from the former site.js (feature: artist). See docs/architecture.md.
import { state } from './state.js';
import { navSetRestore } from './nav.js';
import { authenticatedFetch } from './api.js';
import { openReportSongModal } from './checkout.js';
import { showSection } from './library.js';
import { loadUserPlaylists, openAddSongToPlaylistModal, openLikedSongsPlaylist, openPlaylistById, playPlaylistContext, renderPlaylistSongs } from './playlists.js';
import { buildQueueOrder, getCurrentQueue, renderQueue } from './queue.js';
import { isTrackLiked } from './songDetail.js';
import { escapeHtml, formatTime, normalizeBackendSong, showToast } from './utils.js';

export function openTrackMenu(e, fileName, songId, albumId, artistId, artistName, fromPlaylistId) {
    if (e) e.stopPropagation();

    // Resolve track details from tracks or current playlist if missing
    let resolvedArtist = artistId;
    let resolvedAlbum = albumId;
    let resolvedSongId = songId;
    let resolvedFileName = fileName;

    let foundTrack = null;
    if (typeof state.tracks !== 'undefined' && Array.isArray(state.tracks)) {
        foundTrack = state.tracks.find(t => (fileName && (t.fileName === fileName || t.title === fileName)) || (songId && t.id === songId));
    }
    if (!foundTrack && state.currentViewedPlaylist && Array.isArray(state.currentViewedPlaylist.songs)) {
        foundTrack = state.currentViewedPlaylist.songs.find(s => {
            if (typeof s === 'string') return s === fileName;
            return (fileName && (s.fileName === fileName || s.title === fileName)) || (songId && s.id === songId);
        });
    }

    if (foundTrack && typeof foundTrack === 'object') {
        if (!resolvedArtist) resolvedArtist = foundTrack.artistId || foundTrack.artist || foundTrack.artistName;
        if (!resolvedAlbum) resolvedAlbum = foundTrack.albumId || foundTrack.album;
        if (!resolvedSongId) resolvedSongId = foundTrack.id || foundTrack.Id;
        if (!resolvedFileName) resolvedFileName = foundTrack.fileName || foundTrack.filePath || foundTrack.title;
    }
    if (!resolvedArtist && artistName) resolvedArtist = artistName;

    const activePlaylistId = fromPlaylistId || (state.currentViewedPlaylist ? state.currentViewedPlaylist.id : '') || (typeof state.selectedPlaylistId !== 'undefined' ? state.selectedPlaylistId : '');

    state.contextMenuTargetSong = {
        fileName: resolvedFileName || fileName,
        songId: resolvedSongId || '',
        albumId: resolvedAlbum || '',
        artistId: resolvedArtist || '',
        artistName: artistName || (foundTrack && typeof foundTrack === 'object' ? (foundTrack.artist || foundTrack.artistName) : ''),
        playlistId: activePlaylistId
    };

    const menu = document.getElementById('trackContextMenu');
    if (menu) {
        menu.style.display = 'block';
        menu.style.left = (e && e.pageX ? e.pageX : 100) + 'px';
        menu.style.top = (e && e.pageY ? e.pageY : 100) + 'px';
        
        const goToAlbumOption = document.getElementById('trackMenuGoToAlbum');
        if (goToAlbumOption) {
            if (resolvedAlbum && resolvedAlbum !== 'null' && resolvedAlbum !== '') {
                goToAlbumOption.style.display = 'block';
            } else {
                goToAlbumOption.style.display = 'none';
            }
        }

        const removeOption = document.getElementById('trackMenuRemoveFromPlaylist');
        if (removeOption) {
            const isViewingPlaylist = (state.currentViewedPlaylist && document.getElementById('playlist-view')?.classList.contains('active')) ||
                                      (activePlaylistId && document.getElementById('playlists')?.classList.contains('active')) ||
                                      Boolean(fromPlaylistId);
            const isAlbumOrSingle = state.currentViewedPlaylist && (state.currentViewedPlaylist.type === 'Album' || state.currentViewedPlaylist.type === 'Single' || state.currentViewedPlaylist.isAlbum);
            if (isViewingPlaylist && !isAlbumOrSingle) {
                removeOption.style.display = 'block';
            } else {
                removeOption.style.display = 'none';
            }
        }
    }
}

export function initArtist1() {
document.addEventListener('click', function(e) {
      const menu = document.getElementById('trackContextMenu');
      if (menu && menu.style.display === 'block') {
          menu.style.display = 'none';
      }
  });
}

export async function trackMenuAction(action) {
    if (!state.contextMenuTargetSong) return;
    const { fileName, songId, albumId, artistId, artistName, playlistId } = state.contextMenuTargetSong;

    switch(action) {
        case 'add-to-queue':
            if (fileName || songId) {
                let targetTrack = state.tracks.find(t => (songId && (t.id === songId || t.Id === songId)) || (fileName && (t.fileName === fileName || t.title === fileName)));
                if (!targetTrack && typeof state.userPlaylists !== 'undefined') {
                    const plSong = state.userPlaylists.flatMap(p => p.songs || []).find(s => (songId && (s.id === songId || s.Id === songId)) || (fileName && (s.fileName === fileName || s.title === fileName)));
                    if (plSong) targetTrack = normalizeBackendSong(plSong);
                }
                if (!targetTrack && state.currentViewedPlaylist && state.currentViewedPlaylist.songs) {
                    const pvSong = state.currentViewedPlaylist.songs.find(s => (songId && (s.id === songId || s.Id === songId)) || (fileName && (s.fileName === fileName || s.title === fileName)));
                    if (pvSong) targetTrack = normalizeBackendSong(pvSong);
                }

                if (targetTrack) {
                    if (!state.activeQueue || state.activeQueue.length === 0) {
                        state.activeQueue = [...state.tracks];
                    }
                    
                    const insertIdx = (typeof state.currentTrackIndex === 'number' && state.currentTrackIndex >= 0 && state.currentTrackIndex < state.activeQueue.length)
                        ? state.currentTrackIndex + 1
                        : state.activeQueue.length;
                    
                    state.activeQueue.splice(insertIdx, 0, targetTrack);
                    buildQueueOrder();
                    renderQueue();
                    showToast('success', 'Queue Updated', `Added "${targetTrack.title || 'song'}" to queue.`);
                } else {
                    showToast('error', 'Queue', 'Could not locate track details.');
                }
            }
            break;
        case 'save-to-liked':
            if (songId || fileName) {
                try {
                    const res = await authenticatedFetch('/api/playlists/toggle-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: fileName || songId, songFileName: fileName || songId, songId: songId || '' })
                    });
                    if (res.ok) {
                        showToast('success', 'Liked Songs', 'Updated Liked Songs');
                        if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                    }
                } catch(e) {}
            }
            break;
        case 'remove-from-playlist':
            let targetPlaylist = state.currentViewedPlaylist;
            if (!targetPlaylist && playlistId && typeof state.userPlaylists !== 'undefined') {
                targetPlaylist = state.userPlaylists.find(p => p.id === playlistId);
            }
            if (!targetPlaylist && typeof state.selectedPlaylistId !== 'undefined' && state.selectedPlaylistId && typeof state.userPlaylists !== 'undefined') {
                targetPlaylist = state.userPlaylists.find(p => p.id === state.selectedPlaylistId);
            }
            if (!targetPlaylist) {
                showToast('error', 'Playlist', 'No playlist active.');
                break;
            }
            const songTarget = fileName || songId;
            const isLiked = targetPlaylist.name === 'Liked Songs' || targetPlaylist.id === 'liked-songs' || (targetPlaylist.id && targetPlaylist.id.startsWith('liked-songs'));
            if (isLiked) {
                try {
                    const res = await authenticatedFetch('/api/playlists/toggle-favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: songTarget, songFileName: songTarget, songId: songId || '' })
                    });
                    if (res.ok) {
                        showToast('success', 'Liked Songs', 'Song removed from Liked Songs');
                        if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                        if (typeof openLikedSongsPlaylist === 'function') await openLikedSongsPlaylist();
                    }
                } catch(e) {
                    console.error(e);
                    showToast('error', 'Error', 'Failed to remove song');
                }
            } else if (targetPlaylist.id) {
                try {
                    const res = await authenticatedFetch(`/api/playlists/${encodeURIComponent(targetPlaylist.id)}/songs`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileName: songTarget, songFileName: songTarget, songId: songId || '' })
                    });
                    if (res.ok) {
                        showToast('success', 'Playlist', 'Song removed from playlist');
                        if (typeof loadUserPlaylists === 'function') await loadUserPlaylists();
                        if (typeof openPlaylistById === 'function') await openPlaylistById(targetPlaylist.id);
                        if (typeof renderPlaylistSongs === 'function') renderPlaylistSongs();
                    } else {
                        showToast('error', 'Playlist', 'Could not remove song from playlist');
                    }
                } catch(e) {
                    console.error(e);
                    showToast('error', 'Playlist', 'Failed to remove song');
                }
            }
            break;
        case 'add-to-playlist':
            if (fileName || songId) {
                openAddSongToPlaylistModal(songId || fileName);
            } else {
                showToast('info', 'Add to Playlist', 'No song selected');
            }
            break;
        case 'go-to-artist':
            const targetArtist = artistId || artistName || (state.contextMenuTargetSong && (state.contextMenuTargetSong.artistId || state.contextMenuTargetSong.artistName));
            if (targetArtist && targetArtist !== 'null' && targetArtist !== '') {
                openArtistDetailView(targetArtist);
            } else {
                showToast('error', 'Navigation', 'Artist information not available.');
            }
            break;
        case 'go-to-album':
            if (state.contextMenuTargetSong && state.contextMenuTargetSong.albumId && state.contextMenuTargetSong.albumId !== 'null') {
                window.openAlbumDetailView(state.contextMenuTargetSong.albumId);
            } else {
                showToast('info', 'Not Available', 'Album information not available.');
            }
            break;
        case 'share':
            showToast('success', 'Share', 'Link copied to clipboard!');
            break;
        case 'report-song':
            let repTrack = null;
            if (typeof state.tracks !== 'undefined' && Array.isArray(state.tracks)) {
                repTrack = state.tracks.find(t => (songId && (t.id === songId || t.Id === songId)) || (fileName && (t.fileName === fileName || t.title === fileName)));
            }
            if (!repTrack) {
                repTrack = { id: songId, fileName: fileName, title: fileName, artist: artistName || '' };
            }
            openReportSongModal(repTrack);
            break;
    }
    state.contextMenuTargetSong = null;
}

export async function openArtistDetailView(artistId) {
    if (!artistId || artistId === 'null') {
        showToast('error', 'Navigation', 'Artist information not available.');
        return;
    }
    showSection('artist-view');
    navSetRestore(() => openArtistDetailView(artistId));
    try {
        const res = await authenticatedFetch(`/api/artists?name=${encodeURIComponent(artistId)}&artistId=${encodeURIComponent(artistId)}`);
        if (!res.ok) throw new Error('Failed to fetch artist');
        const data = await res.json();
        
        // 1. Hero Banner
        const heroBg = document.getElementById('artistHeroBg');
        if (heroBg) {
            const bgUrl = data.bannerUrl || data.profileUrl || '';
            if (bgUrl) {
                heroBg.style.backgroundImage = `url('${bgUrl}')`;
            } else {
                heroBg.style.backgroundImage = 'none';
                heroBg.style.backgroundColor = '#222';
            }
        }
        
        const verifiedEl = document.getElementById('artistViewVerified');
        if (verifiedEl) {
            verifiedEl.hidden = !data.verified;
        }
        
        document.getElementById('artistViewName').textContent = data.name;
        document.getElementById('artistViewListeners').textContent = (data.monthlyListeners || 688312).toLocaleString() + ' monthly listeners';
        
        currentArtistContext = { id: data.id, type: 'Artist', name: data.name, songs: data.popularSongs || [] };
        state.currentViewedPlaylist = null;
        window.playArtistTrack = function(idx) {
            if (currentArtistContext && currentArtistContext.songs && currentArtistContext.songs.length) {
                playPlaylistContext(currentArtistContext, idx);
            }
        };
        
        // 2. Action Bar
        const artistPlayBtn = document.getElementById('artistPlayBtn');
        if (artistPlayBtn) {
          artistPlayBtn.onclick = function() {
            if (currentArtistContext && currentArtistContext.songs.length) {
              playPlaylistContext(currentArtistContext, 0);
            }
          };
        }

        const followBtn = document.getElementById('artistFollowBtn');
        if (followBtn) {
            followBtn.onclick = function() {
                const isFollowing = followBtn.classList.contains('following');
                if (!isFollowing) {
                    followBtn.classList.add('following');
                    followBtn.textContent = 'Following';
                    showToast('success', 'Following Artist', `You are now following ${data.name}!`);
                } else {
                    followBtn.classList.remove('following');
                    followBtn.textContent = 'Follow';
                    showToast('info', 'Unfollowed Artist', `You unfollowed ${data.name}.`);
                }
            };
        }

        const moreBtn = document.getElementById('artistMoreBtn');
        if (moreBtn) {
            moreBtn.onclick = function(e) {
                e.stopPropagation();
                showToast('info', data.name, 'Artist options menu');
            };
        }

        // 3. Popular Tracks Table
        const popularContainer = document.getElementById('artistPopularTracks');
        const seeMoreBtn = document.getElementById('artistShowMorePopularBtn');
        let popularExpanded = false;

        function renderPopularRows() {
            if (!data.popularSongs || data.popularSongs.length === 0) {
                popularContainer.innerHTML = '<div style="color:#b3b3b3; padding: 12px 16px;">No popular tracks found.</div>';
                if (seeMoreBtn) seeMoreBtn.style.display = 'none';
                return;
            }

            const visibleSongs = popularExpanded ? data.popularSongs : data.popularSongs.slice(0, 5);
            const curTrack = getCurrentQueue()[state.currentTrackIndex];
            const isCurrentPlayingArtist = currentArtistContext && currentArtistContext.name === data.name;

            popularContainer.innerHTML = visibleSongs.map((s, idx) => {
                const isTrackActive = isCurrentPlayingArtist && curTrack && (curTrack.id === s.id || curTrack.title === s.title);
                const isLiked = typeof isTrackLiked === 'function' ? isTrackLiked(s) : false;
                const playsFormatted = (s.playCount || 0).toLocaleString();
                const durationSec = s.duration || 180;
                const durationStr = formatTime(durationSec);
                const collabText = s.collabArtists ? `${s.collabArtists}, ${data.name}` : (s.artist || data.name);

                return `
                    <div class="spotify-track-row ${isTrackActive ? 'is-active' : ''}" 
                         onclick="window.playArtistTrack(${idx})"
                         data-song-idx="${idx}">
                        <div class="track-index-col">
                            <span class="track-index-number">${idx + 1}</span>
                            <span class="track-index-play">▶</span>
                        </div>
                        <div class="track-main-col">
                            <img class="track-thumb-img" src="${s.coverUrl || 'https://via.placeholder.com/44'}" alt="art" onerror="this.src='https://via.placeholder.com/44'">
                            <div class="track-meta-stack">
                                <div class="track-title-text" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</div>
                                <div class="track-artist-subtext" title="${escapeHtml(collabText)}">${escapeHtml(collabText)}</div>
                            </div>
                        </div>
                        <div class="track-plays-col">${playsFormatted}</div>
                        <div class="track-actions-col">
                            <button class="track-row-heart-btn ${isLiked ? 'is-liked' : ''}" 
                                    title="Save to Liked Songs" 
                                    onclick="event.stopPropagation(); if (window.trackMenuAction) { contextMenuTargetSong = { fileName: '${escapeHtml(s.fileName)}', songId: '${escapeHtml(s.id)}' }; trackMenuAction('save-to-liked'); this.classList.toggle('is-liked'); }">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </button>
                            <span class="track-duration-text">${durationStr}</span>
                            <button class="track-row-more-btn" title="More options" onclick="event.stopPropagation(); openTrackMenu(event, '${escapeHtml(s.fileName)}', '${escapeHtml(s.id)}', '', '${escapeHtml(data.id)}')">
                                <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm15 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            if (seeMoreBtn) {
                if (data.popularSongs.length > 5) {
                    seeMoreBtn.style.display = 'inline-block';
                    seeMoreBtn.textContent = popularExpanded ? 'Show less' : 'See more';
                } else {
                    seeMoreBtn.style.display = 'none';
                }
            }
        }

        renderPopularRows();

        if (seeMoreBtn) {
            seeMoreBtn.onclick = function() {
                popularExpanded = !popularExpanded;
                renderPopularRows();
            };
        }

        // 4. Discography Section with Live Filtering
        const discoContainer = document.getElementById('artistDiscography');
        const filterChips = document.querySelectorAll('#discographyFilterChips .disco-filter-chip');
        let currentFilter = 'popular';

        function renderDiscography(filter) {
            if (!data.discography || data.discography.length === 0) {
                discoContainer.innerHTML = '<div style="color:#b3b3b3; padding: 12px 16px;">No releases found.</div>';
                return;
            }

            let filtered = data.discography;
            if (filter === 'albums') {
                filtered = data.discography.filter(a => String(a.type).toLowerCase() === 'album');
            } else if (filter === 'singles') {
                filtered = data.discography.filter(a => {
                    const t = String(a.type).toLowerCase();
                    return t === 'single' || t === 'ep';
                });
            }

            if (filtered.length === 0) {
                discoContainer.innerHTML = `<div style="color:#b3b3b3; padding: 12px 16px;">No ${filter} found for this artist.</div>`;
                return;
            }

            discoContainer.innerHTML = filtered.map(a => {
                const subtitleText = (a.isLatest ? 'Latest Release • ' : '') + `${a.year || '2024'} • ${a.type || 'Album'}`;
                return `
                    <div class="spotify-release-card" onclick="window.openAlbumDetailView('${escapeHtml(a.id)}')">
                        <div class="release-img-wrap">
                            <img src="${a.coverUrl || 'https://via.placeholder.com/180'}" alt="${escapeHtml(a.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/180'">
                            <button class="release-floating-play" title="Play ${escapeHtml(a.title)}" onclick="event.stopPropagation(); if (window.openAlbumDetailView) { window.openAlbumDetailView('${escapeHtml(a.id)}'); }">
                                <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                                </svg>
                            </button>
                        </div>
                        <div class="release-card-title" title="${escapeHtml(a.title)}">${escapeHtml(a.title)}</div>
                        <div class="release-card-sub">${escapeHtml(subtitleText)}</div>
                    </div>
                `;
            }).join('');
        }

        renderDiscography(currentFilter);

        filterChips.forEach(chip => {
            chip.onclick = function() {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilter = chip.getAttribute('data-filter') || 'popular';
                renderDiscography(currentFilter);
            };
        });

        const showAllBtn = document.getElementById('artistDiscographyShowAllBtn');
        if (showAllBtn) {
            showAllBtn.onclick = function() {
                filterChips.forEach(c => c.classList.remove('active'));
                const popChip = document.querySelector('#discographyFilterChips [data-filter="popular"]');
                if (popChip) popChip.classList.add('active');
                renderDiscography('popular');
            };
        }

        // 5. Featuring Section
        const featSection = document.getElementById('artistFeaturingSection');
        const featGrid = document.getElementById('artistFeaturingGrid');
        const featTitle = document.getElementById('artistFeaturingTitle');

        if (featTitle) featTitle.textContent = `Featuring ${data.name}`;

        if (data.featuring && data.featuring.length > 0 && featGrid) {
            featSection.style.display = 'block';
            featGrid.innerHTML = data.featuring.map(f => `
                <div class="spotify-release-card" onclick="if (currentArtistContext && currentArtistContext.songs.length) { playPlaylistContext(currentArtistContext, 0); }">
                    <div class="release-img-wrap">
                        <img src="${f.coverUrl || 'https://via.placeholder.com/180'}" alt="${escapeHtml(f.title)}" loading="lazy">
                        <button class="release-floating-play" title="Play ${escapeHtml(f.title)}">
                            <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="release-card-title">${escapeHtml(f.title)}</div>
                    <div class="release-card-sub">${escapeHtml(f.desc || 'Playlist')}</div>
                </div>
            `).join('');
        } else if (featSection) {
            featSection.style.display = 'none';
        }

        // 6. Fans Also Like (Related Artists) Section
        const relSection = document.getElementById('artistRelatedSection');
        const relGrid = document.getElementById('artistRelatedGrid');

        if (data.relatedArtists && data.relatedArtists.length > 0 && relGrid) {
            relSection.style.display = 'block';
            relGrid.innerHTML = data.relatedArtists.map(ra => `
                <div class="spotify-circle-card" onclick="window.openArtistDetailView('${escapeHtml(ra.name || ra.id)}')">
                    <div class="circle-img-wrap">
                        <img src="${ra.profileUrl || 'https://via.placeholder.com/170'}" alt="${escapeHtml(ra.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/170'">
                        <button class="release-floating-play" title="Play ${escapeHtml(ra.name)}" onclick="event.stopPropagation(); window.openArtistDetailView('${escapeHtml(ra.name || ra.id)}');">
                            <svg role="img" height="22" width="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="release-card-title">${escapeHtml(ra.name)}</div>
                    <div class="release-card-sub">Artist</div>
                </div>
            `).join('');
        } else if (relSection) {
            relSection.style.display = 'none';
        }

        // 7. About Section
        const aboutBg = document.getElementById('artistAboutBg');
        const aboutListeners = document.getElementById('artistAboutListeners');
        const aboutBio = document.getElementById('artistAboutBio');

        if (aboutBg) {
            const abPhoto = data.about?.bannerUrl || data.bannerUrl || data.profileUrl || '';
            if (abPhoto) {
                aboutBg.style.backgroundImage = `url('${abPhoto}')`;
            }
        }
        if (aboutListeners) {
            aboutListeners.textContent = (data.monthlyListeners || 688312).toLocaleString() + ' monthly listeners';
        }
        if (aboutBio) {
            aboutBio.textContent = data.about?.bio || `${data.name} is a celebrated recording artist.`;
        }

    } catch (err) {
        console.error(err);
        showToast('error', 'Error', 'Could not load artist details.');
    }
}

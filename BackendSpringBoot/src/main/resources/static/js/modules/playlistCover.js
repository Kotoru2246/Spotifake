// Playlist cover rendering helpers (explicit cover, 2x2 mosaic of song covers, or placeholder).
import { API_BASE_URL } from './api.js';
import { escapeHtml } from './utils.js';

const NOTE_ICON = (size) => `<svg role="img" height="${size}" width="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;

const HEART_ICON = (size) => `<svg role="img" height="${size}" width="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

export function getSongCoverUrl(song) {
  if (!song || typeof song !== 'object') return '';
  return song.coverArtUrl || song.coverUrl || (song.id ? `${API_BASE_URL}/api/music/cover/${song.id}` : '');
}

export function getPlaylistMosaicUrls(playlist, max = 4) {
  const songs = (playlist && Array.isArray(playlist.songs)) ? playlist.songs : [];
  const collect = (urlOf) => {
    const seen = new Set();
    const urls = [];
    for (const song of songs) {
      if (urls.length >= max) break;
      const url = urlOf(song);
      if (!url) continue;
      const key = (song && song.albumId) ? `album:${song.albumId}` : url;
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(url);
    }
    return urls;
  };
  const explicit = collect((s) => (s && typeof s === 'object') ? (s.coverArtUrl || s.coverUrl || '') : '');
  if (explicit.length) return explicit;
  return collect((s) => (s && typeof s === 'object' && s.id) ? `${API_BASE_URL}/api/music/cover/${s.id}` : '');
}

const IMG_ERR = `onerror="this.style.visibility='hidden'"`;

export function playlistCoverHtml(playlist, { iconSize = 22 } = {}) {
  if (!playlist) return `<div class="pl-cover pl-cover--empty">${NOTE_ICON(iconSize)}</div>`;
  if (playlist.type === 'Liked Songs' || (playlist.name || '').toLowerCase() === 'liked songs') {
    return `<div class="pl-cover pl-cover--liked">${HEART_ICON(iconSize)}</div>`;
  }
  if (playlist.imageUrl) {
    return `<img class="pl-cover" src="${escapeHtml(playlist.imageUrl)}" alt="" loading="lazy" ${IMG_ERR}>`;
  }
  const urls = getPlaylistMosaicUrls(playlist, 4);
  if (urls.length >= 4) {
    return `<div class="pl-cover pl-cover--mosaic">${urls.slice(0, 4).map((u) => `<img src="${escapeHtml(u)}" loading="lazy" alt="" ${IMG_ERR}>`).join('')}</div>`;
  }
  if (urls.length >= 1) {
    return `<img class="pl-cover" src="${escapeHtml(urls[0])}" alt="" loading="lazy" ${IMG_ERR}>`;
  }
  return `<div class="pl-cover pl-cover--empty">${NOTE_ICON(iconSize)}</div>`;
}

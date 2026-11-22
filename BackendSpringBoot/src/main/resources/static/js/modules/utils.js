// Split from the former site.js (feature: utils). See docs/architecture.md.
import { API_BASE_URL } from './api.js';

export function showToast(type, title, description, durationMs) {
durationMs = durationMs || 5000;
var container = document.getElementById('toastContainer');
if (!container) {
  container = document.createElement('div');
  container.id = 'toastContainer';
  document.body.appendChild(container);
}
var toast = document.createElement('div');
toast.className = 'toast toast-' + type;
toast.innerHTML =
  '<div class="toast-body">' +
    '<div class="toast-title">' + title + '</div>' +
    (description ? '<div class="toast-desc">' + description + '</div>' : '') +
  '</div>' +
  '<div class="toast-progress" style="animation-duration:' + durationMs + 'ms"></div>';
container.appendChild(toast);
setTimeout(function() {
  toast.classList.add('toast-hide');
  setTimeout(function() { toast.remove(); }, 350);
}, durationMs);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeBackendSong(song) {
  const title = song.title || song.displayName || song.name || 'Untitled Track';
  const filePath = song.file_path || song.storage_url || song.filePath || song.storageUrl || song.fileName || (song.title ? `${song.title}.mp3` : '');
  const cover = song.coverUrl || song.cover_art_url || song.coverArtUrl || (song.id ? `${API_BASE_URL}/api/music/cover/${song.id}` : '');
  return {
    id: song.id,
    Id: song.id,
    title: title,
    artist: song.artist || song.artistName || 'Unknown Artist',
    album: song.album || 'Single',
    artistId: song.artistId || song.ArtistId,
    albumId: song.albumId || song.AlbumId,
    releaseDate: song.releaseDate || song.release_date || '',
    playCount: song.playCount || song.play_count || 0,
    playlist: 'SQL Server DB: MusicPlayerDb',
    genre: song.genre || 'Uncategorized',
    mood: song.mood || 'Neutral',
    tempo: song.tempo || 0,
    energy: song.energy || 0,
    danceability: song.danceability || 0,
    valence: song.valence || 0,
    acousticness: song.acousticness || 0,
    instrumentalness: song.instrumentalness || 0,
    color: initials(title) || 'AI',
    accent: '#1db954',
    src: `${API_BASE_URL}/api/music/stream/${song.id}`,
    coverUrl: cover,
    coverArt: cover,
    duration: Math.round((song.duration_ms || (song.durationSeconds ? song.durationSeconds * 1000 : 0)) / 1000),
    durationSeconds: song.durationSeconds || Math.round((song.duration_ms || 0) / 1000),
    fileName: filePath,
    lyrics: song.lyrics || '',
  };
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function initials(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function cleanUsername(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    return val.username || val.displayName || 'User';
  }
  const str = String(val).trim();
  if (str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      return parsed.username || parsed.displayName || 'User';
    } catch (_) {}
  }
  return str;
}

export function setModalOpen(modal, isOpen) {
  if (!modal) return;
  modal.hidden = !isOpen;
  modal.style.display = isOpen ? 'flex' : 'none';
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

export function formatAdminTimestamp(value) {
  if (!value) return 'No recent activity';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No recent activity';
  return parsed.toLocaleString();
}

export function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return String(value || '');
  }
}

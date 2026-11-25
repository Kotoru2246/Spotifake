// Home shortcuts: play-context tracking and shortcut fetching. See docs/API.md "Home shortcuts".
import { state } from './state.js';
import { authenticatedFetch } from './api.js';

export function contextFromPlaylist(pl, queue) {
  if (!pl) return null;
  const id = pl.id ? String(pl.id) : '';
  const type = pl.type || '';
  if (type === 'Liked Songs' || id.startsWith('liked-songs-')) return null;
  if (/^(mix-|this-is-|radio-)/.test(id)) return null;
  let contextType;
  let contextId;
  if (type === 'Album') {
    contextType = 'album';
    contextId = id && !/^(album-|alb-)/.test(id) ? id : pl.name;
  } else if (type === 'Artist') {
    contextType = 'artist';
    contextId = pl.id || pl.name;
  } else {
    contextType = 'playlist';
    contextId = pl.id;
  }
  if (!contextId) return null;
  const keys = new Set((queue || []).map(trackKey).filter(Boolean));
  return { contextType, contextId, queue, keys };
}

function trackKey(t) {
  return t ? (t.fileName || t.id || '') : '';
}

// Context applies only while the same queue is active (identity is re-linked after the Smart Shuffle filter)
// and only to tracks that were in the context's original queue (not queued/injected additions).
export function currentPlayContext(track) {
  const c = state.currentQueueContext;
  if (!c || c.queue !== state.activeQueue) return albumFallback(track);
  if (track && (track.isNewlyInjected || !c.keys || !c.keys.has(trackKey(track)))) return null;
  return { contextType: c.contextType, contextId: c.contextId };
}

// No explicit context (search, library, ...): attribute the song to its album, except in generated/liked queues.
const NO_FALLBACK_TITLE = /liked songs|daily mix|^this is\b|radio|top hits|best of|\bmix\b/i;
function albumFallback(track) {
  if (!track || track.isNewlyInjected) return null;
  if (NO_FALLBACK_TITLE.test(String(state.currentQueueTitle || ''))) return null;
  const id = track.albumId ? String(track.albumId).trim() : '';
  if (id) return { contextType: 'album', contextId: id };
  const title = track.album ? String(track.album).trim() : '';
  if (!title || /^(single|unknown album)$/i.test(title)) return null;
  return { contextType: 'album', contextId: title };
}

export async function fetchShortcuts(limit) {
  try {
    const res = await authenticatedFetch('/api/me/shortcuts?limit=' + encodeURIComponent(limit));
    if (!res || !res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (e) {
    return null;
  }
}

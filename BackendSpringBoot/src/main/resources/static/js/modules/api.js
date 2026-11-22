// Split from the former site.js (feature: api). See docs/architecture.md.
import { state } from './state.js';
import { setAdminVisibility, setAuthPanelOpen, updateAuthChrome } from './auth.js';
import { updatePremiumUI } from './checkout.js';
import { showSection } from './library.js';
import { renderUserPlaylists } from './playlists.js';
import { showToast } from './utils.js';

export const authTokenKey = 'spotifake.jwt';

export const authUserKey = 'spotifake.user';

export const authRoleKey = 'spotifake.role';

export const API_BASE_URL = window.location.origin;

export function initApi1() {
  state.authToken = localStorage.getItem(authTokenKey) || '';

  state.currentAuthRole = localStorage.getItem(authRoleKey) || '';
}

export function saveAuthSession(token, username, role) {
  state.authToken = token || '';
  state.currentAuthRole = role || '';
  if (state.authToken) {
    localStorage.setItem(authTokenKey, state.authToken);
    localStorage.setItem(authUserKey, username || '');
    localStorage.setItem(authRoleKey, role || '');
    document.cookie = "jwt_token=" + state.authToken + "; path=/; max-age=86400; SameSite=Lax";
  } else {
    localStorage.removeItem(authTokenKey);
    localStorage.removeItem(authUserKey);
    localStorage.removeItem(authRoleKey);
    document.cookie = "jwt_token=; path=/; max-age=0";
  }
}

export async function authenticatedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.authToken) {
    headers.set('Authorization', `Bearer ${state.authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const clone = response.clone();
    const payload = await clone.json().catch(() => ({}));
    const detail = payload.detail || '';
    if (detail.includes('expired') || detail.includes('token') || detail.includes('Authorization')) {
      showToast('error', '🔑 Session Expired', 'Your token has expired. Please sign in again.');
      saveAuthSession('', '', '');
    state.currentUser = null;
    updatePremiumUI(null);
      state.userPlaylists = [];
      state.selectedPlaylistId = '';
      renderUserPlaylists();
      updateAuthChrome('', '', false);
      setAdminVisibility('');
      showSection('home');
      setAuthPanelOpen(true, 'login');
    }
  }

  return response;
}

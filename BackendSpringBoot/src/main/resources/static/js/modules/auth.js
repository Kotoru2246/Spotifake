// Split from the former site.js (feature: auth). See docs/architecture.md.
import { state } from './state.js';
import { API_BASE_URL, authRoleKey, authTokenKey, authUserKey, authenticatedFetch, saveAuthSession } from './api.js';
import { updatePremiumUI } from './checkout.js';
import { accountType, adminDashboardStatus, adminNavLink, adminSongDetail, authPanel, authPanelSubtitle, authPanelTitle, authSubmitBtn, authUserPill, credentialsBox, groupConfirmPassword, groupDisplayName, groupEmail, importStatus, libraryStatus, loginError, loginForm, loginGate, loginStatus, loginToggleButton, logoutButton, passwordInput, signupConfirmPassword, signupDisplayName, signupEmail, signupNote, signupToggleButton, tabModeLogin, tabModeSignup, usernameInput } from './dom.js';
import { refreshLibrary, renderLibraryGrid, showSection } from './library.js';
import { loadTrack, setNowPlayingMeta } from './player.js';
import { loadUserPlaylists, renderUserPlaylists } from './playlists.js';
import { renderQueue } from './queue.js';
import { cleanUsername, escapeHtml, showToast } from './utils.js';

export const demoUsers = {
  user: { username: 'user_test', password: 'User@123', roleName: 'User' },
  artist: { username: 'artist_test', password: 'Artist@123', roleName: 'Artist' },
  admin: { username: 'admin_test', password: 'Admin@123', roleName: 'Admin' },
};

export function fillCredentials(username, password) {
  if (usernameInput) usernameInput.value = username;
  if (passwordInput) passwordInput.value = password;
}

export function syncLoginHint(roleKey) {
  const demo = demoUsers[roleKey];
  if (!demo) return;
  if (usernameInput && !usernameInput.value) usernameInput.value = demo.username;
  if (passwordInput && !passwordInput.value) passwordInput.value = demo.password;
}

export function setAuthPanelMode(mode) {
  state.currentAuthMode = mode;
  const isSignup = mode === 'signup';
  if (loginError) loginError.textContent = '';
  
  if (tabModeLogin) tabModeLogin.classList.toggle('active', !isSignup);
  if (tabModeSignup) tabModeSignup.classList.toggle('active', isSignup);

  if (authPanelTitle) authPanelTitle.textContent = isSignup ? 'Create an Account' : 'Sign in to Spotifake';
  if (authPanelSubtitle) authPanelSubtitle.textContent = isSignup
    ? 'Register a new user account with real SQL Server database storage.'
    : 'Connect with real JWT authentication & SQL Server.';

  if (groupDisplayName) groupDisplayName.hidden = !isSignup;
  if (groupEmail) groupEmail.hidden = !isSignup;
  if (groupConfirmPassword) groupConfirmPassword.hidden = !isSignup;
  if (signupNote) signupNote.hidden = !isSignup;
  if (credentialsBox) credentialsBox.hidden = isSignup;

  if (authSubmitBtn) {
    authSubmitBtn.textContent = isSignup ? 'Create Account' : 'Login';
  }
}

export function setAuthPanelOpen(isOpen, mode = 'login') {
  if (!authPanel || !loginGate) return;
  setAuthPanelMode(mode);
  loginGate.hidden = !isOpen;
  loginGate.style.display = isOpen ? 'flex' : 'none';
}

export function setAdminVisibility(role) {
  const roleLower = String(role || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isArtist = roleLower === 'artist';
  const isUser = roleLower === 'user';

  if (adminNavLink) adminNavLink.hidden = !isAdmin;
  
  const artistNavLink = document.getElementById('artistNavLink');
  if (artistNavLink) artistNavLink.hidden = !isArtist;

  const userArtistNavLink = document.getElementById('userArtistNavLink');
  if (userArtistNavLink) userArtistNavLink.hidden = !isUser;

  const adminSection = document.getElementById('admin');
  if (!isAdmin && adminSection?.classList.contains('active')) {
    showSection('home');
  }

  if (adminDashboardStatus && !isAdmin) {
    adminDashboardStatus.textContent = 'Sign in as admin to manage music, users, and artists.';
  }

  if (!isAdmin && adminSongDetail) {
    adminSongDetail.textContent = 'Select a song and click View Details to see which user IDs listened and how many times.';
  }
}

export function updateAuthChrome(username, roleLabel, loggedIn) {
  const cleanUser = cleanUsername(username);
  if (authUserPill) {
    const displayText = loggedIn ? `Logged in as ${cleanUser}` : 'Not signed in';
    authUserPill.innerHTML = `
      <svg height="15" width="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      <span class="auth-user-name">${escapeHtml(displayText)}</span>
    `;
    authUserPill.title = loggedIn ? `Logged in as ${cleanUser}` : '';
  }
  if (loginToggleButton) {
    loginToggleButton.hidden = loggedIn;
  }
  if (signupToggleButton) {
    signupToggleButton.hidden = loggedIn;
  }
  if (logoutButton) {
    logoutButton.hidden = !loggedIn;
  }
  if (loginStatus) {
    loginStatus.textContent = loggedIn ? `Signed in as ${cleanUser} (${roleLabel})` : '';
  }
}

export function updateLoginState(roleLabel, username) {
  if (loginError) loginError.textContent = '';
  updateAuthChrome(username, roleLabel, true);
  setAdminVisibility(state.currentAuthRole);
  setAuthPanelOpen(false);
}

export function initAuth1() {
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginError) loginError.textContent = '';
      
      const username = String(usernameInput?.value || '').trim();
      const password = String(passwordInput?.value || '');

      if (!username || !password) {
        if (loginError) loginError.textContent = 'Please enter both username and password.';
        return;
      }

      const isSignup = state.currentAuthMode === 'signup';

      if (isSignup) {
        const confirmPassword = String(signupConfirmPassword?.value || '');
        if (password !== confirmPassword) {
          if (loginError) loginError.textContent = 'Passwords do not match. Please re-enter.';
          return;
        }
      }

      const endpoint = isSignup ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;

      const displayName = String(signupDisplayName?.value || '').trim() || username;
      const email = String(signupEmail?.value || '').trim() || `${username}@musicplayer.local`;

      const requestBody = isSignup ? {
        username,
        email,
        password,
        display_name: displayName,
        displayName: displayName
      } : {
        username,
        password
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (loginError) loginError.textContent = payload.message || payload.detail || payload.error || (isSignup ? 'Registration failed.' : 'Login failed.');
          if (loginStatus) loginStatus.textContent = '';
          return;
        }

        const authenticatedUser = payload.username || username;
        const authenticatedRole = (payload.role || (payload.user && payload.user.role) || 'user').toLowerCase();
        const authenticatedToken = payload.access_token || payload.token;
        const roleLabel = authenticatedRole.charAt(0).toUpperCase() + authenticatedRole.slice(1);

        saveAuthSession(authenticatedToken, authenticatedUser, authenticatedRole);
        updateLoginState(roleLabel, authenticatedUser);
        state.currentUser = payload.user || { username: authenticatedUser, role: authenticatedRole };
        updatePremiumUI(state.currentUser);

        if (authenticatedRole === 'admin') {
          window.location.href = 'http://' + window.location.hostname + ':9000/admin/dashboard';
          return;
        }
        showSection('home');

        if (importStatus) {
          importStatus.textContent = 'You are signed in. Upload and import are now enabled.';
        }

        showToast('success', isSignup ? 'Account Created' : 'Logged In', isSignup ? `Welcome, ${displayName}! Account created successfully.` : `Signed in as ${authenticatedUser}.`);
        await refreshLibrary();
        await loadUserPlaylists().catch(() => { });
      } catch (err) {
        if (loginError) loginError.textContent = 'Network error connecting to backend API.';
      }
    });
  }

if (accountType) {
    accountType.addEventListener('change', () => syncLoginHint(String(accountType.value || 'user').toLowerCase()));
  }

if (loginToggleButton) {
    loginToggleButton.addEventListener('click', () => setAuthPanelOpen(loginGate?.hidden ?? true, 'login'));
  }

if (signupToggleButton) {
    signupToggleButton.addEventListener('click', () => setAuthPanelOpen(loginGate?.hidden ?? true, 'signup'));
  }

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await authenticatedFetch('/api/auth/logout', {
          method: 'POST',
        });
      } catch {
        // Ignore logout transport failures; local session state is still cleared below.
      }

      saveAuthSession('', '', '');
      state.currentUser = null;
      updatePremiumUI(null);
      state.userPlaylists = [];
      state.selectedPlaylistId = '';
      renderUserPlaylists();
      updateAuthChrome('', '', false);
      setAdminVisibility('');
      showSection('home');
      setAuthPanelOpen(false);
      if (importStatus) {
        importStatus.textContent = 'You have been signed out.';
      }
    });
  }
}

export const aiUploadForm = document.getElementById('aiUploadForm');

export const uploadAiStatus = document.getElementById('uploadAiStatus');

export const btnUploadSubmit = document.getElementById('btnUploadSubmit');

export function initAuth2() {
if (state.authToken) {
    const storedToken = localStorage.getItem(authTokenKey);
    let storedUser = localStorage.getItem(authUserKey);
    if (storedUser && storedUser.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(storedUser);
        storedUser = parsed.username || parsed.displayName || '';
        localStorage.setItem(authUserKey, storedUser);
      } catch (_) {}
    }
    const storedRole = localStorage.getItem(authRoleKey) || 'user';
    if (storedToken && storedUser) {
      state.authToken = storedToken;
      state.currentAuthRole = storedRole;
      document.cookie = "jwt_token=" + state.authToken + "; path=/; max-age=86400; SameSite=Lax";
      updateAuthChrome(storedUser, storedRole.charAt(0).toUpperCase() + storedRole.slice(1), true);
    }
    setAdminVisibility(storedRole);
    loadUserPlaylists().catch(() => { });

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    }).then(r => r.ok ? r.json() : null).then(u => {
      if (u) {
        state.currentUser = u;
        if (u.role) {
          state.currentAuthRole = u.role.toLowerCase();
          localStorage.setItem(authRoleKey, state.currentAuthRole);
          const roleLabel = state.currentAuthRole.charAt(0).toUpperCase() + state.currentAuthRole.slice(1);
          updateAuthChrome(u.username || storedUser, roleLabel, true);
          setAdminVisibility(state.currentAuthRole);
        }
        updatePremiumUI(state.currentUser);
      }
    }).catch(() => {});
  } else {
    updateAuthChrome('', '', false);
    setAdminVisibility('');
    setAuthPanelOpen(true, 'login');
  }

refreshLibrary().catch(() => {
    // seedDemoTracks();
    renderQueue();
    renderLibraryGrid();
    if (state.tracks.length) {
      setNowPlayingMeta(state.tracks[0]);
      loadTrack(0, false);
    }
    if (libraryStatus) libraryStatus.textContent = 'Unable to load C:\Music, so demo tracks are shown instead.';
  });
}

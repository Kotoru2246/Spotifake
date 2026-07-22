// ===== Configuration =====
console.log("site.js loaded - Script execution started");
const API_BASE = "http://127.0.0.1:8000";
let authToken = localStorage.getItem('spotifake_token') || null;
let currentUser = null;
let testFile = null;
console.log("Config initialized - API_BASE:", API_BASE);

// ===== Global Error Handler =====
window.addEventListener('error', function(event) {
    console.error("GLOBAL ERROR:", event.error);
    console.error("Message:", event.message);
    console.error("Source:", event.filename, "Line:", event.lineno);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error("UNHANDLED PROMISE REJECTION:", event.reason);
});

// ===== Auth Helpers =====

function getAuthHeaders() {
    const headers = {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

function fetchWithAuth(url, options = {}) {
    options.headers = { ...options.headers, ...getAuthHeaders() };
    return fetch(url, options);
}

function switchAuthTab(tab) {
    console.log("Switching to tab:", tab);
    try {
        const loginTabBtn = document.getElementById('loginTabBtn');
        const registerTabBtn = document.getElementById('registerTabBtn');
        const loginForm = document.getElementById('loginFormContainer');
        const registerForm = document.getElementById('registerFormContainer');

        console.log("loginTabBtn exists:", !!loginTabBtn);
        console.log("registerTabBtn exists:", !!registerTabBtn);
        console.log("loginForm exists:", !!loginForm);
        console.log("registerForm exists:", !!registerForm);

        if (!loginTabBtn || !registerTabBtn || !loginForm || !registerForm) {
            console.error("ERROR: One or more auth elements not found!");
            return;
        }

        loginTabBtn.classList.toggle('active', tab === 'login');
        registerTabBtn.classList.toggle('active', tab === 'register');
        loginForm.classList.toggle('hidden', tab !== 'login');
        registerForm.classList.toggle('hidden', tab !== 'register');

        console.log("Active status - Login:", loginTabBtn.classList.contains('active'), "Register:", registerTabBtn.classList.contains('active'));
    } catch (err) {
        console.error("ERROR in switchAuthTab:", err);
    }
}

function updateUserBadge() {
    const badge = document.getElementById('userBadge');
    if (currentUser && badge) {
        badge.style.display = 'block';
        document.getElementById('userDisplayName').textContent = currentUser.display_name || currentUser.username;
        document.getElementById('userRoleBadge').textContent = currentUser.role;
    } else if (badge) {
        badge.style.display = 'none';
    }
}

function showSection(sectionId) {
    if (!authToken || !currentUser) {
        document.getElementById('loginError').textContent = 'Please login first.';
        document.getElementById('loginGate').style.display = 'flex';
        return;
    }
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    if (sectionId === 'my-songs') loadMySongs();
    else if (sectionId === 'home') loadStats();
    else if (sectionId === 'recommendations') loadSongsForRecommendations();
}

function showSpotifyTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName + '-tab').style.display = 'block';
    event.target.classList.add('active');
}

async function checkBackendHealth() {
    try {
        const r = await fetch(`${API_BASE}/health`);
        alert(r.ok ? 'Backend is running!' : 'Backend returned an error');
    } catch (e) {
        alert('Cannot connect to backend. Make sure it is running at ' + API_BASE);
    }
}

async function loadStats() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/songs`);
        if (r.ok) {
            const songs = await r.json();
            const el = document.getElementById('total-songs');
            if (el) el.textContent = songs.length;
        }
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    console.log("Register button element:", document.getElementById('registerTabBtn'));
    console.log("switchAuthTab function exists:", typeof switchAuthTab === 'function');

    const ua = document.getElementById('uploadArea');
    if (ua) {
        ua.addEventListener('dragover', e => { e.preventDefault(); ua.classList.add('dragover'); });
        ua.addEventListener('dragleave', () => ua.classList.remove('dragover'));
        ua.addEventListener('drop', e => {
            e.preventDefault();
            ua.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                document.getElementById('fileInput').files = e.dataTransfer.files;
                handleFileSelect();
            }
        });
    }

    const tua = document.getElementById('testUploadArea');
    if (tua) {
        tua.addEventListener('dragover', e => { e.preventDefault(); tua.classList.add('dragover'); });
        tua.addEventListener('dragleave', () => tua.classList.remove('dragover'));
        tua.addEventListener('drop', e => {
            e.preventDefault();
            tua.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                document.getElementById('testFileInput').files = e.dataTransfer.files;
                handleTestFileSelect();
            }
        });
    }
    initializeAuth();
});

function handleFileSelect() {
    const f = document.getElementById('fileInput').files[0];
    const ua = document.getElementById('uploadArea');
    if (f && ua) ua.innerHTML = `<p>${f.name} selected</p>`;
}

function handleTestFileSelect() {
    testFile = document.getElementById('testFileInput').files[0];
    const tua = document.getElementById('testUploadArea');
    const cb = document.getElementById('classifyBtn');
    if (testFile && tua) {
        tua.innerHTML = `<p>${testFile.name} selected</p>`;
        if (cb) cb.style.display = 'block';
    }
}

function handleLoginSuccess(data) {
    authToken = data.access_token;
    localStorage.setItem('spotifake_token', authToken);
    currentUser = { username: data.username, role: data.role, user_id: data.user_id, display_name: data.username };
    updateUserBadge();
    document.getElementById('loginGate').style.display = 'none';
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('home').classList.add('active');
    loadStats();
}

function handleRegisterSuccess(data) {
    authToken = data.access_token;
    localStorage.setItem('spotifake_token', authToken);
    currentUser = { username: data.username, role: data.role, user_id: data.id, display_name: data.display_name || data.username };
    updateUserBadge();
    document.getElementById('loginGate').style.display = 'none';
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('home').classList.add('active');
    loadStats();
}

function initializeAuth() {
    console.log("Initializing Auth...");
    const lf = document.getElementById('loginForm');
    console.log("Login form found:", !!lf);
    if (lf) {
        lf.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Login form submitted");
            const u = document.getElementById('loginUsername').value.trim();
            const p = document.getElementById('loginPassword').value;
            const r = document.getElementById('accountType').value;
            document.getElementById('loginError').textContent = '';
            document.getElementById('loginStatus').textContent = 'Signing in...';
            try {
                console.log("Sending login request to:", `${API_BASE}/auth/login`);
                const resp = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p, role: r }),
                });
                if (resp.ok) {
                    const d = await resp.json();
                    console.log("Login successful:", d);
                    document.getElementById('loginStatus').textContent = 'Signed in!';
                    setTimeout(() => handleLoginSuccess(d), 200);
                } else {
                    const err = await resp.json();
                    console.error("Login error:", err);
                    document.getElementById('loginStatus').textContent = '';
                    document.getElementById('loginError').textContent = err.detail || 'Login failed';
                }
            } catch (err) {
                console.error("Login exception:", err);
                document.getElementById('loginStatus').textContent = '';
                document.getElementById('loginError').textContent = 'Cannot connect to backend.';
            }
        });
    }
    const rf = document.getElementById('registerForm');
    console.log("Register form found:", !!rf);
    if (rf) {
        rf.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Register form submitted");
            const u = document.getElementById('regUsername').value.trim();
            const em = document.getElementById('regEmail').value.trim();
            const p = document.getElementById('regPassword').value;
            const r = document.getElementById('regAccountType').value;
            const dn = document.getElementById('regDisplayName').value.trim();
            console.log("Register data:", { username: u, email: em, role: r, display_name: dn });
            document.getElementById('registerError').textContent = '';
            document.getElementById('registerStatus').textContent = 'Creating account...';
            try {
                console.log("Sending register request to:", `${API_BASE}/auth/register`);
                const resp = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, email: em, password: p, role: r, display_name: dn }),
                });
                if (resp.ok) {
                    const d = await resp.json();
                    console.log("Register successful:", d);
                    document.getElementById('registerStatus').textContent = 'Account created!';
                    setTimeout(() => handleRegisterSuccess(d), 200);
                } else {
                    const err = await resp.json();
                    console.error("Register error:", err);
                    document.getElementById('registerStatus').textContent = '';
                    document.getElementById('registerError').textContent = err.detail || 'Registration failed';
                }
            } catch (err) {
                console.error("Register exception:", err);
                document.getElementById('registerStatus').textContent = '';
                document.getElementById('registerError').textContent = 'Cannot connect to backend.';
            }
        });
    }
    if (authToken) {
        console.log("Existing token found, validating...");
        fetchWithAuth(`${API_BASE}/auth/me`)
            .then(r => { if (r.ok) return r.json(); throw new Error('invalid'); })
            .then(d => {
                console.log("Token valid, user:", d);
                currentUser = { username: d.username, role: d.role, display_name: d.username };
                updateUserBadge();
                document.getElementById('loginGate').style.display = 'none';
                loadStats();
            })
            .catch(() => { 
                console.warn("Token invalid, clearing");
                authToken = null; 
                currentUser = null; 
                localStorage.removeItem('spotifake_token'); 
            });
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('spotifake_token');
    document.getElementById('userBadge').style.display = 'none';
    document.getElementById('loginGate').style.display = 'flex';
}

// ===== Upload =====

async function handleUpload(event) {
    event.preventDefault();
    const file = document.getElementById('fileInput').files[0];
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const album = document.getElementById('album').value;
    if (!file || !title || !artist) { alert('Please fill in all required fields'); return; }
    const fd = new FormData();
    fd.append('file', file); 
    fd.append('title', title); 
    fd.append('artist', artist); 
    fd.append('album', album);
    const sd = document.getElementById('uploadStatus');
    if (sd) sd.innerHTML = '<div class="loading">Uploading and analyzing audio features...</div>';
    try {
        const r = await fetchWithAuth(`${API_BASE}/songs/upload`, { method: 'POST', body: fd });
        if (r.ok) {
            const song = await r.json();
            if (sd) sd.innerHTML = '<div class="success">Song uploaded successfully! Features extracted.</div>';
            document.getElementById('fileInput').value = '';
            document.getElementById('title').value = '';
            document.getElementById('artist').value = '';
            document.getElementById('album').value = '';
            document.getElementById('uploadArea').innerHTML = '<div style="font-size: 48px; margin-bottom: 10px;">📁</div><p>Click to upload or drag and drop</p><p style="font-size: 12px; color: var(--muted); margin-top: 5px;">MP3, WAV, or FLAC (up to 100MB)</p>';
        } else {
            const err = await r.json();
            if (sd) sd.innerHTML = '<div class="error">Upload failed: ' + (err.detail || 'Unknown error') + '</div>';
        }
    } catch (e) {
        console.error("Upload error:", e);
        if (sd) sd.innerHTML = '<div class="error">Cannot connect to backend</div>';
    }
}

async function loadMySongs() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/songs`);
        if (r.ok) {
            const songs = await r.json();
            let html = '';
            songs.forEach(song => {
                html += `<div class="song-card">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                    <div class="features-grid">`;
                if (song.features) {
                    Object.entries(song.features).slice(0, 4).forEach(([key, val]) => {
                        html += `<div class="feature-item"><span class="feature-label">${key}:</span> ${val}</div>`;
                    });
                }
                html += `</div></div>`;
            });
            document.getElementById('mySongsContainer').innerHTML = html || '<p>No songs uploaded yet</p>';
        }
    } catch (e) {
        console.error("Error loading songs:", e);
    }
}

async function searchSpotify() {
    const query = document.getElementById('spotifyQuery').value;
    if (!query) return;
    try {
        const r = await fetchWithAuth(`${API_BASE}/spotify/search?q=${encodeURIComponent(query)}`);
        if (r.ok) {
            const results = await r.json();
            let html = '';
            (results.tracks || []).forEach(track => {
                html += `<div class="song-card">
                    <div class="song-title">${track.name}</div>
                    <div class="song-artist">${track.artists}</div>
                </div>`;
            });
            document.getElementById('spotifySearchResults').innerHTML = html || '<p>No results found</p>';
        }
    } catch (e) {
        console.error("Search error:", e);
    }
}

async function getSpotifyLikedSongs() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/spotify/liked`);
        if (r.ok) {
            const songs = await r.json();
            let html = '';
            (songs || []).forEach(song => {
                html += `<div class="song-card">
                    <div class="song-title">${song.name}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>`;
            });
            document.getElementById('spotifyLikedResults').innerHTML = html || '<p>No liked songs found</p>';
        }
    } catch (e) {
        console.error("Error loading liked songs:", e);
    }
}

async function getSpotifyAuthUrl() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/spotify/auth-url`);
        if (r.ok) {
            const data = await r.json();
            window.open(data.auth_url, 'spotify_auth', 'width=500,height=600');
            document.getElementById('spotifyAuthCode').style.display = 'block';
        }
    } catch (e) {
        console.error("Error getting auth URL:", e);
    }
}

async function authenticateSpotify() {
    const code = document.getElementById('authCodeInput').value;
    if (!code) return;
    try {
        const r = await fetchWithAuth(`${API_BASE}/spotify/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        if (r.ok) {
            alert('Spotify connected successfully!');
            document.getElementById('spotifyAuthCode').style.display = 'none';
        }
    } catch (e) {
        console.error("Authentication error:", e);
    }
}

async function getSpotifyPlaylists() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/spotify/playlists`);
        if (r.ok) {
            const playlists = await r.json();
            let html = '';
            (playlists || []).forEach(p => {
                html += `<div class="song-card"><div class="song-title">${p.name}</div><p>${p.tracks} tracks</p></div>`;
            });
            document.getElementById('spotifyPlaylistsResults').innerHTML = html || '<p>No playlists found</p>';
        }
    } catch (e) {
        console.error("Error loading playlists:", e);
    }
}

async function loadSongsForRecommendations() {
    try {
        const r = await fetchWithAuth(`${API_BASE}/songs`);
        if (r.ok) {
            const songs = await r.json();
            const select = document.getElementById('seedSongSelect');
            select.innerHTML = '';
            songs.forEach(song => {
                const option = document.createElement('option');
                option.value = song.id;
                option.textContent = `${song.title} - ${song.artist}`;
                select.appendChild(option);
            });
        }
    } catch (e) {
        console.error("Error loading songs:", e);
    }
}

async function loadRecommendations() {
    const seedId = document.getElementById('seedSongSelect').value;
    if (!seedId) return;
    try {
        const r = await fetchWithAuth(`${API_BASE}/recommendations?seed_song_id=${seedId}`);
        if (r.ok) {
            const recs = await r.json();
            let html = '';
            (recs || []).forEach(song => {
                html += `<div class="song-card">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>`;
            });
            document.getElementById('recommendationsResults').innerHTML = html || '<p>No recommendations found</p>';
        }
    } catch (e) {
        console.error("Error loading recommendations:", e);
    }
}

async function testClassifyFile() {
    if (!testFile) return;
    const fd = new FormData();
    fd.append('file', testFile);
    const sd = document.getElementById('classifyStatus');
    if (sd) sd.innerHTML = '<div class="loading">Classifying audio...</div>';
    try {
        const r = await fetchWithAuth(`${API_BASE}/classify`, { method: 'POST', body: fd });
        if (r.ok) {
            const result = await r.json();
            let html = '<div class="success">Classification Results:<br>';
            if (result.genre) html += `Genre: ${result.genre}<br>`;
            if (result.confidence) html += `Confidence: ${result.confidence}<br>`;
            html += '</div>';
            if (sd) sd.innerHTML = html;
        }
    } catch (e) {
        console.error("Classification error:", e);
        if (sd) sd.innerHTML = '<div class="error">Classification failed</div>';
    }
}

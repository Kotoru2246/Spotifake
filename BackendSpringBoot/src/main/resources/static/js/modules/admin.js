// Split from the former site.js (feature: admin). See docs/architecture.md.
import { state } from './state.js';
import { authenticatedFetch } from './api.js';
import { adminArtistsList, adminDashboardStatus, adminMusicList, adminMusicPath, adminOverviewGrid, adminSongDetail, adminUsersList, refreshAdminDashboardButton } from './dom.js';
import { refreshLibrary } from './library.js';
import { escapeHtml, formatAdminTimestamp, safeDecodeURIComponent } from './utils.js';

export function renderAdminOverview(data) {
  if (!adminOverviewGrid) return;

  const cards = [
    { label: 'Library Tracks', value: data.totalTracks, meta: `${data.music.length} track${data.music.length === 1 ? '' : 's'} available now` },
    { label: 'Active Users', value: data.activeUsers, meta: `${data.users.length} listener account${data.users.length === 1 ? '' : 's'} total` },
    { label: 'Active Artists', value: data.activeArtists, meta: `${data.artists.filter((artist) => artist.isFeatured).length} featured artist${data.artists.filter((artist) => artist.isFeatured).length === 1 ? '' : 's'}` },
    { label: 'Admins', value: data.totalAdmins, meta: `Last scan ${formatAdminTimestamp(data.lastScanUtc)}` },
  ];

  adminOverviewGrid.innerHTML = cards.map((card) => `
    <article class="admin-stat-card">
      <div class="admin-stat-label">${escapeHtml(card.label)}</div>
      <div class="admin-stat-value">${escapeHtml(card.value)}</div>
      <div class="admin-stat-meta">${escapeHtml(card.meta)}</div>
    </article>
  `).join('');
}

export function renderAdminMusic(data) {
  if (adminMusicPath) {
    adminMusicPath.textContent = `Library path: ${data.musicFolderPath}`;
  }

  if (!adminMusicList) return;

  if (!data.music.length) {
    adminMusicList.innerHTML = '<div class="admin-empty-state">No tracks are available in the library yet.</div>';
    return;
  }

  const songViews = new Map((data.songViews || []).map((item) => [item.fileName, item.totalViews]));

  adminMusicList.innerHTML = data.music.map((track) => `
    <article class="admin-list-item">
      <div class="admin-item-main">
        <div class="admin-item-header">
          <div class="admin-item-title">${escapeHtml(track.displayName || 'Untitled Track')}</div>
          <span class="admin-badge is-featured">Views ${escapeHtml(songViews.get(track.fileName) || 0)}</span>
        </div>
        <div class="admin-item-meta">${escapeHtml(track.artist || 'Unknown Artist')} • ${escapeHtml(track.extension || 'audio')} • ${escapeHtml(track.fileName || '')}</div>
      </div>
      <div class="admin-item-actions">
        <button type="button" class="secondary-action" data-admin-song-detail="${encodeURIComponent(track.fileName || '')}" onclick="adminViewSongDetails('${encodeURIComponent(track.fileName || '')}')">View Details</button>
        <a class="secondary-action admin-link-button" href="/music/download/${encodeURIComponent(track.fileName)}">Download</a>
        <button type="button" class="secondary-action danger-action" data-admin-delete-track="${encodeURIComponent(track.fileName || '')}" onclick="adminDeleteSong('${encodeURIComponent(track.fileName || '')}')">Remove</button>
      </div>
    </article>
  `).join('');
}

export function renderAdminSongDetail(detail) {
  if (!adminSongDetail) return;

  if (!detail || !detail.fileName) {
    adminSongDetail.textContent = 'Select a song and click View Details to see which user IDs listened and how many times.';
    return;
  }

  const listeners = detail.listeners || [];
  const listenerRows = listeners.length
    ? listeners.map((listener) => `
      <tr>
        <td>${escapeHtml(listener.userId)}</td>
        <td>${escapeHtml(listener.listenCount)}</td>
      </tr>`).join('')
    : '<tr><td colspan="2">No listens recorded yet.</td></tr>';

  adminSongDetail.innerHTML = `
    <div class="admin-song-detail-title">${escapeHtml(detail.displayName || detail.fileName)}</div>
    <div class="admin-song-detail-meta">Total views: ${escapeHtml(detail.totalViews || 0)} • File: ${escapeHtml(detail.fileName)}</div>
    <table class="admin-song-detail-table">
      <thead>
        <tr>
          <th>User ID</th>
          <th>Listens</th>
        </tr>
      </thead>
      <tbody>
        ${listenerRows}
      </tbody>
    </table>
  `;

  adminSongDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function renderAdminAccounts(listElement, accounts, options = {}) {
  if (!listElement) return;

  if (!accounts.length) {
    listElement.innerHTML = '<div class="admin-empty-state">No accounts are available for this group yet.</div>';
    return;
  }

  listElement.innerHTML = accounts.map((account) => `
    <article class="admin-list-item">
      <div class="admin-item-main">
        <div class="admin-item-header">
          <div class="admin-item-title">${escapeHtml(account.displayName)}</div>
          <span class="admin-badge ${account.isActive ? 'is-active' : 'is-paused'}">${account.isActive ? 'Active' : 'Paused'}</span>
          ${options.allowFeatured ? `<span class="admin-badge ${account.isFeatured ? 'is-featured' : 'is-idle'}">${account.isFeatured ? 'Featured' : 'Standard'}</span>` : ''}
        </div>
        <div class="admin-item-meta">@${escapeHtml(account.username)} • ${escapeHtml(account.uploadedTracks)} uploads • Last active ${escapeHtml(formatAdminTimestamp(account.lastActiveUtc))}</div>
        <div class="admin-item-note">${escapeHtml(account.notes || '')}</div>
      </div>
      <div class="admin-item-actions">
        ${options.allowFeatured ? `<button type="button" class="secondary-action" data-admin-feature-artist="${escapeHtml(account.username)}">${account.isFeatured ? 'Remove Feature' : 'Feature Artist'}</button>` : ''}
        <button type="button" class="secondary-action" data-admin-toggle-account="${escapeHtml(account.username)}">${account.isActive ? 'Pause Access' : 'Restore Access'}</button>
      </div>
    </article>
  `).join('');

  listElement.querySelectorAll('[data-admin-toggle-account]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await toggleAdminAccountStatus(button.dataset.adminToggleAccount || '');
      } catch (error) {
        if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      }
    });
  });

  listElement.querySelectorAll('[data-admin-feature-artist]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await toggleAdminArtistFeatured(button.dataset.adminFeatureArtist || '');
      } catch (error) {
        if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      }
    });
  });
}

export function renderAdminDashboard(data) {
  if (!data) return;

  renderAdminOverview(data);
  renderAdminMusic(data);
  renderAdminAccounts(adminUsersList, data.users || []);
  renderAdminAccounts(adminArtistsList, data.artists || [], { allowFeatured: true });

  if (adminDashboardStatus) {
    adminDashboardStatus.textContent = `Admin dashboard synced from ${data.musicFolderPath}. Last scan ${formatAdminTimestamp(data.lastScanUtc)}.`;
  }
}

export async function loadAdminDashboard() {
  if (String(state.currentAuthRole || '').toLowerCase() !== 'admin') {
    return;
  }

  const response = await authenticatedFetch('/admin/dashboard');
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to load the admin dashboard.');
  }

  renderAdminDashboard(payload);
}

export async function loadAdminSongDetail(fileName) {
  if (!fileName) return;

  const response = await authenticatedFetch(`/admin/music/views?fileName=${encodeURIComponent(fileName)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to load song view details.');
  }

  renderAdminSongDetail(payload);
}

export async function toggleAdminAccountStatus(username) {
  if (!username) return;

  const response = await authenticatedFetch(`/admin/accounts/${encodeURIComponent(username)}/toggle-status`, {
    method: 'POST',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to update account access.');
  }

  renderAdminDashboard(payload);
}

export async function toggleAdminArtistFeatured(username) {
  if (!username) return;

  const response = await authenticatedFetch(`/admin/artists/${encodeURIComponent(username)}/toggle-featured`, {
    method: 'POST',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to update artist feature status.');
  }

  renderAdminDashboard(payload);
}

export async function deleteAdminTrack(fileName) {
  if (!fileName) return;

  const response = await authenticatedFetch(`/admin/music/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || 'Unable to remove the selected track.');
  }

  renderAdminDashboard(payload);
  renderAdminSongDetail();
  await refreshLibrary();
}

export async function handleAdminSongDetailClick(encodedFileName) {
  try {
    if (adminSongDetail) adminSongDetail.textContent = 'Loading listen details...';
    await loadAdminSongDetail(safeDecodeURIComponent(encodedFileName || ''));
  } catch (error) {
    if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
    if (adminSongDetail) adminSongDetail.textContent = error.message;
  }
}

export async function handleAdminDeleteTrackClick(encodedFileName) {
  try {
    await deleteAdminTrack(safeDecodeURIComponent(encodedFileName || ''));
  } catch (error) {
    if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
    if (adminSongDetail) adminSongDetail.textContent = error.message;
  }
}

export function initAdmin1() {
if (refreshAdminDashboardButton) {
    refreshAdminDashboardButton.addEventListener('click', async () => {
      try {
        await loadAdminDashboard();
      } catch (error) {
        if (adminDashboardStatus) adminDashboardStatus.textContent = error.message;
      }
    });
  }

if (adminMusicList) {
    adminMusicList.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const detailButton = target.closest('[data-admin-song-detail]');
      if (detailButton) {
        event.preventDefault();
        await handleAdminSongDetailClick(detailButton.dataset.adminSongDetail || '');
        return;
      }

      const deleteButton = target.closest('[data-admin-delete-track]');
      if (deleteButton) {
        event.preventDefault();
        await handleAdminDeleteTrackClick(deleteButton.dataset.adminDeleteTrack || '');
      }
    });
  }
}

// Split from the former site.js (feature: platform). See docs/architecture.md.
import { showToast } from './utils.js';

export async function syncPlatformRuntime() {
  try {
    const resp = await fetch('/api/public/settings');
    if (resp.ok) {
      const data = await resp.json();
      window.platformSettings = Object.assign(window.platformSettings, data);
      if (window.platformSettings.maintenanceMode) {
        const banner = document.getElementById('globalAnnouncementBanner');
        const text = document.getElementById('announcementText');
        const icon = document.getElementById('announcementIcon');
        if (banner && text) {
          banner.style.display = 'flex';
          banner.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
          banner.style.color = '#fff';
          if (icon) icon.textContent = '⚠️';
          text.textContent = window.platformSettings.maintenanceMessage || 'Platform is currently undergoing maintenance.';
        }
      }
    }
  } catch (e) {}

  try {
    const resp = await fetch('/api/public/announcements');
    if (resp.ok) {
      const announcements = await resp.json();
      if (announcements && announcements.length > 0) {
        const first = announcements[0];
        const banner = document.getElementById('globalAnnouncementBanner');
        const text = document.getElementById('announcementText');
        const icon = document.getElementById('announcementIcon');
        if (banner && text && !window.platformSettings.maintenanceMode) {
          banner.style.display = 'flex';
          if (first.level === 'warning') {
            banner.style.background = 'linear-gradient(90deg, #facc15, #f59e0b)';
            banner.style.color = '#000';
            if (icon) icon.textContent = '⚠️';
          } else if (first.level === 'promo') {
            banner.style.background = 'linear-gradient(90deg, #a855f7, #6366f1)';
            banner.style.color = '#fff';
            if (icon) icon.textContent = '🎉';
          } else {
            banner.style.background = 'linear-gradient(90deg, #1db954, #1ed760)';
            banner.style.color = '#000';
            if (icon) icon.textContent = '📢';
          }
          text.textContent = first.title + ' — ' + first.message;
        }
        const bellBadge = document.getElementById('bellBadge');
        if (bellBadge) {
          bellBadge.textContent = String(announcements.length);
          bellBadge.hidden = false;
        }
      }
    }
  } catch (e) {}
}

export function initPlatform1() {
syncPlatformRuntime();
}

export const notifBell = document.getElementById('notificationBell');

export function initPlatform2() {
if (notifBell) {
    notifBell.addEventListener('click', () => {
      fetch('/api/public/announcements')
        .then(r => r.ok ? r.json() : [])
        .then(list => {
          if (list && list.length > 0) {
            const msgs = list.map(a => `🔔 ${a.title}\n${a.message}`).join('\n\n');
            alert(msgs);
          } else {
            showToast('info', "What's New", "You are all caught up! No active announcements.");
          }
        })
        .catch(() => {
          showToast('info', "What's New", "You are all caught up!");
        });
    });
  }
}

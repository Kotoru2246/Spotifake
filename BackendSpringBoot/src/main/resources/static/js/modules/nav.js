// In-app navigation stack (Back / Forward arrows) synced with the browser History API.
// Not to be confused with history.js (playback history).
const entries = []; // { section, restore, scroll }
let idx = -1;
let restoring = false;

function panel() { return document.querySelector('.main-panel'); }

function updateButtons() {
  const back = document.getElementById('navBackBtn');
  const fwd = document.getElementById('navForwardBtn');
  if (back) back.disabled = idx <= 0;
  if (fwd) fwd.disabled = idx >= entries.length - 1;
}

// Called by showSection() before switching views.
export function navRecord(section) {
  if (restoring) return;
  const top = entries[idx];
  if (top) {
    const p = panel();
    if (p) top.scroll = p.scrollTop;
    // Same plain section again (e.g. re-login, error fallbacks): don't stack duplicates.
    if (top.section === section && !top.custom) return;
  }
  entries.length = idx + 1; // opening something new clears forward stack
  entries.push({ section, restore: null, custom: false, scroll: 0 });
  idx = entries.length - 1;
  try {
    if (idx === 0) history.replaceState({ navIdx: 0 }, '');
    else history.pushState({ navIdx: idx }, '');
  } catch (e) { /* ignore */ }
  updateButtons();
}

// Openers call this right after showSection() so the entry can be re-opened with its parameters.
export function navSetRestore(fn) {
  if (restoring) return;
  const e = entries[idx];
  if (e) { e.restore = fn; e.custom = true; }
}

export function navBack() { history.back(); }
export function navForward() { history.forward(); }

async function goTo(target) {
  const cur = entries[idx];
  const p = panel();
  if (cur && p) cur.scroll = p.scrollTop;
  idx = target;
  const e = entries[idx];
  restoring = true;
  try {
    if (e.restore) await e.restore();
    else if (typeof window.showSection === 'function') window.showSection(e.section);
  } catch (err) {
    console.error('Navigation restore failed', err);
  } finally {
    restoring = false;
  }
  updateButtons();
  const pp = panel();
  if (pp) {
    pp.scrollTop = e.scroll || 0;
    setTimeout(() => { if (!restoring && entries[idx] === e) pp.scrollTop = e.scroll || 0; }, 150);
  }
}

export function initNav() {
  window.addEventListener('popstate', (ev) => {
    const n = ev.state && ev.state.navIdx;
    if (typeof n !== 'number' || !entries[n]) { updateButtons(); return; }
    goTo(n);
  });
  document.getElementById('navBackBtn')?.addEventListener('click', navBack);
  document.getElementById('navForwardBtn')?.addEventListener('click', navForward);
  updateButtons();
}

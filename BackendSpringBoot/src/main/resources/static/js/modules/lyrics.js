// Split from the former site.js (feature: lyrics). See docs/architecture.md.
import { state } from './state.js';
import { audioPlayer } from './dom.js';
import { showSection } from './library.js';
import { getCurrentQueue } from './queue.js';

export function toggleLyricsView() {
  if (document.getElementById('lyrics-view').classList.contains('active')) {
    showSection('home');
  } else {
    showSection('lyrics-view');
    renderLyrics();
  }
}

export function parseLrc(lrcText) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeReg = /\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\]/g;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const matches = [...line.matchAll(timeReg)];
    if (matches.length > 0) {
      const text = line.replace(timeReg, '').trim();
      for (const m of matches) {
        const minutes = parseInt(m[1], 10);
        const seconds = parseFloat(m[2]);
        const totalSeconds = minutes * 60 + seconds;
        result.push({ time: totalSeconds, text: text || '♪' });
      }
    } else if (!line.startsWith('[')) {
      // Plain text line without timestamp
      result.push({ time: null, text: line });
    }
  }
  // Sort timestamped lines
  return result.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export async function renderLyrics() {
  const list = getCurrentQueue();
  const activeTrack = list[state.currentTrackIndex];
  if(!activeTrack) return;
  const lyricsContainer = document.getElementById('lyricsTextContainer');
  if(!lyricsContainer) return;

  lyricsContainer.innerHTML = '<div class="lyric-line active" style="font-size:24px; opacity:0.6;">Loading lyrics...</div>';
  state.parsedLyricsLines = [];

  let lyrics = activeTrack.lyrics || '';

  // If lyrics missing on track object, fetch dynamically from server
  if (!lyrics && activeTrack.id) {
    try {
      const res = await fetch(`/api/music/lyrics/${encodeURIComponent(activeTrack.id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics) {
          lyrics = data.lyrics;
          activeTrack.lyrics = lyrics;
        }
      }
    } catch(e) {
      console.warn('Could not load lyrics from endpoint', e);
    }
  }

  lyricsContainer.innerHTML = '';

  if (!lyrics || !lyrics.trim()) {
    const emptyLine = document.createElement('div');
    emptyLine.className = 'lyric-line active';
    emptyLine.textContent = `♪ Looks like we don't have lyrics for this song yet ♪`;
    lyricsContainer.appendChild(emptyLine);
    return;
  }

  const parsed = parseLrc(lyrics);
  const hasTimestamps = parsed.some(p => p.time !== null);
  const isPrem = !!(state.currentUser && (state.currentUser.isPremium || state.currentUser.premium || state.currentUser.subscriptionTier === 'Premium'));

  parsed.forEach((item, idx) => {
    const lineDiv = document.createElement('div');
    const isBlurred = !isPrem && idx >= 4;
    lineDiv.className = 'lyric-line' + (!hasTimestamps ? ' active' : (idx === 0 ? ' active' : '')) + (isBlurred ? ' blurred' : '');
    lineDiv.textContent = item.text;
    if (!isBlurred && item.time !== null) {
      lineDiv.style.cursor = 'pointer';
      lineDiv.onclick = () => {
        if (audioPlayer) {
          audioPlayer.currentTime = Math.max(0, item.time - 0.2);
          if (audioPlayer.paused) audioPlayer.play();
        }
      };
    }
    lyricsContainer.appendChild(lineDiv);
    state.parsedLyricsLines.push({
      time: item.time,
      text: item.text,
      el: lineDiv
    });
  });

  if (!isPrem && parsed.length > 4) {
    const lockCta = document.createElement('div');
    lockCta.className = 'lyrics-lock-cta';
    lockCta.innerHTML = `
      <div class="lyrics-lock-icon">🔒</div>
      <div class="lyrics-lock-title">Unlock full lyrics with Premium</div>
      <div class="lyrics-lock-subtitle">Free tier displays a 4-line preview. Upgrade to Premium for full real-time synchronized lyrics.</div>
      <button type="button" class="lyrics-lock-btn" onclick="openCheckoutModal('Individual')">Unlock Full Lyrics ($4.99/mo)</button>
    `;
    lyricsContainer.appendChild(lockCta);
  }

  const canvas = document.getElementById('lyricsCanvas');
  if (canvas && !canvas.dataset.scrollBound) {
    canvas.dataset.scrollBound = 'true';
    const onUserScroll = () => {
      state.isUserScrollingLyrics = true;
      if (state.userLyricsScrollTimeout) clearTimeout(state.userLyricsScrollTimeout);
      state.userLyricsScrollTimeout = setTimeout(() => {
        state.isUserScrollingLyrics = false;
      }, 3500);
    };
    canvas.addEventListener('wheel', onUserScroll, { passive: true });
    canvas.addEventListener('touchmove', onUserScroll, { passive: true });
    canvas.addEventListener('pointerdown', onUserScroll, { passive: true });
  }
}

export function syncLyricsTime(currentTime) {
  const lyricsSection = document.getElementById('lyrics-view');
  if (!lyricsSection || lyricsSection.hidden || !state.parsedLyricsLines.length) return;
  if (lyricsSection.style.display === 'none') return;

  let activeIndex = -1;
  for (let i = 0; i < state.parsedLyricsLines.length; i++) {
    if (state.parsedLyricsLines[i].time !== null && state.parsedLyricsLines[i].time <= currentTime + 0.3) {
      activeIndex = i;
    } else if (state.parsedLyricsLines[i].time !== null && state.parsedLyricsLines[i].time > currentTime + 0.3) {
      break;
    }
  }

  if (activeIndex !== -1) {
    state.parsedLyricsLines.forEach((item, idx) => {
      if (idx === activeIndex) {
        if (!item.el.classList.contains('active')) {
          item.el.classList.add('active');
          if (!state.isUserScrollingLyrics) {
            const canvas = document.getElementById('lyricsCanvas');
            if (canvas && item.el) {
              const targetScrollTop = item.el.offsetTop - (canvas.clientHeight / 2) + (item.el.clientHeight / 2);
              canvas.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
            }
          }
        }
      } else {
        item.el.classList.remove('active');
      }
    });
  }
}

// Split from the former site.js (feature: state). See docs/architecture.md.
// Mutable state shared across modules (formerly top-level `let`s in the site.js closure).
export const state = {
  currentInspectedTrack: null,
  tracks: (typeof window !== 'undefined' && Array.isArray(window.tracks) && window.tracks.length > 0) ? window.tracks : [],
  currentTrackIndex: 0,
  isPlaying: false,
  shuffleMode: localStorage.getItem('spotifake.shuffleMode') || 'off',
  loopMode: localStorage.getItem('spotifake.loopMode') || 'off',
  uploadedTrackUrls: [],
  authToken: undefined,
  currentAuthRole: undefined,
  queueOrder: [],
  smartOrderList: null,
  playlistQueueTitle: null,
  smartSeen: new Set(),
  smartSeenTitle: null,
  playedKeys: new Set(),
  playedQueueTitle: null,
  activeQueue: [],
  currentQueueTitle: 'Library',
  currentQueueContext: null,
  currentViewedPlaylist: null,
  currentTrackPlayRecorded: false,
  userPlaylists: [],
  selectedPlaylistId: '',
  pendingAddSongFileName: '',
  currentUser: null,
  freeTierSongCount: parseInt(localStorage.getItem('spotifake_free_songs') || '0', 10),
  skipTimestamps: JSON.parse(localStorage.getItem('spotifake_skips') || '[]'),
  selectedCheckoutPlan: 'Individual',
  selectedCheckoutPrice: 4.99,
  isPlayingAdBreak: false,
  currentTransactionId: '',
  currentAuthMode: 'login',
  previousVolume: 1,
  searchDebounceTimer: null,
  currentRightPanelMode: 'none',
  parsedLyricsLines: [],
  isUserScrollingLyrics: false,
  userLyricsScrollTimeout: null,
  currentMadeForYouMixes: [],
  currentWaveformComments: [],
  lastDanmakuTime: 0,
  activeTrackId: null,
  isSongDetailLyricsExpanded: false,
  contextMenuTargetSong: null,
};

export function initState1() {
try {
    Object.defineProperty(window, 'tracks', {
      get() { return state.tracks; },
      set(val) { state.tracks = Array.isArray(val) ? val : []; },
      configurable: true
    });
  } catch (e) {
    window.tracks = state.tracks;
  }
}

export function initState2() {
window.platformSettings = {
    skipLimit: 6,
    adFrequency: 3,
    bitrateCap: '128',
    lyricsMode: 'blur',
    maintenanceMode: false,
    maintenanceMessage: '',
    allowRegistration: true
  };
}

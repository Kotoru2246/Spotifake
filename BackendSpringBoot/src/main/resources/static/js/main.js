// Entry point for the web player (loaded with <script type="module"> from Home/Index.html).
import './modules/windowBindings.js';
import { initState1, initState2 } from './modules/state.js';
import { initApi1 } from './modules/api.js';
import { initPlatform1, initPlatform2 } from './modules/platform.js';
import { initPlaylists1, initPlaylists2, initPlaylists3, initPlaylists4 } from './modules/playlists.js';
import { initAuth1, initAuth2 } from './modules/auth.js';
import { initLibrary1 } from './modules/library.js';
import { initAdmin1 } from './modules/admin.js';
import { initPlayer1 } from './modules/player.js';
import { initSearch1 } from './modules/search.js';
import { initHome1, initHome2 } from './modules/home.js';
import { initSongDetail1 } from './modules/songDetail.js';
import { initArtist1 } from './modules/artist.js';
import { initQueue1 } from './modules/queue.js';

// Run the former site.js top-level statements in their original order.
import { initNav } from './modules/nav.js';
initNav();
initState1();
initApi1();
initState2();
initPlatform1();
initPlatform2();
initPlaylists1();
initPlaylists2();
initAuth1();
initLibrary1();
initPlaylists3();
initAdmin1();
initPlayer1();
initAuth2();
initSearch1();
initHome1();
initSongDetail1();
initArtist1();
initPlaylists4();
initHome2();
initQueue1();

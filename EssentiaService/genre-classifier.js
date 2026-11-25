/**
 * Genre Classification using Essentia.js
 * 
 * This module uses Essentia.js to analyze audio files and classify:
 * - Primary genre
 * - Mood/tags
 * - Confidence scores
 */

const Essentia = require('essentia.js');

// Initialize Essentia
let essentia = null;

async function initEssentia() {
  if (!essentia) {
    console.log('Initializing Essentia.js...');
    try {
      // Initialize Essentia with WASM backend
      essentia = new Essentia.EssentiaExtractor();
      console.log('✓ Essentia.js initialized');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw error;
    }
  }
  return essentia;
}

/**
 * Supported genres mapped from Essentia classifier output
 */
const SUPPORTED_GENRES = [
  'acoustic',
  'ambient',
  'blues',
  'classical',
  'country',
  'dance',
  'edm',
  'electronic',
  'folk',
  'funk',
  'hip-hop',
  'indie',
  'jazz',
  'metal',
  'pop',
  'reggae',
  'rock',
  'soul'
];

/**
 * Mood mapping from features to mood categories
 */
const MOOD_MAPPING = {
  happy: { valence: 0.6, energy: 0.5 },
  sad: { valence: 0.3, energy: 0.3 },
  energetic: { valence: 0.5, energy: 0.8 },
  calm: { valence: 0.5, energy: 0.3 },
  aggressive: { valence: 0.3, energy: 0.9 },
  instrumental: { instrumentalness: 0.8 },
  acoustic: { acousticness: 0.7 }
};

/**
 * Classify audio file for genre and mood
 * @param {string} filePath - Path to audio file
 * @returns {Promise<Object>} Classification result
 */
async function classify(filePath) {
  try {
    const ess = await initEssentia();

    console.log(`  Extracting features from ${filePath}...`);

    // Extract audio features using Essentia
    let features;
    try {
      // Use Essentia's music extractor
      features = await ess.extractorProfile({
        filePath: filePath,
        profile: 'automatic'
      });
    } catch (err) {
      console.warn('  Essentia automatic profile failed, using basic extraction');
      // Fallback to basic feature extraction
      features = await basicFeatureExtraction(filePath);
    }

    // Classify genre based on features
    const genreScores = classifyGenre(features);
    const topKey = Object.keys(genreScores).reduce((a, b) =>
      genreScores[a] > genreScores[b] ? a : b
    );
    const primaryGenre = genreScores[topKey] > 0 ? topKey : null;
    const num = (v, d) => Number.isFinite(v) ? +v.toFixed(d) : null;

    // Determine mood tags
    const moodTags = detectMood(features);

    // Calculate confidence
    const confidence = primaryGenre ? Math.min(genreScores[primaryGenre], 1.0) : 0;

    return {
      genre: primaryGenre,
      confidence: parseFloat(confidence.toFixed(2)),
      genre_scores: Object.fromEntries(
        Object.entries(genreScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
      ),
      tags: moodTags,
      features: {
        tempo: num(features.tempo, 1),
        energy: num(features.energy, 2),
        danceability: num(features.danceability, 2),
        acousticness: num(features.acousticness, 2),
        valence: num(features.valence, 2),
        instrumentalness: num(features.instrumentalness, 2),
        key: features.key,
        mode: features.mode
      }
    };
  } catch (error) {
    console.error(`Classification error for ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Classify genre based on audio features
 * Uses heuristic rules combined with feature analysis
 */
function classifyGenre(features) {
  const scores = {};
  const fin = (v) => Number.isFinite(v) ? v : NaN;
  let energy = fin(features.energy);
  let acousticness = fin(features.acousticness);
  let danceability = fin(features.danceability);
  let tempo = fin(features.tempo);
  let instrumentalness = fin(features.instrumentalness);
  let valence = fin(features.valence);

  // Initialize all genres with base score
  SUPPORTED_GENRES.forEach(genre => {
    scores[genre] = 0;
  });

  // Acoustic
  if (acousticness > 0.6) {
    scores['acoustic'] += acousticness;
    scores['folk'] += acousticness * 0.7;
    scores['country'] += acousticness * 0.5;
  }

  // Electronic/EDM
  if (acousticness < 0.3 && danceability > 0.6) {
    scores['edm'] += danceability * 0.8;
    scores['electronic'] += danceability * 0.7;
    scores['dance'] += danceability * 0.9;
  }

  // Rock
  if (energy > 0.7 && acousticness < 0.4) {
    scores['rock'] += energy * 0.8;
    scores['metal'] += (energy - 0.7) * 2;
  }

  // Pop
  if (danceability > 0.5 && energy > 0.4 && valence > 0.4) {
    scores['pop'] += (danceability + energy) / 2;
  }

  // Hip-hop
  if (tempo < 100 && energy > 0.5 && danceability > 0.6) {
    scores['hip-hop'] += 0.7;
    scores['funk'] += 0.5;
  }

  // Jazz/Blues
  if (instrumentalness > 0.6 && tempo > 80 && tempo < 120) {
    scores['jazz'] += instrumentalness * 0.7;
    scores['blues'] += instrumentalness * 0.6;
  }

  // Ambient
  if (energy < 0.3 && acousticness > 0.4) {
    scores['ambient'] += (1 - energy);
    scores['classical'] += (1 - energy) * 0.5;
  }

  // Classical
  if (instrumentalness > 0.8 && (tempo > 60 && tempo < 100)) {
    scores['classical'] += instrumentalness;
  }

  // Reggae/Soul
  if (tempo < 100 && valence > 0.5) {
    scores['reggae'] += valence * 0.6;
    scores['soul'] += valence * 0.7;
  }

  // Country
  if (acousticness > 0.5 && tempo < 120) {
    scores['country'] += acousticness * 0.6;
    scores['folk'] += acousticness * 0.5;
  }

  // Indie
  if (danceability > 0.4 && energy > 0.5) {
    scores['indie'] += 0.4;
  }

  // Normalize scores to 0-1 range
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    Object.keys(scores).forEach(genre => {
      scores[genre] = Math.min(scores[genre] / maxScore, 1.0);
    });
  }

  // No rule matched: all scores stay 0 and the caller reports genre null
  return scores;
}

/**
 * Detect mood tags from audio features
 */
function detectMood(features) {
  const tags = [];
  const energy = Number.isFinite(features.energy) ? features.energy : NaN;
  const valence = Number.isFinite(features.valence) ? features.valence : NaN;
  const acousticness = Number.isFinite(features.acousticness) ? features.acousticness : NaN;
  const instrumentalness = Number.isFinite(features.instrumentalness) ? features.instrumentalness : NaN;
  const tempo = Number.isFinite(features.tempo) ? features.tempo : NaN;

  // Valence-based moods
  if (valence > 0.6 && energy > 0.5) tags.push('happy');
  if (valence < 0.4 && energy < 0.5) tags.push('sad');
  if (valence < 0.4 && energy > 0.6) tags.push('aggressive');
  if (valence > 0.5 && energy < 0.4) tags.push('calm');

  // Energy-based moods
  if (energy > 0.8) tags.push('energetic');
  if (energy < 0.3) tags.push('mellow');

  // Acoustic/Instrumental
  if (acousticness > 0.7) tags.push('acoustic');
  if (instrumentalness > 0.7) tags.push('instrumental');

  // Tempo-based
  if (tempo > 140) tags.push('fast');
  if (tempo < 80) tags.push('slow');

  // Remove duplicates
  return [...new Set(tags)];
}

/**
 * Basic feature extraction fallback
 * Used when Essentia advanced profile fails
 */
async function basicFeatureExtraction(filePath) {
  throw new Error('Feature extraction unavailable: essentia.js has no extractorProfile');
}

/**
 * Get supported genres
 */
function getSupportedGenres() {
  return SUPPORTED_GENRES;
}

module.exports = {
  classify,
  getSupportedGenres,
  initEssentia
};

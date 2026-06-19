const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('express-async-errors');
require('dotenv').config();

const genreClassifier = require('./genre-classifier');

const app = express();
const PORT = process.env.ESSENTIA_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Essentia.js Genre Classification Service',
    version: '1.0.0'
  });
});

/**
 * POST /classify
 * Classify genre and mood from audio file
 * 
 * Request body:
 *   - file_path: path to audio file
 * 
 * Response:
 *   {
 *     genre: "rock",
 *     tags: ["energetic", "instrumental"],
 *     confidence: 0.85,
 *     all_scores: { rock: 0.85, pop: 0.10, ... }
 *   }
 */
app.post('/classify', async (req, res) => {
  try {
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({ error: 'file_path is required' });
    }

    // Check if file exists
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: `File not found: ${file_path}` });
    }

    console.log(`Classifying: ${file_path}`);

    // Classify the audio file
    const result = await genreClassifier.classify(file_path);

    res.json({
      file_path,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      error: 'Classification failed',
      message: error.message
    });
  }
});

/**
 * POST /batch-classify
 * Classify multiple audio files
 * 
 * Request body:
 *   - files: array of file paths
 * 
 * Response:
 *   {
 *     results: [
 *       { file_path: "...", genre: "rock", ... },
 *       { file_path: "...", genre: "pop", ... }
 *     ]
 *   }
 */
app.post('/batch-classify', async (req, res) => {
  try {
    const { files } = req.body;

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'files must be an array' });
    }

    console.log(`Batch classifying ${files.length} files`);

    const results = [];
    for (const file_path of files) {
      try {
        if (!fs.existsSync(file_path)) {
          results.push({
            file_path,
            error: 'File not found'
          });
          continue;
        }

        const result = await genreClassifier.classify(file_path);
        results.push({
          file_path,
          ...result
        });
      } catch (err) {
        results.push({
          file_path,
          error: err.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Batch classification error:', error);
    res.status(500).json({
      error: 'Batch classification failed',
      message: error.message
    });
  }
});

/**
 * GET /genres
 * Get list of supported genres
 */
app.get('/genres', (req, res) => {
  res.json({
    supported_genres: genreClassifier.getSupportedGenres()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Essentia.js Classification Service running on http://localhost:${PORT}`);
  console.log(`  - Health check: GET http://localhost:${PORT}/health`);
  console.log(`  - Classify: POST http://localhost:${PORT}/classify`);
  console.log(`  - Batch: POST http://localhost:${PORT}/batch-classify`);
});

module.exports = app;

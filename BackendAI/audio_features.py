import librosa
import numpy as np
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Dict
try:
    from .essentia_client import classify_with_features
except ImportError:
    try:
        from essentia_client import classify_with_features
    except ImportError:
        classify_with_features = None



def to_native_python(value):
    """Convert numpy types to native Python types."""
    if isinstance(value, np.ndarray):
        # For numpy arrays, extract the scalar value
        return float(value.item())
    elif isinstance(value, (np.integer, np.floating)):
        return value.item()
    elif isinstance(value, (int, float)):
        return value
    else:
        return float(value)


# Maximum seconds of audio to load for feature extraction.
# Loading only a short clip (from the middle of the song) dramatically
# reduces processing time without meaningfully affecting feature quality.
_ANALYSIS_CLIP_SECONDS = 30


def _get_duration_seconds(file_path: str) -> float:
    """Cheaply get the duration of an audio file without fully decoding it."""
    try:
        import soundfile as sf
        info = sf.info(file_path)
        return info.duration
    except Exception:
        pass
    try:
        import mutagen
        f = mutagen.File(file_path)
        if f is not None and f.info is not None:
            return f.info.length
    except Exception:
        pass
    return 0.0


def extract_audio_features(file_path: str) -> Dict[str, float]:
    """
    Extract audio features from a file using librosa & numpy signal analysis.
    Only loads a short clip from the middle of the file for speed.
    Returns a dictionary of features that can be stored in the Song model.
    """
    # ------------------------------------------------------------------ #
    # 1. Get full duration cheaply (no full decode needed)
    # ------------------------------------------------------------------ #
    full_duration_s = _get_duration_seconds(file_path)
    duration_ms = int(full_duration_s * 1000)

    # ------------------------------------------------------------------ #
    # 2. Load only a short analysis clip from the middle of the song
    # ------------------------------------------------------------------ #
    clip_duration = _ANALYSIS_CLIP_SECONDS
    # Start from 25% into the song so we skip intros; fall back to 0 for short files
    clip_start = max(0.0, (full_duration_s * 0.25)) if full_duration_s > clip_duration * 1.5 else 0.0

    y = None
    sr = 22050

    # Try soundfile first — works for WAV/FLAC/OGG (supports real seeking, very fast)
    try:
        import soundfile as sf
        with sf.SoundFile(file_path) as f:
            f_sr = f.samplerate
            start_frame = int(clip_start * f_sr)
            clip_frames = int(clip_duration * f_sr)
            f.seek(start_frame)
            data = f.read(clip_frames)
        if len(data.shape) > 1:
            y_raw = np.mean(data, axis=1).astype(np.float32)
        else:
            y_raw = data.astype(np.float32)
        if f_sr != sr:
            y = librosa.resample(y_raw, orig_sr=f_sr, target_sr=sr)
        else:
            y = y_raw
        if duration_ms == 0:
            duration_ms = int(f.frames / f_sr * 1000)
    except Exception:
        # For MP3/AAC/M4A — soundfile can't read them OR can't true-seek.
        # Use ffmpeg to extract the clip to a temp WAV (sub-second), then
        # soundfile reads the WAV instantly.  This avoids librosa/audioread
        # decoding the entire file just to seek to the offset position.
        tmp_wav = None
        try:
            tmp_fd, tmp_wav = tempfile.mkstemp(suffix=".wav")
            os.close(tmp_fd)
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-ss", str(clip_start),       # seek BEFORE -i for fast input-side seek
                "-i", file_path,
                "-t", str(clip_duration),     # extract exactly 30 s
                "-ar", str(sr),               # resample to 22050 Hz
                "-ac", "1",                   # mono
                "-f", "wav",
                tmp_wav
            ]
            result = subprocess.run(
                ffmpeg_cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30
            )
            if result.returncode == 0:
                import soundfile as sf
                y, sr = sf.read(tmp_wav, dtype="float32", always_2d=False)
                print(f"   [ffmpeg clip] {clip_start:.0f}s–{clip_start+clip_duration:.0f}s extracted in WAV")
            else:
                raise RuntimeError("ffmpeg failed")
        except Exception as ffmpeg_err:
            print(f"⚠ ffmpeg extraction failed ({ffmpeg_err}), falling back to librosa full-load")
            try:
                y, sr = librosa.load(file_path, sr=sr, mono=True,
                                     offset=clip_start, duration=clip_duration)
            except Exception as e:
                print(f"⚠ Could not load audio file {file_path}: {e}")
                return {
                    "duration_ms": duration_ms,
                    "tempo": 120.0, "energy": 0.5, "danceability": 0.5,
                    "valence": 0.5, "acousticness": 0.5, "instrumentalness": 0.5,
                    "key": 0, "mode": 1,
                }
        finally:
            if tmp_wav and os.path.exists(tmp_wav):
                try:
                    os.remove(tmp_wav)
                except Exception:
                    pass

    # ------------------------------------------------------------------ #
    # 3. Compute features on the (short) clip — all fast numpy operations
    # ------------------------------------------------------------------ #
    # Energy & Loudness
    loudness = float(np.mean(np.abs(y)))
    energy = float(np.clip(loudness * 5.0, 0.0, 1.0))

    # Zero Crossing Rate (ZCR) — numpy only, instant
    zcr_val = float(np.mean(np.abs(np.diff(np.sign(y))) > 0))

    # Fast tempo estimate via autocorrelation of energy envelope
    # Much faster than librosa.beat.beat_track (~0.1s vs 10-30s)
    try:
        frame_len = int(sr * 0.05)  # 50ms frames
        hop = frame_len // 2
        # RMS energy per frame
        frames = np.array([
            float(np.sqrt(np.mean(y[i:i+frame_len]**2)))
            for i in range(0, len(y) - frame_len, hop)
        ])
        # Autocorrelation to find beat period
        corr = np.correlate(frames, frames, mode='full')
        corr = corr[len(corr)//2:]
        # BPM range 60-200 → period range in frames
        min_lag = max(1, int((sr / hop) * 60 / 200))
        max_lag = int((sr / hop) * 60 / 60)
        if max_lag > len(corr):
            max_lag = len(corr)
        best_lag = np.argmax(corr[min_lag:max_lag]) + min_lag
        tempo = float(np.clip((sr / hop) * 60.0 / best_lag, 60.0, 200.0))
    except Exception:
        tempo = 120.0

    # Fast spectral centroid via FFT — numpy only, instant
    try:
        fft_mag = np.abs(np.fft.rfft(y[:min(len(y), sr)]))  # 1s of audio
        freqs = np.fft.rfftfreq(min(len(y), sr), d=1.0/sr)
        sc_mean = float(np.sum(freqs * fft_mag) / (np.sum(fft_mag) + 1e-9))
    except Exception:
        sc_mean = 2500.0

    # Feature derivations
    danceability = float(np.clip(0.4 + (tempo / 200.0) * 0.3 + (energy * 0.3), 0.0, 1.0))
    acousticness = float(np.clip(1.0 - (energy * 0.7) - (sc_mean / 10000.0), 0.0, 1.0))
    valence = float(np.clip(0.3 + (energy * 0.4) + (danceability * 0.3), 0.0, 1.0))
    instrumentalness = float(np.clip((1.0 - zcr_val) * 0.5 + 0.3, 0.0, 1.0))
    key = int(np.argmax(np.abs(np.fft.rfft(y[:min(len(y), 22050)]))) % 12)
    mode = 1 if np.mean(y) >= 0 else 0

    print(f"📊 Extracted features for {file_path} (clip {clip_start:.0f}s–{clip_start+clip_duration:.0f}s):")
    print(f"   Tempo: {tempo:.1f} BPM, Energy: {energy:.2f}, Danceability: {danceability:.2f}")

    return {
        "duration_ms": duration_ms,
        "tempo": float(tempo),
        "energy": float(energy),
        "danceability": float(danceability),
        "valence": float(valence),
        "acousticness": float(acousticness),
        "instrumentalness": float(instrumentalness),
        "key": int(key),
        "mode": int(mode),
    }



def compute_danceability(y: np.ndarray, sr: int, tempo: float) -> float:
    """
    Compute danceability based on tempo, onset strength, and energy regularity.
    Higher tempo + regular beats = more danceable.
    """
    # Onset strength (beat regularity)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_mean = to_native_python(np.mean(onset_env))
    
    # Normalize tempo (assuming 60-180 BPM is typical)
    tempo_norm = to_native_python(np.clip(tempo / 120.0, 0.5, 1.5))
    
    # Combine tempo and onset strength
    danceability = to_native_python((tempo_norm * 0.6) + (onset_mean * 0.4))
    return danceability


def compute_acousticness(spectral_centroid: np.ndarray, zcr: np.ndarray) -> float:
    """
    Compute acousticness based on zero crossing rate.
    High ZCR = acoustic (percussive, natural instruments like drums, guitars, vocals).
    Low ZCR = electronic/synthetic (smooth synths, EDM, drum machines).
    """
    zcr_mean = float(np.mean(zcr))
    zcr_norm = float(np.clip(zcr_mean, 0, 1))
    
    # Direct relationship: higher ZCR = more acoustic
    acousticness = float(zcr_norm)
    return acousticness


def compute_valence(mfcc: np.ndarray, spectral_centroid: np.ndarray) -> float:
    """
    Compute valence (musical positivity) based on MFCC and spectral brightness.
    High spectral centroid + certain MFCC patterns = more positive/valent.
    """
    # Spectral brightness (higher = brighter/happier)
    sc_mean = float(np.mean(spectral_centroid))
    sc_norm = float(np.clip(sc_mean / 5000.0, 0, 1))
    
    # MFCC-based brightness (higher MFCC coefficients suggest brightness)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_val = float(mfcc_mean[1])
    mfcc_brightness = float(np.clip(mfcc_val / 100.0, 0, 1))
    
    valence = float((sc_norm * 0.5) + (mfcc_brightness * 0.5))
    return valence


def compute_instrumentalness(zcr: np.ndarray, energy: float) -> float:
    """
    Compute instrumentalness based on zero crossing rate.
    High ZCR = vocals present = low instrumentalness.
    Low ZCR = no clear vocals (could be instrumental or electronic synths).
    """
    zcr_mean = float(np.mean(zcr))
    zcr_norm = float(np.clip(zcr_mean, 0, 1))
    
    # High ZCR = vocals = less instrumental
    # Low ZCR = no vocals = more instrumental, but cap it so synths aren't too instrumental
    # Range: 0.3 (high ZCR/vocals) to 0.8 (low ZCR/no vocals)
    instrumentalness = float((1 - zcr_norm) * 0.5 + 0.3)
    
    return float(np.clip(instrumentalness, 0, 1))


def categorize_genre_and_mood(features: Dict[str, float], file_path: str = None) -> tuple:
    """
    Categorize genre and mood using ML-based classification.
    
    Uses trained ML models to classify audio into genres with confidence scores.
    
    Args:
        features: Dictionary of audio features from librosa
        file_path: Path to audio file (optional, for logging)
        
    Returns:
        Tuple of (genre, mood)
    """
    try:
        if classify_with_features is None:
            return categorize_genre_and_mood_rule_based(features)

        # Use ML-based classification
        genre, classification_data = classify_with_features(features)
        
        # Extract mood from tags
        mood = extract_mood_from_tags(classification_data.get('tags', []))
        
        print(f"✓ ML Classified: genre={genre}, mood={mood}, confidence={classification_data.get('confidence', 0):.2%}")
        return genre, mood
        
    except Exception as e:
        print(f"⚠ ML classification error: {e}, falling back to rule-based")
        return categorize_genre_and_mood_rule_based(features)



def extract_mood_from_tags(tags: list) -> str:
    """
    Extract primary mood from Essentia tags.
    
    Args:
        tags: List of tags from Essentia
        
    Returns:
        Mood category
    """
    # Map Essentia tags to mood categories
    mood_priority = ['happy', 'sad', 'calm', 'aggressive', 'energetic', 'acoustic', 'instrumental']
    
    for mood in mood_priority:
        if mood in tags:
            return mood
    
    # Default mood
    return 'neutral'


def categorize_genre_and_mood_rule_based(features: Dict[str, float]) -> tuple:
    """
    Rule-based genre and mood categorization based on features.
    This is the fallback when Essentia service is unavailable.
    """
    tempo = features.get("tempo", 0)
    energy = features.get("energy", 0)
    danceability = features.get("danceability", 0)
    valence = features.get("valence", 0)
    acousticness = features.get("acousticness", 0)
    
    # Genre categorization
    if acousticness > 0.7:
        genre = "acoustic"
    elif tempo > 140 and danceability > 0.6:
        genre = "edm" if energy > 0.7 else "dance"
    elif tempo < 90:
        genre = "ambient" if energy < 0.4 else "hip-hop"
    elif acousticness < 0.3 and energy > 0.7:
        genre = "rock"
    else:
        genre = "pop"
    
    # Mood categorization
    if valence > 0.6 and energy > 0.5:
        mood = "happy"
    elif valence < 0.4 and energy < 0.5:
        mood = "sad"
    elif valence > 0.6 and energy < 0.4:
        mood = "calm"
    elif valence < 0.4 and energy > 0.6:
        mood = "aggressive"
    else:
        mood = "neutral"
    
    return genre, mood

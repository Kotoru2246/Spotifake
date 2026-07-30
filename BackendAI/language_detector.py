import os
import whisper
import warnings

# Suppress FP16 warnings on CPU
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

# Load the model once to avoid loading it per request. 
# 'base' or 'tiny' are best for speed vs accuracy tradeoff.
_MODEL = None

import librosa

def get_whisper_model():
    global _MODEL
    if _MODEL is None:
        print("[LID] Loading Whisper 'base' model for Language Detection...")
        # Load the base model (approx 74MB) in memory
        _MODEL = whisper.load_model("base")
    return _MODEL

def detect_language(file_path: str, offset_pct: float = 0.50) -> str:
    """
    Detects the primary language of the given audio file using OpenAI Whisper.
    Jumps to the middle of the song to avoid instrumental intros.
    If confidence is below 0.40, assumes the track is instrumental.
    Returns the ISO language code or 'instrumental'/'unknown'.
    """
    try:
        model = get_whisper_model()
        
        # 1. Get duration and calculate the 50% jump mark
        try:
            import soundfile as sf
            full_duration_s = sf.info(file_path).duration
        except:
            full_duration_s = 180.0
            
        clip_start = max(0.0, (full_duration_s * offset_pct))
        
        # 2. Load 30 seconds of audio at EXACTLY 16000 Hz (Whisper's required rate) starting from the jump mark
        audio, _ = librosa.load(file_path, sr=16000, offset=clip_start, duration=30.0, mono=True)
        
        if len(audio) == 0:
            return "unknown"
            
        # Pad or trim to exactly 30 seconds (required by Whisper)
        audio = whisper.pad_or_trim(audio)
        
        # 3. Make log-Mel spectrogram and detect language
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        _, probs = model.detect_language(mel)
        
        detected_lang = max(probs, key=probs.get)
        confidence = probs[detected_lang]
        
        print(f"[LID] Detected language: {detected_lang} (confidence: {confidence:.2f})")
        
        # 4. Check confidence threshold (40%)
        if confidence < 0.40:
            print(f"[LID] Confidence {confidence:.2f} < 0.40. Tagging as 'instrumental'.")
            return "instrumental"
            
        return detected_lang
    except Exception as e:
        print(f"[LID] Error detecting language for {file_path}: {e}")
        return "unknown"

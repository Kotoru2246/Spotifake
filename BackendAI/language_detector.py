

--- VERSION ---

import os
import whisper
import warnings

# Suppress FP16 warnings on CPU
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

# Load the model once to avoid loading it per request. 
# 'base' or 'tiny' are best for speed vs accuracy tradeoff.
_MODEL = None

def get_whisper_model():
    global _MODEL
    if _MODEL is None:
        print("[LID] Loading Whisper 'base' model for Language Detection...")
        # Load the base model (approx 74MB) in memory
        _MODEL = whisper.load_model("base")
    return _MODEL

def detect_language(file_path: str) -> str:
    """
    Detects the primary language of the given audio file using OpenAI Whisper.
    Returns the ISO language code (e.g., 'en', 'es', 'ko').
    """
    try:
        model = get_whisper_model()
        
        # Load the audio and pad/trim it to fit 30 seconds
        audio = whisper.load_audio(file_path)
        audio = whisper.pad_or_trim(audio)
        
        # Make log-Mel spectrogram and move to the same device as the model
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        
        # Detect the spoken language
        _, probs = model.detect_language(mel)
        
        detected_lang = max(probs, key=probs.get)
        print(f"[LID] Detected language: {detected_lang} (confidence: {probs[detected_lang]:.2f})")
        return detected_lang
    except Exception as e:
        print(f"[LID] Error detecting language for {file_path}: {e}")
        return "unknown"

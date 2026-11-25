"""Genre classifier: PANNs Cnn14 audio embeddings + LogisticRegression trained on the library.

Replaces the FMA CNN as the main genre model (leave-one-artist-out checkpoint: 77% on 10 classes vs 61% for the
CNN, see genre_eval/RESULTS.md). The model bundle is built by genre_eval/train_final.py.

predict(path) decodes any ffmpeg-readable file itself (m4a/mp3/...), so callers can pass the original upload.
Returns {"genre": "Hip-Hop" | "Hip-Hop, R&B", "all_probs": {display_name: prob}} like CnnSpectrogramClassifier.
"""
import os
import shutil
import subprocess
import threading

import numpy as np

_HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("GENRE_MODEL_PATH", os.path.join(_HERE, "ml_models", "genre_panns_lr.joblib"))
_PANNS_CANDIDATES = [
    os.environ.get("PANNS_CHECKPOINT", ""),
    r"E:\SpotifakeCache\panns_data\Cnn14_mAP=0.431.pth",
    os.path.join(os.path.expanduser("~"), "panns_data", "Cnn14_mAP=0.431.pth"),
]

DECODE_SR = 48000   # the training pipeline decoded at 48 kHz, cropped, then resampled crops to 32 kHz
PANNS_SR = 32000
CROP_SEC = 10


def _ffmpeg() -> str:
    env = os.environ.get("FFMPEG_PATH", "")
    if env and os.path.isdir(env):   # main.py accepts FFMPEG_PATH as a file or a folder
        env = os.path.join(env, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    for cand in (env, shutil.which("ffmpeg"),
                 os.path.join(os.path.expanduser("~"), ".spotdl", "ffmpeg.exe"), r"C:\ffmpeg\bin\ffmpeg.exe"):
        if cand and os.path.isfile(cand):
            return cand
    raise RuntimeError("ffmpeg not found (set FFMPEG_PATH)")


def _decode(path: str, sr: int) -> np.ndarray:
    res = subprocess.run([_ffmpeg(), "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
    if res.returncode != 0 or not res.stdout:
        raise RuntimeError(f"ffmpeg decode failed: {res.stderr.decode(errors='replace')[-300:]}")
    return np.frombuffer(res.stdout, dtype=np.float32)


def _crops(y: np.ndarray, sr: int, n: int = 3, sec: int = CROP_SEC):
    """Loudest 10 s window + windows at 25% / 75% of the track (must match genre_eval/common.crops)."""
    L = sec * sr
    if len(y) < L:
        return [np.pad(y, (0, L - len(y)))] * n
    hop = sr
    # Window energies via a cumulative sum: same windows as the per-window loop, O(n) for long files.
    cs = np.concatenate(([0.0], np.cumsum(y.astype(np.float64) ** 2)))
    idx = np.arange(0, len(y) - L + 1, hop)
    rms = cs[idx + L] - cs[idx]
    starts = [int(rms.argmax()) * hop] + [int(f * (len(y) - L)) for f in (0.25, 0.75)]
    return [y[s:s + L] for s in starts[:n]]


def may_be_jpop(language: str, artist_languages) -> bool:
    """The model hears J-Pop in a lot of Western pop. Believe it only for a Japanese song, or for an
    artist who often sings in Japanese (so their English versions keep the label)."""
    if language == "ja":
        return True
    known = [lang for lang in artist_languages if lang]
    return bool(known) and known.count("ja") >= 0.2 * len(known)


def without_jpop(genre: str, all_probs: dict) -> str:
    """Drop J-Pop from a label; if nothing is left, take the model's next best genre."""
    kept = [g for g in genre.split(", ") if g and g != "J-Pop"]
    if kept:
        return ", ".join(kept)
    others = {g: p for g, p in all_probs.items() if g != "J-Pop"}
    return max(others, key=others.get) if others else ""


# Western artists who should also count as J-Pop, as a second genre (the owner's choice).
SUB_JPOP_ARTISTS = {"Jamie Paige"}


def with_sub_jpop(genre: str, artist: str) -> str:
    if artist in SUB_JPOP_ARTISTS and genre and "J-Pop" not in genre.split(", "):
        return f"{genre}, J-Pop"
    return genre


class EmbeddingGenreClassifier:
    def __init__(self, model_path: str = MODEL_PATH, panns_checkpoint: str = None):
        import importlib.util
        import joblib
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"genre model missing: {model_path} (run genre_eval/train_final.py)")
        for mod in ("torch", "librosa", "panns_inference"):
            if importlib.util.find_spec(mod) is None:
                raise ImportError(f"{mod} is not installed")
        # panns_inference downloads (wget) its label CSV on import and re-downloads the ~300 MB checkpoint when
        # the file is smaller than 3e8 bytes. Require both locally so it never touches the network at runtime.
        ckpt = panns_checkpoint or next((p for p in _PANNS_CANDIDATES if p and os.path.isfile(p)), None)
        if not ckpt or os.path.getsize(ckpt) < 3e8:
            raise FileNotFoundError("complete PANNs Cnn14 checkpoint not found (set PANNS_CHECKPOINT)")
        labels_csv = os.path.join(os.path.expanduser("~"), "panns_data", "class_labels_indices.csv")
        if not os.path.isfile(labels_csv):
            raise FileNotFoundError(f"PANNs label file missing: {labels_csv}")
        bundle = joblib.load(model_path)
        self.pipeline = bundle["pipeline"]
        self.classes = [str(c) for c in bundle["classes"]]
        self.display = bundle.get("display", {})
        self.ckpt = ckpt
        self._panns = None
        self._load_error = None
        self._lock = threading.Lock()   # PANNs model is shared between request threads

    def _model(self):
        # Caller holds self._lock. A failed load is remembered so later songs fall back at once.
        if self._load_error is not None:
            raise RuntimeError(f"PANNs failed to load: {self._load_error}")
        if self._panns is None:
            try:
                from panns_inference import AudioTagging
                self._panns = AudioTagging(checkpoint_path=self.ckpt, device="cpu")
            except Exception as e:
                self._load_error = e
                raise
        return self._panns

    def embed(self, path: str) -> np.ndarray:
        import librosa
        import torch
        y = _decode(path, DECODE_SR)
        crops32 = [librosa.resample(c, orig_sr=DECODE_SR, target_sr=PANNS_SR) for c in _crops(y, DECODE_SR)]
        with self._lock, torch.no_grad():
            _, emb = self._model().inference(np.stack(crops32))
        return emb.mean(0)

    def predict_embedding(self, emb: np.ndarray, second_min_prob: float = 0.35) -> dict:
        probs = self.pipeline.predict_proba(np.asarray(emb, dtype=np.float32).reshape(1, -1))[0]
        names = [self.display.get(c, c.title()) for c in self.classes]
        all_probs = {n: float(p) for n, p in zip(names, probs)}
        ranked = sorted(all_probs.items(), key=lambda kv: kv[1], reverse=True)
        label = [ranked[0][0]]
        if len(ranked) > 1 and ranked[1][1] >= second_min_prob:
            label.append(ranked[1][0])
        return {"genre": ", ".join(label), "all_probs": all_probs}

    def predict(self, path: str) -> dict:
        return self.predict_embedding(self.embed(path))

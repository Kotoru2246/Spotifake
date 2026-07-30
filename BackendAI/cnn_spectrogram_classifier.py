"""
cnn_spectrogram_classifier.py
------------------------------
Local FastAPI backend inference module for the CNN Mel-Spectrogram Genre Classifier.
After training on Google Colab, download 'cnn_genre_model.pth' and place it in BackendAI/ml_models/.

Usage:
    from cnn_spectrogram_classifier import CnnSpectrogramClassifier
    classifier = CnnSpectrogramClassifier()
    result = classifier.predict('path/to/audio.mp3')
    # Returns: {'genre': 'electronic', 'confidence': 0.87, 'all_probs': {...}}
"""

import os
import torch
import torch.nn as nn
import torchvision.models as models

try:
    import torchaudio
    import torchaudio.transforms as T
    HAS_TORCHAUDIO = True
except ImportError:
    HAS_TORCHAUDIO = False
    import librosa
    import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml_models', 'cnn_genre_model.pth')


class CnnSpectrogramClassifier:
    def __init__(self, model_path: str = MODEL_PATH):
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f'CNN genre model not found at: {model_path}\n'
                'Train the model on Google Colab (CNN_Spectrogram_Training_Colab.ipynb) '
                'and download cnn_genre_model.pth to BackendAI/ml_models/'
            )

        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f'[CNN] Loading model on {self.device}...')

        # Load the saved bundle
        bundle = torch.load(model_path, map_location=self.device)

        self.genres = bundle['genres']
        self.idx2label = {int(k): v for k, v in bundle['idx2label'].items()}
        self.num_classes = bundle['num_classes']

        # Spectrogram parameters (must match Colab training)
        self.sample_rate   = bundle.get('sample_rate', 22050)
        self.clip_seconds  = bundle.get('clip_seconds', 30)
        self.n_mels        = bundle.get('n_mels', 128)
        self.n_fft         = bundle.get('n_fft', 2048)
        self.hop_length    = bundle.get('hop_length', 512)
        self.target_length = bundle.get('target_length', 1292)

        # Re-create the same transforms used during training
        if HAS_TORCHAUDIO:
            self.mel_transform = T.MelSpectrogram(
                sample_rate=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels
            ).to(self.device)
            self.db_transform = T.AmplitudeToDB(top_db=80).to(self.device)
        else:
            self.mel_transform = None
            self.db_transform = None

        # Re-create the same ResNet18 architecture used during training
        self.model = models.resnet18(weights=None)
        self.model.fc = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(self.model.fc.in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(256, self.num_classes)
        )
        self.model.load_state_dict(bundle['model_state_dict'])
        self.model = self.model.to(self.device)
        self.model.eval()

        print(f'[CNN] Model loaded! Genres: {self.genres}')

    def _audio_to_spectrogram(self, filepath: str) -> torch.Tensor:
        """Converts an audio file to a 2D Mel-Spectrogram tensor."""
        try:
            waveform, sr = torchaudio.load(filepath)
        except Exception:
            import librosa
            import numpy as np
            y, sr = librosa.load(filepath, sr=self.sample_rate, mono=True)
            waveform = torch.tensor(y).unsqueeze(0)

        waveform = waveform.to(self.device)

        if HAS_TORCHAUDIO:
            # Resample if needed
            if sr != self.sample_rate:
                waveform = T.Resample(sr, self.sample_rate).to(self.device)(waveform)

            # Mix to mono
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)

            # Clip to loudest 30 seconds of the song
            target_samples = self.sample_rate * self.clip_seconds
            if waveform.shape[1] > target_samples:
                # Fast sliding window to find loudest segment (chorus)
                hop = self.sample_rate * 5  # 5 second hops
                sq = waveform.squeeze(0)
                max_rms = 0.0
                best_start = 0
                for i in range(0, sq.shape[0] - target_samples, hop):
                    rms = float(torch.sqrt(torch.mean(sq[i:i+target_samples]**2)))
                    if rms > max_rms:
                        max_rms = rms
                        best_start = i
                waveform = waveform[:, best_start:best_start + target_samples]
            else:
                pad = target_samples - waveform.shape[1]
                waveform = torch.nn.functional.pad(waveform, (0, pad))

            # Convert to Mel-Spectrogram
            mel = self.mel_transform(waveform)
            mel = self.db_transform(mel)
        else:
            # Using librosa fallback for everything
            y_np = waveform.squeeze().cpu().numpy()
            
            # Mix to mono
            if y_np.ndim > 1:
                y_np = np.mean(y_np, axis=0)
                
            # Clip to loudest 30 seconds
            target_samples = self.sample_rate * self.clip_seconds
            if len(y_np) > target_samples:
                hop = self.sample_rate * 5
                max_rms = 0.0
                best_start = 0
                for i in range(0, len(y_np) - target_samples, hop):
                    rms = float(np.sqrt(np.mean(y_np[i:i+target_samples]**2)))
                    if rms > max_rms:
                        max_rms = rms
                        best_start = i
                y_np = y_np[best_start:best_start + target_samples]
            else:
                pad = target_samples - len(y_np)
                y_np = np.pad(y_np, (0, pad))
                
            # Convert to Mel-Spectrogram
            S = librosa.feature.melspectrogram(
                y=y_np, sr=self.sample_rate, n_fft=self.n_fft,
                hop_length=self.hop_length, n_mels=self.n_mels
            )
            S_db = librosa.power_to_db(S, ref=np.max)
            mel = torch.tensor(S_db).unsqueeze(0).to(self.device)

        # Normalize
        mel = (mel - mel.min()) / (mel.max() - mel.min() + 1e-8)

        # Pad or crop to fixed target length
        if mel.shape[2] < self.target_length:
            mel = torch.nn.functional.pad(mel, (0, self.target_length - mel.shape[2]))
        else:
            mel = mel[:, :, :self.target_length]

        # Expand to 3 channels and add batch dimension
        mel = mel.repeat(3, 1, 1).unsqueeze(0)  # Shape: (1, 3, N_MELS, TARGET_LENGTH)
        return mel

    def predict(self, filepath: str) -> dict:
        """
        Predicts the genre of an audio file.
        Returns a dict with 'genre', 'confidence', and 'all_probs'.
        """
        mel = self._audio_to_spectrogram(filepath)

        with torch.no_grad():
            logits = self.model(mel)
            probs = torch.softmax(logits, dim=1).squeeze().cpu().numpy()

        top_idx = int(probs.argmax())
        all_probs = {self.idx2label[i]: float(probs[i]) for i in range(len(self.genres))}

        return {
            'genre': self.idx2label[top_idx],
            'confidence': float(probs[top_idx]),
            'all_probs': dict(sorted(all_probs.items(), key=lambda x: x[1], reverse=True))
        }


# Quick local test
if __name__ == '__main__':
    import sys
    test_file = sys.argv[1] if len(sys.argv) > 1 else 'gtzan_data/Data/genres_original/blues/blues.00000.wav'
    clf = CnnSpectrogramClassifier()
    result = clf.predict(test_file)
    print(f"\nPredicted Genre: {result['genre']} ({result['confidence']*100:.1f}% confidence)")
    print("\nAll probabilities:")
    for genre, prob in result['all_probs'].items():
        bar = '█' * int(prob * 40)
        print(f"  {genre:<15} {prob*100:5.1f}% {bar}")

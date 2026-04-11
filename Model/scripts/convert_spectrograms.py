import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
import os, glob
from tqdm import tqdm

def audio_to_mel_image(wav_path, output_path, sr=22050, n_mels=128, duration=3):
    try:
        y, sr = librosa.load(wav_path, sr=sr, duration=duration)
        target_len = sr * duration
        if len(y) < target_len:
            y = np.pad(y, (0, target_len - len(y)))
        else:
            y = y[:target_len]

        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, fmax=8000)
        mel_db = librosa.power_to_db(mel, ref=np.max)

        fig, ax = plt.subplots(figsize=(2.24, 2.24))
        librosa.display.specshow(mel_db, sr=sr, x_axis=None, y_axis=None,
                                  ax=ax, cmap='magma')
        ax.axis('off')
        plt.tight_layout(pad=0)
        plt.savefig(output_path, bbox_inches='tight', pad_inches=0, dpi=100)
        plt.close()
    except Exception as e:
        print(f"Skipped {wav_path}: {e}")

all_wavs = glob.glob(os.path.join("dataset", "**", "*.wav"), recursive=True)
print(f"Converting {len(all_wavs)} files...")

for wav_path in tqdm(all_wavs):
    # Fix Windows path issue
    parts = wav_path.split(os.sep)
    # parts = ['dataset', 'train', 'happy', 'file.wav']
    out_path = os.path.join("spectrograms", *parts[1:])
    out_path = out_path.replace(".wav", ".png")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    if not os.path.exists(out_path):
        audio_to_mel_image(wav_path, out_path)

print("Done! All spectrograms saved.")
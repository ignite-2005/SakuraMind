import sys
import json
import os
import io
import warnings
import numpy as np
import torch
import timm
import librosa
import librosa.display
import matplotlib
matplotlib.use("Agg")  # headless backend — required on servers (no display)
import matplotlib.pyplot as plt
from torchvision import transforms
from PIL import Image
warnings.filterwarnings("ignore")

# MODEL_PATH can be overridden with an env var when hosting (e.g. /app/Model/emotion_model.pth)
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), '..', 'Model', 'emotion_model.pth'),
)

_val_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


def load_model():
    """Load the checkpoint once and return (model, class_names). Call at server startup."""
    checkpoint = torch.load(MODEL_PATH, map_location='cpu')
    class_names = checkpoint['classes']
    model = timm.create_model('resnet18', pretrained=False, num_classes=len(class_names))
    model.load_state_dict(checkpoint['model_state'])
    model.eval()
    return model, class_names


def _mel_db(audio_path):
    y, sr = librosa.load(audio_path)
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr)
    return librosa.power_to_db(mel_spec, ref=np.max), sr


def _tight_image(mel_db, sr):
    """Small tight spectrogram fed to the model (matches training)."""
    fig, ax = plt.subplots(figsize=(2.24, 2.24))
    librosa.display.specshow(mel_db, sr=sr, x_axis=None, y_axis=None, ax=ax, cmap='magma')
    ax.axis('off')
    plt.tight_layout(pad=0)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
    plt.close(fig)
    buf.seek(0)
    return Image.open(buf).convert('RGB')


def predict(model, class_names, audio_path):
    """Stateless prediction — no file writes. Used by the FastAPI server (app.py)."""
    mel_db, sr = _mel_db(audio_path)
    img = _tight_image(mel_db, sr)
    tensor = _val_tf(img).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
    top_idx = int(probs.argmax().item())
    return {"emotion": class_names[top_idx], "confidence": float(probs[top_idx].item())}


# --------------------------------------------------------------------------
# CLI path — kept for local development (Next.js subprocess mode). Unchanged
# behaviour: writes mel.png + history.txt and prints sentinel-wrapped JSON.
# --------------------------------------------------------------------------
def do_inference(audio_path):
    try:
        model, class_names = load_model()
        mel_db, sr = _mel_db(audio_path)

        # Pretty spectrogram for the web UI (local /api/mel reads this file)
        fig, ax = plt.subplots(figsize=(6, 4))
        fig.patch.set_facecolor('none')
        ax.set_facecolor('none')
        img_spec = librosa.display.specshow(mel_db, sr=sr, x_axis='time', y_axis='mel', ax=ax, cmap='magma')
        cbar = fig.colorbar(img_spec, ax=ax, format='%+2.0f dB')
        cbar.ax.yaxis.set_tick_params(color='white')
        plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='white')
        cbar.outline.set_edgecolor('white')
        cbar.ax.yaxis.label.set_color('white')
        ax.tick_params(colors='white')
        ax.xaxis.label.set_color('white')
        ax.yaxis.label.set_color('white')
        ax.title.set_color('white')
        for spine in ax.spines.values():
            spine.set_edgecolor('white')
        plt.title('Mel Spectrogram')
        plt.tight_layout()
        plt.savefig("mel.png", transparent=True, dpi=150)
        plt.close(fig)

        result = predict(model, class_names, audio_path)

        with open("history.txt", "a") as f:
            f.write(f"{result['emotion']},{result['confidence']:.2f}\n")

        print("---JSON_START---")
        print(json.dumps(result))
        print("---JSON_END---")
    except Exception as e:
        print("---JSON_START---")
        print(json.dumps({"error": str(e)}))
        print("---JSON_END---")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Please provide an audio file path.")
        sys.exit(1)
    do_inference(sys.argv[1])

import sys
import json
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
import torch
import timm
from torchvision import transforms
from PIL import Image
import io
import warnings
warnings.filterwarnings("ignore")

def do_inference(audio_path):
    # Load model
    try:
        import os
        MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'Model', 'emotion_model.pth')
        checkpoint = torch.load(MODEL_PATH, map_location='cpu')
        CLASS_NAMES = checkpoint['classes']
        model = timm.create_model('resnet18', pretrained=False, num_classes=len(CLASS_NAMES))
        model.load_state_dict(checkpoint['model_state'])
        model.eval()
        
        val_tf = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])
        
        # Process audio
        y, sr = librosa.load(audio_path)
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr)
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Save generic spectrogram for web
        plt.figure(figsize=(6, 4))
        librosa.display.specshow(mel_db, sr=sr, x_axis='time', y_axis='mel')
        plt.colorbar(format='%+2.0f dB')
        plt.title('Mel Spectrogram')
        plt.savefig("mel.png")
        plt.close()
        
        # Save tight spectrogram for inference
        fig, ax = plt.subplots(figsize=(2.24, 2.24))
        librosa.display.specshow(mel_db, sr=sr, x_axis=None, y_axis=None,
                                  ax=ax, cmap='magma')
        ax.axis('off')
        plt.tight_layout(pad=0)
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
        plt.close(fig)
        buf.seek(0)
        
        img = Image.open(buf).convert('RGB')
        tensor = val_tf(img).unsqueeze(0)
        
        with torch.no_grad():
            probs = torch.softmax(model(tensor), dim=1)[0]
        
        top_idx = probs.argmax().item()
        detected_emotion = CLASS_NAMES[top_idx]
        confidence = probs[top_idx].item()
        
        # Record history
        with open("history.txt", "a") as f:
            f.write(f"{detected_emotion},{confidence:.2f}\n")
        
        # Return JSON uniquely to stdout to be parsed by Node.js
        print("---JSON_START---")
        print(json.dumps({"emotion": detected_emotion, "confidence": confidence}))
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

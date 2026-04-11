import sounddevice as sd
from scipy.io.wavfile import write
import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
import torch
import timm
from torchvision import transforms
from PIL import Image
import keyboard
import io
import os

# ============================================================
# 🔧 SETUP — Load Model Once at the Start
# ============================================================
print("🔧 Loading emotion model...")

checkpoint = torch.load('emotion_model.pth', map_location='cpu')
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

STATE_MAP = {
    'angry':   'Stress Detected',
    'fearful': 'Stress Detected',
    'sad':     'Low Engagement',
    'neutral': 'Normal',
    'calm':    'Normal',
    'happy':   'High Engagement'
}

EMOJI_MAP = {
    'angry':   '😡',
    'fearful': '😨',
    'sad':     '😔',
    'neutral': '😐',
    'calm':    '😌',
    'happy':   '😄'
}

print("✅ Model loaded!\n")

fs = 44100

# ============================================================
# 🎤 Step 1: Record Audio
# ============================================================
input("Press Enter to start recording...")

frames = []

def callback(indata, frame_count, time_info, status):
    frames.append(indata.copy())

print("🎤 Recording... Speak now! Press SPACE to stop.")
with sd.InputStream(samplerate=fs, channels=1, dtype='float32', callback=callback):
    keyboard.wait('space')

audio = np.concatenate(frames, axis=0).flatten()
write("audio.wav", fs, audio)
print("✅ Recording stopped!")

# ============================================================
# 📊 Step 2: Load Audio
# ============================================================
y, sr = librosa.load("audio.wav")

# ============================================================
# 📊 Step 3: Generate Mel Spectrogram
# ============================================================
print("📊 Generating Mel Spectrogram...")
mel_spec = librosa.feature.melspectrogram(y=y, sr=sr)
mel_db = librosa.power_to_db(mel_spec, ref=np.max)

plt.figure(figsize=(6, 4))
librosa.display.specshow(mel_db, sr=sr, x_axis='time', y_axis='mel')
plt.colorbar(format='%+2.0f dB')
plt.title('Mel Spectrogram')
plt.savefig("mel.png")
plt.show()

# ============================================================
# 🧠 Step 4: Real AI Emotion Detection
# ============================================================
print("🧠 Running AI emotion detection...")

fig, ax = plt.subplots(figsize=(2.24, 2.24))
librosa.display.specshow(mel_db, sr=sr, x_axis=None, y_axis=None,
                          ax=ax, cmap='magma')
ax.axis('off')
plt.tight_layout(pad=0)
buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, dpi=100)
plt.close()
buf.seek(0)

img = Image.open(buf).convert('RGB')
tensor = val_tf(img).unsqueeze(0)

with torch.no_grad():
    probs = torch.softmax(model(tensor), dim=1)[0]

top_idx = probs.argmax().item()
detected_emotion = CLASS_NAMES[top_idx]
confidence = probs[top_idx].item()

# ============================================================
# 🎯 Step 5: Learning State Mapping
# ============================================================
emotion = detected_emotion
state = STATE_MAP.get(detected_emotion, 'Normal')
emoji = EMOJI_MAP.get(detected_emotion, '🙂')

# ============================================================
# 📁 Step 6: Save to History File
# ============================================================
with open("history.txt", "a") as f:
    f.write(f"{detected_emotion},{confidence:.2f}\n")

# ============================================================
# 📖 Step 7: Read History
# ============================================================
with open("history.txt", "r") as f:
    lines = f.readlines()

history_emotions = [line.strip().split(',')[0] for line in lines if line.strip()]

# ============================================================
# 📊 Step 8: Final Output
# ============================================================
print("\n==============================")
print("📊 FINAL RESULT")
print("==============================")
print(f"🧠 Emotion  : {emoji} {emotion.upper()}")
print(f"📈 Confidence: {confidence:.0%}")
print(f"🎯 State    : {state}")
print("==============================")

print("\n📊 All Probabilities:")
for i, cls in enumerate(CLASS_NAMES):
    bar = "█" * int(probs[i].item() * 30)
    print(f"  {cls:<10} {bar:<30} {probs[i]:.0%}")

# ============================================================
# 📉 Step 9: Trend Analysis
# ============================================================
print("\n📉 Trend Analysis:")
if len(history_emotions) >= 2:
    recent = history_emotions[-5:]
    stress_count = recent.count('angry') + recent.count('fearful')
    sad_count = recent.count('sad')

    if stress_count >= 2:
        print("🔥 Burnout risk increasing — take a break!")
    elif sad_count >= 2:
        print("💙 Low engagement detected — try a different activity")
    else:
        print("🙂 Stable condition — keep going!")

    print(f"\n📋 Last {len(recent)} readings: {', '.join(recent)}")
else:
    print("📊 Not enough data yet — run a few more times")
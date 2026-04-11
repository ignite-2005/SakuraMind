# SakuraMind Backend

This folder contains Python scripts used for audio emotion inference and local demo workflows.

## Files

- [inference.py](inference.py): production-facing script invoked by frontend API route
- [main.py](main.py): interactive local recording and analysis script
- [demo_update.py](demo_update.py): utility for appending demo values to history

## Python Environment

From repository root:

```bash
python -m venv venv
venv\Scripts\activate
pip install torch torchvision timm librosa matplotlib numpy pillow scipy sounddevice keyboard pydub
```

## Inference Flow

Implemented in [inference.py](inference.py):

1. Load checkpoint from [../Model/emotion_model.pth](../Model/emotion_model.pth)
2. Load audio input file
3. Build mel spectrogram
4. Save visualization image to [../mel.png](../mel.png)
5. Run model inference and compute confidence
6. Append emotion result to [../history.txt](../history.txt)
7. Print JSON result wrapped with sentinels:
   - ---JSON_START---
   - ---JSON_END---

Sentinel output allows robust extraction by frontend route handler.

## Run Inference Manually

From repository root:

```bash
venv\Scripts\activate
python backend/inference.py temp.wav
```

Expected stdout includes JSON payload between sentinel markers.

## Integration Contract

The frontend route [../frontend/app/api/analyze/route.ts](../frontend/app/api/analyze/route.ts) expects:

- Valid sentinel markers in stdout
- JSON with either:
  - emotion and confidence, or
  - error

If sentinel markers are missing, API responds with extraction failure.

## Notes

- The script defaults to CPU loading with map_location=cpu
- Emotion classes come from checkpoint metadata
- Frontend normalizes fearful to angry and calm to neutral

## Troubleshooting

- ModuleNotFoundError:
  - activate venv and reinstall dependencies
- Missing model file:
  - ensure [../Model/emotion_model.pth](../Model/emotion_model.pth) exists
- Bad audio input:
  - confirm WAV conversion from frontend or provide clean WAV manually

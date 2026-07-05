# SakuraMind Backend

The Python inference service for SakuraMind. It exposes a FastAPI HTTP API used in
production (Hugging Face Spaces) and a CLI path used for local development.

## Files

- [app.py](app.py): FastAPI server — `GET /health` and `POST /analyze`
- [inference.py](inference.py): model loading, prediction, and spectrogram rendering (importable functions + CLI)
- [requirements.txt](requirements.txt): pinned Python dependencies (CPU-only PyTorch)
- [main.py](main.py): interactive local recording and analysis script
- [demo_update.py](demo_update.py): utility for appending demo values to history

## Two ways it runs

| Mode | Entry point | Used by |
|------|-------------|---------|
| **HTTP service** (production) | `app.py` (FastAPI/Uvicorn) | Hosted backend; frontend proxies to it when `INFERENCE_API_URL` is set |
| **CLI subprocess** (local dev) | `inference.py <wav>` | Frontend spawns it via `child_process` when `INFERENCE_API_URL` is unset |

## Python Environment

From repository root:

```bash
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r backend/requirements.txt
```

`ffmpeg` must also be available on PATH for WebM → WAV conversion.

## Run the HTTP service locally

```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 7860
```

Then point the frontend at it with `INFERENCE_API_URL=http://localhost:7860` in
`frontend/.env.local`.

### Endpoints

**`GET /health`** — service status and the model's class list:

```json
{ "status": "ok", "classes": ["angry", "calm", "fearful", "happy", "neutral", "sad"] }
```

**`POST /analyze`** — multipart form, field `voiceBlob`:

```json
{
  "emotion": "calm",
  "confidence": 0.21,
  "mel": "data:image/png;base64,iVBORw0KGgo..."
}
```

- `confidence` is a probability in `[0, 1]` (the frontend scales it to a percentage).
- `mel` is a base64 PNG data URL of the spectrogram, rendered in memory (no disk writes).

## Inference flow (`inference.py`)

Importable functions used by `app.py`:

1. `load_model()` — load checkpoint from [../Model/emotion_model.pth](../Model/emotion_model.pth) once at startup; returns `(model, class_names)`.
2. `predict(model, class_names, wav_path)` — build a mel spectrogram, run ResNet18 inference, return `{ emotion, confidence }`. Stateless (no file writes).
3. `spectrogram_data_url(wav_path)` — render the web spectrogram as a base64 PNG data URL.

The model path can be overridden with the `MODEL_PATH` environment variable (used in the container).

## CLI path (local subprocess mode)

```bash
python backend/inference.py temp.wav
```

For backward compatibility this path also writes `mel.png` / `history.txt` and prints the
result as JSON wrapped in sentinel markers (`---JSON_START---` / `---JSON_END---`) so the
local Next.js route can parse stdout robustly.

## Configuration

- `MODEL_PATH` — path to the model checkpoint (defaults to `../Model/emotion_model.pth`).
- `ALLOWED_ORIGINS` — comma-separated CORS origins (defaults to the Vercel site + `localhost:3000`).
- `PORT` — server port (defaults to `7860`, the port Hugging Face Spaces expects).

## Deployment

The repository-root [../Dockerfile](../Dockerfile) containerizes this service (Python 3.11 +
ffmpeg + CPU PyTorch), copies `backend/` and the model weights, and serves FastAPI on port
`7860`. See the root [README](../README.md) "Deployment" section for the Hugging Face Spaces steps.

## Notes

- The model loads on CPU (`map_location=cpu`); emotion classes come from checkpoint metadata.
- The frontend normalizes `fearful` → angry and `calm` → neutral, and maps unknown labels to neutral.
- `torch` threads are capped and `matplotlib`/`numba` cache dirs are redirected to `/tmp` for constrained hosts.

## Troubleshooting

- **ModuleNotFoundError** — activate the venv and reinstall from `requirements.txt`.
- **Missing model file** — ensure [../Model/emotion_model.pth](../Model/emotion_model.pth) exists (it is git-ignored; see [../Model/README.md](../Model/README.md)).
- **ffmpeg errors** — install ffmpeg and ensure it is on PATH.
- **Slow / hanging inference when hosted** — the model needs real CPU/RAM; heavily throttled free tiers (~0.1 vCPU) are not sufficient.

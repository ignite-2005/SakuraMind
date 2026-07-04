import os
import tempfile
import subprocess

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from inference import load_model, predict

app = FastAPI(title="SakuraMind Inference API")

# Which frontends may call this API. Override in production with the
# ALLOWED_ORIGINS env var (comma-separated).
_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://sakura-mind.vercel.app,http://localhost:3000",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model ONCE at startup (not per request).
MODEL, CLASS_NAMES = load_model()


@app.get("/health")
def health():
    return {"status": "ok", "classes": CLASS_NAMES}


@app.post("/analyze")
async def analyze(voiceBlob: UploadFile = File(...)):
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "input")
        wav = os.path.join(tmp, "output.wav")
        with open(src, "wb") as f:
            f.write(await voiceBlob.read())

        # WebM (or anything) -> 44.1kHz mono WAV via ffmpeg (installed in the image)
        try:
            subprocess.run(
                ["ffmpeg", "-i", src, "-ar", "44100", "-ac", "1", wav, "-y"],
                check=True, capture_output=True,
            )
        except subprocess.CalledProcessError as e:
            raise HTTPException(500, f"ffmpeg failed: {e.stderr.decode()[:300]}")

        try:
            return predict(MODEL, CLASS_NAMES, wav)  # {"emotion": ..., "confidence": 0-1}
        except Exception as e:
            raise HTTPException(500, f"inference failed: {e}")

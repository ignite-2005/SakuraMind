FROM python:3.11-slim

# ffmpeg is required to convert the browser's WebM audio to WAV
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (better layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# App code + model weights
COPY backend/ ./backend/
COPY Model/emotion_model.pth ./Model/emotion_model.pth

ENV MODEL_PATH=/app/Model/emotion_model.pth
ENV PORT=8000

WORKDIR /app/backend
# Render/Fly inject $PORT; default to 8000 locally
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]

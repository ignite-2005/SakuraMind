FROM python:3.11-slim

# ffmpeg is required to convert the browser's WebM audio to WAV
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces runs containers as a non-root user (uid 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    MPLCONFIGDIR=/tmp/mpl \
    NUMBA_CACHE_DIR=/tmp/numba

WORKDIR /app

# Install Python deps first (better layer caching)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# App code + model weights
COPY backend/ ./backend/
COPY Model/emotion_model.pth ./Model/emotion_model.pth

ENV MODEL_PATH=/app/Model/emotion_model.pth
# HF Spaces expects the app on port 7860; PORT is overridable for other hosts
ENV PORT=7860

RUN chown -R user:user /app
USER user

WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]

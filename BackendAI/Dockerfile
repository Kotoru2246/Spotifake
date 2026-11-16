# Spotifake Python AI Service Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install core Python dependencies
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic spotipy python-dotenv sqlmodel \
    numpy scipy scikit-learn pandas mutagen PyJWT httpx

# Copy source code
COPY . .

EXPOSE 5000

ENV PORT=5000 \
    PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

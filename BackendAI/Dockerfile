# Spotifake Python AI Service Dockerfile
FROM python:3.12-slim
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

# CPU-only PyTorch first, so requirements.txt does not pull the multi-GB CUDA build
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# main.py uses relative imports, so the code must live in a "BackendAI" package
COPY . ./BackendAI

EXPOSE 5000

ENV PORT=5000 \
    PYTHONUNBUFFERED=1

CMD ["uvicorn", "BackendAI.main:app", "--host", "0.0.0.0", "--port", "5000"]

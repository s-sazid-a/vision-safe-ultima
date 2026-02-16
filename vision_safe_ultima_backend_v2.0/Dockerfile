FROM python:3.10-slim

# 1. Install System Dependencies (Fixes libGL crash)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy Requirements
COPY requirements.txt .

# 3. Install Python Dependencies
# - Force CPU Pytorch (Small size)
# - Install requirements
# - Fix OpenCV: Remove "cv2" (GPU) and force "opencv-python-headless" (CPU)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision && \
    pip install --no-cache-dir -r requirements.txt && \
    pip uninstall -y opencv-python && \
    pip install --no-cache-dir opencv-python-headless

# 4. Copy Code
COPY . .

# 5. Start Command
# Uses $PORT supplied by Railway
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"

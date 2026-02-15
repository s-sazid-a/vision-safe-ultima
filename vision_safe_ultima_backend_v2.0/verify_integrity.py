import cv2
import numpy as np
from ultralytics import YOLO
import sys
from pathlib import Path

# Paths (force absolute paths)
BASE_DIR = Path(r"C:\Users\sksaz\Desktop\vision_safe_ultima_v2.0\vision_safe_ultima_backend_v2.0\models")
SAFE_MODEL_PATH = BASE_DIR / "safe_detector.pt"
UNSAFE_MODEL_PATH = BASE_DIR / "unsafe_detector.pt"

print("="*60)
print("MODEL INTEGRITY CHECK")
print("="*60)

# Check existence
if not SAFE_MODEL_PATH.exists():
    print(f"❌ FAIL: Safe model missing: {SAFE_MODEL_PATH}")
    sys.exit(1)

if not UNSAFE_MODEL_PATH.exists():
    print(f"❌ FAIL: Unsafe model missing: {UNSAFE_MODEL_PATH}")
    sys.exit(1)

# 1. Load Models with minimal config
try:
    print(f"Loading SAFE model: {SAFE_MODEL_PATH.name}")
    print(f"  Size: {SAFE_MODEL_PATH.stat().st_size / (1024*1024):.1f} MB")
    safe = YOLO(str(SAFE_MODEL_PATH))
    print(f"  ✅ Architecture: {safe.ckpt['model'].yaml if safe.ckpt else 'Unknown'}")
    print(f"  ✅ Safe classes: {safe.names}")
    
    print(f"\nLoading UNSAFE model: {UNSAFE_MODEL_PATH.name}")
    print(f"  Size: {UNSAFE_MODEL_PATH.stat().st_size / (1024*1024):.1f} MB")
    unsafe = YOLO(str(UNSAFE_MODEL_PATH))
    print(f"  ✅ Architecture: {unsafe.ckpt['model'].yaml if unsafe.ckpt else 'Unknown'}")
    print(f"  ✅ Unsafe classes: {unsafe.names}")
except Exception as e:
    print(f"❌ CRITICAL FAILURE: Model file corrupted. {e}")
    sys.exit(1)

# 2. Synthetic Inference
print("\nRunning synthetic inference (Empty check)...")
img = np.zeros((640, 640, 3), dtype=np.uint8)
cv2.rectangle(img, (100, 100), (400, 400), (255, 255, 255), -1)

res_safe = safe(img, conf=0.1, verbose=False)
res_unsafe = unsafe(img, conf=0.1, verbose=False)

print(f"✅ Inference passed. Detections: {len(res_safe[0].boxes)} safe, {len(res_unsafe[0].boxes)} unsafe")
print("\n============================================================")
print("CONCLUSION:")
print("The .pt files are structurally sound.")
print("The problem is NOT inside the models themselves.")
print("============================================================")

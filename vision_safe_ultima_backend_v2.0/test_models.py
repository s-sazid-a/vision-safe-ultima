"""
Quick diagnostic to test if models load correctly
"""
import sys
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).parent
sys.path.insert(0, str(backend_root))

print("="*60)
print("VISION SAFE ULTIMA - MODEL LOADING DIAGNOSTIC")
print("="*60)

# 1. Check if models exist
print("\n1. Checking if model files exist...")
models_dir = backend_root / "models"
safe_model = models_dir / "safe_detector.pt"
unsafe_model = models_dir / "unsafe_detector.pt"

print(f"   Models directory: {models_dir}")
print(f"   SAFE model exists: {safe_model.exists()} ({safe_model})")
print(f"   UNSAFE model exists: {unsafe_model.exists()} ({unsafe_model})")

if safe_model.exists():
    size_mb = safe_model.stat().st_size / (1024 * 1024)
    print(f"   SAFE model size: {size_mb:.1f} MB")

if unsafe_model.exists():
    size_mb = unsafe_model.stat().st_size / (1024 * 1024)
    print(f"   UNSAFE model size: {size_mb:.1f} MB")

# 2. Check ultralytics
print("\n2. Checking ultralytics installation...")
try:
    import ultralytics
    print(f"   ✅ ultralytics installed: version {ultralytics.__version__}")
except ImportError as e:
    print(f"   ❌ ultralytics NOT installed: {e}")
    print("   Run: pip install ultralytics")
    sys.exit(1)

# 3. Try loading models
print("\n3. Attempting to load models...")
try:
    from ultralytics import YOLO
    
    print("   Loading SAFE model...")
    safe_yolo = YOLO(str(safe_model))
    print(f"   ✅ SAFE model loaded successfully")
    print(f"      Classes: {safe_yolo.names}")
    
    print("\n   Loading UNSAFE model...")
    unsafe_yolo = YOLO(str(unsafe_model))
    print(f"   ✅ UNSAFE model loaded successfully")
    print(f"      Classes: {unsafe_yolo.names}")
    
except Exception as e:
    print(f"   ❌ Error loading models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 4. Test inference
print("\n4. Testing inference...")
try:
    import numpy as np
    dummy = np.zeros((640, 640, 3), dtype=np.uint8)
    
    print("   Running SAFE model inference...")
    result = safe_yolo(dummy, verbose=False)
    print(f"   ✅ SAFE inference successful")
    
    print("   Running UNSAFE model inference...")
    result = unsafe_yolo(dummy, verbose=False)
    print(f"   ✅ UNSAFE inference successful")
    
except Exception as e:
    print(f"   ❌ Error during inference: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 5. Test ML Service
print("\n5. Testing ML Service...")
try:
    from app.services.ml_service import ml_service
    print(f"   ML Service initialized: {ml_service.inference_service is not None}")
    
    if ml_service.inference_service:
        print("   ✅ ML Service loaded successfully!")
    else:
        print("   ⚠️  ML Service initialized but inference_service is None")
        
except Exception as e:
    print(f"   ❌ Error loading ML Service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
print("✅ ALL DIAGNOSTICS PASSED!")
print("="*60)
print("\nIf backend still shows 0% confidence:")
print("1. Restart the backend server (stop and run start_app.bat)")
print("2. Check browser console for WebSocket errors")
print("3. Clear browser cache and refresh")

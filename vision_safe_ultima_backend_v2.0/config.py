"""
Configuration management for Vision Safe Ultima Backend
Handles environment variables and default settings
"""
import os
from pathlib import Path
import torch
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

# ==================== ENVIRONMENT VARIABLES ====================
# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Frontend Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FRONTEND_PROD_URL = os.getenv("FRONTEND_PROD_URL", "https://yourdomain.com")

# Database Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# ML Model Configuration
ML_DEVICE = os.getenv("ML_DEVICE", "auto")  # "auto", "cuda", "cpu"
ML_CONF_THRESHOLD = float(os.getenv("ML_CONF_THRESHOLD", 0.5))
ML_IOU_THRESHOLD = float(os.getenv("ML_IOU_THRESHOLD", 0.45))
ML_ENABLE_TEMPORAL_SMOOTHING = os.getenv("ML_ENABLE_TEMPORAL_SMOOTHING", "true").lower() == "true"
ML_SMOOTHING_WINDOW = int(os.getenv("ML_SMOOTHING_WINDOW", 5))
ML_MAX_BATCH_SIZE = int(os.getenv("ML_MAX_BATCH_SIZE", 1))

# Performance Configuration
FRAME_SKIP = int(os.getenv("FRAME_SKIP", 1))  # Process every Nth frame
MAX_FRAME_SIZE = int(os.getenv("MAX_FRAME_SIZE", 640))
WEBSOCKET_TIMEOUT = int(os.getenv("WEBSOCKET_TIMEOUT", 30))

# ==================== DERIVED CONFIGURATION ====================
# Auto-detect device if needed
if ML_DEVICE == "auto":
    ML_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Model paths - BEST PERFORMANCE MODELS (YOLOv8 compatible only)
MODELS_DIR = Path(__file__).parent / "models"
# Using BEST performance YOLOv8 models for maximum accuracy
SAFE_MODEL_PATH = MODELS_DIR / "safe_detector.pt"     # Sazid's safe detector (49.6 MB, mAP50=0.893)
UNSAFE_MODEL_PATH = MODELS_DIR / "unsafe_detector.pt" # Sazid's unsafe detector (148.46 MB - LARGEST)

# CORS Configuration
ALLOWED_ORIGINS = [
    FRONTEND_URL,
]
if FRONTEND_PROD_URL != "https://yourdomain.com":
    ALLOWED_ORIGINS.append(FRONTEND_PROD_URL)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST"]
CORS_ALLOW_HEADERS = ["*"]

# Risk Level Definitions
RISK_LEVELS = {
    "LOW": 0,
    "HIGH": 1,
    "CRITICAL": 2
}

# Object Classifications
SAFE_ACTIVITIES = ["person_walking", "person_sitting", "person_standing", "person_yoga"]
CRITICAL_OBJECTS = ["fire"]
HIGH_RISK_OBJECTS = ["vehicle_car", "vehicle_motorbike"]

# ==================== EMAIL / ALERT SETTINGS ====================
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "false").lower() == "true"
ALERT_EMAIL_TO = os.getenv("ALERT_EMAIL_TO", "")
# Rate limiting for outgoing alert emails (seconds)
EMAIL_RATE_LIMIT_SECONDS = int(os.getenv("EMAIL_RATE_LIMIT_SECONDS", 30))

# Alerts config persistence
ALERTS_CONFIG_PATH = Path(__file__).parent / "alerts_config.json"
# Path for SQLite DB for alerts persistence
ALERTS_DB_PATH = Path(__file__).parent / "alerts.db"

# ==================== VALIDATION ====================
def validate_config():
    """Validate critical configuration on startup"""
    errors = []
    
    # Check model files exist
    if not SAFE_MODEL_PATH.exists():
        errors.append(f"SAFE model not found: {SAFE_MODEL_PATH}")
    if not UNSAFE_MODEL_PATH.exists():
        errors.append(f"UNSAFE model not found: {UNSAFE_MODEL_PATH}")
    
    # Check device is valid
    if ML_DEVICE not in ["cuda", "cpu"]:
        errors.append(f"Invalid ML_DEVICE: {ML_DEVICE}. Must be 'cuda' or 'cpu'")
    
    # Check thresholds
    if not (0 <= ML_CONF_THRESHOLD <= 1):
        errors.append(f"ML_CONF_THRESHOLD must be between 0 and 1, got {ML_CONF_THRESHOLD}")
    if not (0 <= ML_IOU_THRESHOLD <= 1):
        errors.append(f"ML_IOU_THRESHOLD must be between 0 and 1, got {ML_IOU_THRESHOLD}")
    
    return errors

def get_config_summary():
    """Return summary of current configuration"""
    return {
        "api": {
            "host": API_HOST,
            "port": API_PORT,
            "debug": DEBUG_MODE,
            "log_level": LOG_LEVEL,
        },
        "frontend": {
            "dev_url": FRONTEND_URL,
            "prod_url": FRONTEND_PROD_URL,
        },
        "ml": {
            "device": ML_DEVICE,
            "conf_threshold": ML_CONF_THRESHOLD,
            "iou_threshold": ML_IOU_THRESHOLD,
            "temporal_smoothing": ML_ENABLE_TEMPORAL_SMOOTHING,
            "smoothing_window": ML_SMOOTHING_WINDOW,
        },
        "performance": {
            "frame_skip": FRAME_SKIP,
            "max_frame_size": MAX_FRAME_SIZE,
        },
        "models": {
            "safe": str(SAFE_MODEL_PATH),
            "unsafe": str(UNSAFE_MODEL_PATH),
        }
    }

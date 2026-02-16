"""
Vision Safe Ultima Backend
Real-time safety monitoring system with ML-powered detection
"""
import os
import asyncio
import json
import logging
import traceback
from typing import Optional
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import smtplib
from email.message import EmailMessage
import sqlite3

# Configuration and services
import config
from app.services.ml_service import ml_service
from app.models import InferenceResponse, HealthResponse
from webhooks.clerk_webhook import router as webhook_router

# ==================== LOGGING SETUP ====================
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== FASTAPI APP ====================
app = FastAPI(
    title="Vision Safe Ultima API",
    version="2.0",
    description="Real-time AI-powered safety monitoring system"
)

# Register webhooks
app.include_router(webhook_router)

# Register profiles router
from routers import profiles
app.include_router(profiles.router)

# Register history router
from routers import history
app.include_router(history.router)

# Register users router
from routers import users
app.include_router(users.router)

# Register storage router
from api import storage
app.include_router(storage.router)

# Register payments router
from routers import payments
app.include_router(payments.router)

# ==================== MIDDLEWARE ====================
# CORS Configuration - Strict allowlist only
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=config.CORS_ALLOW_CREDENTIALS,
    allow_methods=config.CORS_ALLOW_METHODS,
    allow_headers=config.CORS_ALLOW_HEADERS,
    allow_origin_regex=r"https://.*\.vercel\.app",
)

# ==================== HEALTH CHECK ====================
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="2.0",
        ml_service_ready=ml_service.inference_service is not None,
        device=config.ML_DEVICE
    )

@app.get("/")
async def root():
    """Root endpoint with status"""
    return {
        "message": "Vision Safe Ultima Backend v2.0",
        "status": "running",
        "ml_service_ready": ml_service.inference_service is not None,
    }

@app.get("/config")
async def get_config():
    """Get current configuration (debug endpoint)"""
    if not config.DEBUG_MODE:
        raise HTTPException(status_code=403, detail="Not available in production")
    return config.get_config_summary()

# ==================== STARTUP/SHUTDOWN ====================
@app.on_event("startup")
async def startup_event():
    """Validate configuration and initialize services on startup"""
    logger.info("="*70)
    logger.info("VISION SAFE ULTIMA - BACKEND STARTUP")
    logger.info("="*70)
    
    # Validate configuration
    config_errors = config.validate_config()
    if config_errors:
        for error in config_errors:
            logger.error(f"❌ CONFIG ERROR: {error}")
        logger.warning("Some validations failed - continuing anyway")
    else:
        logger.info("✅ Configuration validation passed")
    
    # Log configuration summary
    logger.info(f"🔧 Device: {config.ML_DEVICE}")
    logger.info(f"🔧 Confidence Threshold: {config.ML_CONF_THRESHOLD}")
    logger.info(f"🔧 Temporal Smoothing: {config.ML_ENABLE_TEMPORAL_SMOOTHING}")
    logger.info(f"🔧 Frame Skip: {config.FRAME_SKIP}")
    
    # Check ML Service
    if ml_service.inference_service is None:
        logger.error("❌ ML SERVICE FAILED TO INITIALIZE!")
        logger.error("Models will NOT work - check error messages above")
    else:
        logger.info(f"✅ ML Service initialized successfully")
        logger.info(f"   Inference service type: {type(ml_service.inference_service).__name__}")
    
    logger.info("="*70)

# ==================== WEBSOCKET ENDPOINT ====================

# Note: frame-skip and resize are handled per-connection inside the websocket handler
def resize_frame_if_needed(frame: np.ndarray) -> np.ndarray:
    """Resize frame if it exceeds max size for performance"""
    h, w = frame.shape[:2]
    if h > config.MAX_FRAME_SIZE or w > config.MAX_FRAME_SIZE:
        scale = config.MAX_FRAME_SIZE / max(h, w)
        new_h, new_w = int(h * scale), int(w * scale)
        frame = cv2.resize(frame, (new_w, new_h))
    return frame

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, profile_id: Optional[str] = Query(None)):
    """WebSocket endpoint for real-time video frame processing"""
    await websocket.accept()
    logger.info(f"✅ Client connected to WebSocket (Profile: {profile_id})")
    
    # Check if ML service is ready
    if ml_service.inference_service is None:
        logger.error("❌ ML service not initialized!")
        try:
            await websocket.send_json({
                "error": "ML service not available",
                "safe": {"detections": []},
                "unsafe": {"detections": []},
                "risk": {"level": "LOW", "score": 0, "factors": []}
            })
            await websocket.close(code=1011, reason="ML service unavailable")
        except Exception as e:
            logger.error(f"Error closing WebSocket: {e}")
        return

    # --- Session Start ---
    from database.client import db
    import uuid
    session_id = str(uuid.uuid4())
    camera_id = "cam_webcam" # Default for now
    user_id = "unknown" # Should ideally be passed/verified, strictly profile_id helps trace
    
    # If profile_id provided, fetch user_id from it? 
    # Or just use profile_id. 
    # We need user_id for FK in sessions table.
    if profile_id:
        try:
            prof = await db.fetch_one("SELECT user_id FROM profiles WHERE profile_id = ?", (profile_id,))
            if prof:
                user_id = prof['user_id']
        except:
            pass
            
    try:
        # Create Camera if not exists (stub)
        await db.execute("INSERT OR IGNORE INTO cameras (camera_id, user_id, camera_name, camera_type) VALUES (?, ?, ?, ?)", 
                         (camera_id, user_id, "Webcam", "webcam"))
                         
        await db.execute(
            "INSERT INTO sessions (session_id, user_id, profile_id, camera_id, started_at, session_type) VALUES (?, ?, ?, ?, datetime('now'), 'live')",
            (session_id, user_id, profile_id, camera_id)
        )
    except Exception as e:
        logger.error(f"Failed to start session: {e}")

    
    frame_count = 0
    frame_error_count = 0
    # Per-connection frame-skip counter to avoid cross-connection interference
    frame_skip_counter = 0

    def should_process_frame_local() -> bool:
        nonlocal frame_skip_counter
        frame_skip_counter += 1
        if frame_skip_counter >= config.FRAME_SKIP:
            frame_skip_counter = 0
            return True
        return False

    try:
        while True:
            try:
                # Receive frame bytes from client with timeout
                data = await asyncio.wait_for(
                    websocket.receive_bytes(),
                    timeout=config.WEBSOCKET_TIMEOUT
                )
                
                # Validate frame data
                if not isinstance(data, bytes) or len(data) == 0:
                    logger.warning(f"Invalid frame data received (size: {len(data) if data else 0})")
                    frame_error_count += 1
                    if frame_error_count > 10:
                        logger.error("Too many frame errors, closing connection")
                        break
                    continue
                
                frame_error_count = 0  # Reset error counter on success
                
                # Log periodically
                if frame_count % 90 == 0 and frame_count > 0:
                    logger.debug(f"📺 Processing frame {frame_count}, size: {len(data)} bytes")
                
                # Skip frames for performance if configured (per-connection)
                if not should_process_frame_local():
                    frame_count += 1
                    continue
                
                # Decode frame
                try:
                    nparr = np.frombuffer(data, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        logger.warning(f"Frame {frame_count}: Failed to decode image data")
                        await websocket.send_json({
                            "error": "Failed to decode frame",
                            "safe": {"detections": []},
                            "unsafe": {"detections": []},
                            "risk": {"level": "LOW", "score": 0, "factors": []}
                        })
                        frame_count += 1
                        continue
                except Exception as decode_err:
                    logger.error(f"Frame {frame_count}: Decode error - {str(decode_err)}")
                    frame_count += 1
                    continue
                
                # Resize if needed
                frame = resize_frame_if_needed(frame)
                
                # Run inference
                try:
                    result = ml_service.process_frame(frame, frame_count)
                    
                    # Validate response
                    if "error" not in result:
                        safe_count = len(result.get("safe", {}).get("detections", []))
                        unsafe_count = len(result.get("unsafe", {}).get("detections", []))
                        
                        # --- SAVE DATA ---
                        # Save if there is any activity (Safe or Unsafe)
                        risk_data = result.get('risk', {})
                        risk_score = risk_data.get('score', 0)
                        risk_level = risk_data.get('level', 'LOW')
                        activity_type = risk_data.get('activity_type', 'Safe Activity')
                        
                        # Save if score > 0 (People or Hazards present)
                        if risk_score > 0:
                            # Map activity_type to category for DB
                            # DB expects 'safe' or 'unsafe'
                            detection_category = 'unsafe' if 'Unsafe' in activity_type else 'safe'
                            
                            # Determine hazard type / primary object
                            hazard_type = None
                            if detection_category == 'unsafe':
                                has_fire = any(d.get('class') == 'fire' for d in result.get("unsafe", {}).get("detections", []))
                                if has_fire:
                                    hazard_type = 'fire'
                                elif unsafe_count > 0:
                                    hazard_type = result.get("unsafe", {}).get("detections", [])[0].get('class')
                            
                            # Insert into DB
                            # Note: We might want to rate-limit this for Safe activities to avoid DB bloat?
                            # For now, saving all processed frames with activity.
                            await db.execute(
                                """
                                INSERT INTO detections (session_id, profile_id, frame_number, detection_category, hazard_type, risk_level, risk_score)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                """,
                                (session_id, profile_id, frame_count, detection_category, hazard_type, risk_level, risk_score)
                            )
                            
                            # Create Alert ONLY if High/Critical Risk
                            if risk_level in ['HIGH', 'CRITICAL'] and detection_category == 'unsafe':
                                alert_title = f"{risk_level} Risk: {hazard_type}" if hazard_type else f"{risk_level} Risk Detected"
                                alert_id = str(uuid.uuid4())
                                
                                # Async Alert Handling (Upload + DB) to avoid blocking stream
                                async def handle_alert_async(
                                    a_id, s_id, p_id, u_id, lvl, title, frame_img
                                ):
                                    snapshot_url = None
                                    try:
                                        # 1. Encode frame to JPEG
                                        success, buffer = cv2.imencode(".jpg", frame_img)
                                        if success:
                                            # 2. Upload to B2
                                            from io import BytesIO
                                            from storage.b2_client import storage as b2_storage
                                            
                                            file_obj = BytesIO(buffer)
                                            filename = f"alert_{a_id}.jpg"
                                            
                                            # Upload (this takes time, hence async)
                                            # Ensure B2 client is initialized
                                            if b2_storage.client:
                                                upload_res = await b2_storage.upload_file(
                                                    file_obj,
                                                    folder="alert-snapshots",
                                                    filename=filename,
                                                    content_type="image/jpeg"
                                                )
                                                snapshot_url = upload_res.get('url')
                                    except Exception as e:
                                        logger.error(f"Failed to upload snapshot for alert {a_id}: {e}")
                                    
                                    # 3. Save Alert to DB
                                    try:
                                        await db.execute(
                                            """
                                            INSERT INTO alerts (alert_id, session_id, profile_id, user_id, alert_type, severity, title, snapshot_url)
                                            VALUES (?, ?, ?, ?, 'SAFETY_VIOLATION', ?, ?, ?)
                                            """,
                                            (a_id, s_id, p_id, u_id, lvl, title, snapshot_url)
                                        )
                                        logger.info(f"🚨 Alert Saved: {title} (Snapshot: {snapshot_url})")
                                    except Exception as e:
                                        logger.error(f"Failed to save alert to DB: {e}")

                                # Fire and forget execution
                                asyncio.create_task(handle_alert_async(
                                    alert_id, session_id, profile_id, user_id, risk_level, alert_title, frame.copy()
                                ))

                        # Log detections periodically
                        if safe_count > 0 or unsafe_count > 0:
                            logger.info(
                                f"Frame {frame_count}: "
                                f"Safe={safe_count}, Unsafe={unsafe_count}, "
                                f"Risk={result.get('risk', {}).get('level', 'UNKNOWN')}, "
                                f"Inference={result.get('inference_time_ms', 0):.1f}ms"
                            )
                    
                    # Send results to client
                    await websocket.send_json(result)
                    
                except asyncio.CancelledError:
                    logger.info("Frame processing cancelled")
                    break
                except Exception as proc_err:
                    logger.error(f"Frame {frame_count}: Processing error - {str(proc_err)}")
                    await websocket.send_json({
                        "error": f"Processing error: {str(proc_err)[:50]}",
                        "safe": {"detections": []},
                        "unsafe": {"detections": []},
                        "risk": {"level": "LOW", "score": 0, "factors": []}
                    })
                
                frame_count += 1
                
            except asyncio.TimeoutError:
                logger.warning("WebSocket receive timeout")
                break
            except WebSocketDisconnect:
                logger.info("✅ Client disconnected gracefully")
                break
            except Exception as frame_err:
                logger.error(f"Frame receive error: {str(frame_err)}")
                break
    
    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}")
        traceback.print_exc()
        try:
            await websocket.close(code=1011)
        except:
            pass
    finally:
        # --- Session End ---
        try:
            await db.execute(
                "UPDATE sessions SET ended_at = datetime('now'), status = 'completed', total_frames_processed = ? WHERE session_id = ?",
                (frame_count, session_id)
            )
        except Exception as e:
            logger.error(f"Failed to close session: {e}")
            
        logger.info(f"📊 WebSocket session ended. Total frames processed: {frame_count}")


# ==================== ALERT / EMAIL ENDPOINT ====================
class EmailAlertPayload(BaseModel):
    subject: str
    body: str
    to: Optional[str] = None


def send_email_smtp(to_email: str, subject: str, body: str) -> bool:
    """Simple SMTP send using config settings. Returns True on success."""
    if not config.SMTP_HOST or not config.SMTP_USER or not config.SMTP_PASS:
        logger.warning("SMTP not configured; skipping email send")
        return False

    try:
        msg = EmailMessage()
        msg["From"] = config.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        if config.SMTP_USE_TLS:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)

        server.login(config.SMTP_USER, config.SMTP_PASS)
        server.send_message(msg)
        server.quit()
        logger.info(f"Sent alert email to: {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")
        return False


# Alerts runtime config and persistence
def init_alerts_db():
    db_path = str(config.ALERTS_DB_PATH)
    # Ensure directory exists
    try:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    except Exception:
        pass
    conn = sqlite3.connect(db_path, timeout=5)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts_config (
            id INTEGER PRIMARY KEY,
            enabled INTEGER NOT NULL DEFAULT 0,
            to_email TEXT,
            last_sent INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    conn.commit()
    # ensure single row exists
    cur.execute("SELECT COUNT(*) FROM alerts_config")
    if cur.fetchone()[0] == 0:
        # Try migrating from legacy JSON file if present
        migrated = False
        try:
            if config.ALERTS_CONFIG_PATH.exists():
                with open(config.ALERTS_CONFIG_PATH, 'r', encoding='utf-8') as fh:
                    data = json.load(fh)
                    enabled = 1 if data.get('enabled') else 0
                    to_email = data.get('to') or data.get('to_email') or config.ALERT_EMAIL_TO or ''
                    last_sent = int(data.get('last_sent', 0) or 0)
                    cur.execute("INSERT INTO alerts_config (enabled, to_email, last_sent) VALUES (?, ?, ?)", (enabled, to_email, last_sent))
                    conn.commit()
                    migrated = True
        except Exception:
            migrated = False

        if not migrated:
            cur.execute("INSERT INTO alerts_config (enabled, to_email, last_sent) VALUES (?, ?, ?)", (0, config.ALERT_EMAIL_TO or "", 0))
            conn.commit()
    conn.close()


def load_alerts_config():
    init_alerts_db()
    db_path = str(config.ALERTS_DB_PATH)
    try:
        conn = sqlite3.connect(db_path, timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT enabled, to_email, last_sent FROM alerts_config LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            return {"enabled": bool(row[0]), "to": row[1] or "", "last_sent": int(row[2] or 0)}
    except Exception as e:
        logger.warning(f"Could not load alerts config from DB: {e}")
    return {"enabled": False, "to": config.ALERT_EMAIL_TO or "", "last_sent": 0}


def save_alerts_config(cfg: dict):
    init_alerts_db()
    db_path = str(config.ALERTS_DB_PATH)
    try:
        conn = sqlite3.connect(db_path, timeout=5)
        cur = conn.cursor()
        # Update single row
        cur.execute("UPDATE alerts_config SET enabled = ?, to_email = ?, last_sent = ? WHERE id = (SELECT id FROM alerts_config LIMIT 1)", (
            1 if cfg.get("enabled") else 0,
            cfg.get("to", "") or "",
            int(cfg.get("last_sent", 0))
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not save alerts config to DB: {e}")


# Initialize alerts config
ALERTS_CFG = load_alerts_config()


def send_alert_email(payload_to: str, subject: str, body: str) -> bool:
    """Sends alert email respecting rate limit and enabled flag. Returns True if sent."""
    if not ALERTS_CFG.get("enabled", False):
        logger.info("Alerts disabled; skipping email send")
        return False

    to_addr = payload_to or ALERTS_CFG.get("to") or config.ALERT_EMAIL_TO
    if not to_addr:
        logger.warning("No recipient configured for alert email; skipping")
        return False

    now = int(asyncio.get_event_loop().time())
    last = int(ALERTS_CFG.get("last_sent", 0))
    if now - last < config.EMAIL_RATE_LIMIT_SECONDS:
        logger.info(f"Email rate limited: {now - last}s since last send (<{config.EMAIL_RATE_LIMIT_SECONDS})")
        return False

    ok = send_email_smtp(to_addr, subject, body)
    if ok:
        ALERTS_CFG["last_sent"] = now
        save_alerts_config(ALERTS_CFG)
    return ok


@app.post("/notify/email")
async def notify_email(payload: EmailAlertPayload):
    """Send an alert email. If `to` is not provided, uses `ALERT_EMAIL_TO` from config."""
    # Use alerts-config aware sender
    to_addr = payload.to or ALERTS_CFG.get("to") or config.ALERT_EMAIL_TO
    if not to_addr:
        raise HTTPException(status_code=400, detail="No recipient configured for alert email")

    sent = send_alert_email(to_addr, payload.subject, payload.body)
    if not sent:
        return JSONResponse(status_code=429, content={"status": "rate_limited_or_disabled"})
    return {"status": "sent"}


@app.get("/alerts/config")
async def get_alerts_config():
    return {"enabled": bool(ALERTS_CFG.get("enabled", False)), "to": ALERTS_CFG.get("to", "")}


class AlertsConfigPayload(BaseModel):
    enabled: bool
    to: Optional[str] = None


@app.post("/alerts/config")
async def update_alerts_config(payload: AlertsConfigPayload):
    # basic validation for email-like string
    if payload.to and ("@" not in payload.to or "." not in payload.to):
        raise HTTPException(status_code=400, detail="Invalid email address")

    ALERTS_CFG["enabled"] = bool(payload.enabled)
    if payload.to is not None:
        ALERTS_CFG["to"] = payload.to
    save_alerts_config(ALERTS_CFG)
    return {"status": "ok", "config": {"enabled": ALERTS_CFG["enabled"], "to": ALERTS_CFG.get("to", "")}}

# ==================== STARTUP ====================
if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting Vision Safe Ultima Backend...")
    logger.info(f"🌐 Server: {config.API_HOST}:{config.API_PORT}")
    logger.info(f"📍 Frontend URL: {config.FRONTEND_URL}")
    
    uvicorn.run(
        app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level=config.LOG_LEVEL.lower()
    )

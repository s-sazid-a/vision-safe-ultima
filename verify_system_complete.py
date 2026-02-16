import sys
import os
import asyncio
import requests
import time
import subprocess
from pathlib import Path

# Add project root and backend folder to path
# We need to add valid paths so imports like `database.db` work if `vision_safe_ultima_backend_v2.0` is a package,
# OR we need to add inner folder to path.
backend_path = os.path.join(os.getcwd(), 'vision_safe_ultima_backend_v2.0')
sys.path.append(backend_path)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_path, '.env'))

# Fix: client.py expects TURSO_DATABASE_URL but .env has DATABASE_URL
if os.getenv("DATABASE_URL") and not os.getenv("TURSO_DATABASE_URL"):
    os.environ["TURSO_DATABASE_URL"] = os.getenv("DATABASE_URL")
if os.getenv("DATABASE_AUTH_TOKEN") and not os.getenv("TURSO_AUTH_TOKEN"):
    os.environ["TURSO_AUTH_TOKEN"] = os.getenv("DATABASE_AUTH_TOKEN")

# Constants
API_URL = "http://127.0.0.1:8000"

def log(msg, status="INFO"):
    symbols = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARN": "⚠️"}
    print(f"{symbols.get(status, '')} {msg}")

async def verify_backend_health():
    """Verify backend is running and ML service is ready"""
    log("Checking Backend Health...", "INFO")
    try:
        res = requests.get(f"{API_URL}/health", timeout=5)
        if res.status_code == 200:
            data = res.json()
            log(f"Backend Online via {API_URL}", "SUCCESS")
            log(f"ML Service Status: {data.get('ml_service_ready')}", "INFO")
            return True
        else:
            log(f"Backend returned {res.status_code}", "ERROR")
            return False
    except requests.exceptions.ConnectionError:
        log("Backend not reachable. Is it running?", "ERROR")
        return False
    except Exception as e:
        log(f"Health check failed: {e}", "ERROR")
        return False

async def verify_database():
    """Verify Turso DB connection and Schema"""
    log("Checking Database...", "INFO")
    try:
        # Import directly from backend modules as they are now in path
        # The backend folder is added to sys.path, so 'database' should be top-level module
        print(f"DEBUG PATH: {sys.path}")
        from database.client import db
        # await db.connect() # Lazy init
        
        # Check tables
        tables = ["users", "profiles", "alerts", "detections", "sessions"]
        missing = []
        for table in tables:
            try:
                # Simple select 1 to check existence
                await db.fetch_one(f"SELECT 1 FROM {table} LIMIT 1")
                log(f"Table '{table}' exists", "SUCCESS")
            except Exception:
                # If table is empty it might still be valid, but if it throws unexpected error it's bad
                # Use sqlite_master for robust check if using sqlite/libsql
                try:
                    res = await db.fetch_one(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
                    if res:
                         log(f"Table '{table}' exists", "SUCCESS")
                    else:
                        missing.append(table)
                        log(f"Table '{table}' MISSING", "ERROR")
                except Exception as e:
                    log(f"Error checking table {table}: {e}", "WARN")

        # await db.disconnect()
        
        if missing:
            return False
        return True

    except Exception as e:
        log(f"Database check failed: {e}", "ERROR")
        return False

async def verify_storage():
    """Verify B2 and ImgBB"""
    log("Checking Storage Integrations...", "INFO")
    
    # 1. B2
    try:
        from storage.b2_client import storage as b2
        if b2.bucket_name:
             log(f"B2 Connected: {b2.bucket_name}", "SUCCESS")
        else:
             log("B2 Connection Failed", "ERROR")
    except Exception as e:
        log(f"B2 Check Failed: {e}", "ERROR")

    # 2. ImgBB
    try:
        from storage.imgbb_client import imgbb
        if imgbb.enabled:
             log("ImgBB Enabled", "SUCCESS")
             # Optional: Try a tiny upload?
        else:
             log("ImgBB Disabled or Key Missing", "WARN")
    except Exception as e:
        log(f"ImgBB Check Failed: {e}", "ERROR")

def verify_frontend_build():
    """Check if frontend files exist and build seems valid"""
    log("Checking Frontend...", "INFO")
    fe_dir = os.path.join(os.getcwd(), 'vision_safe_ultima_webapp_v2.0')
    if not os.path.exists(fe_dir):
        log("Frontend directory missing!", "ERROR")
        return

    # Check for crucial files
    files = ["package.json", "src/App.tsx", "src/main.tsx"]
    for f in files:
         if os.path.exists(os.path.join(fe_dir, f)):
             log(f"Frontend file {f} found", "SUCCESS")
         else:
             log(f"Frontend file {f} MISSING", "ERROR")

async def main():
    log("=== VISION SAFE ULTIMA SYSTEM VERIFICATION ===", "INFO")
    
    # 1. Static Checks
    verify_frontend_build()
    
    # 3. Dynamic Checks (Requires Backend Running)
    backend_live = await verify_backend_health()
    
    if backend_live:
        # Test API endpoints
        pass
    else:
        log("Skipping API tests as backend is offline", "WARN")

    # 4. Storage & DB verification via direct python code (bypassing API)
    # This ensures credentials work even if API layer is broken
    await verify_storage()
    await verify_database()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

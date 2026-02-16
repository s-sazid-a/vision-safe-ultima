"""
Phase 2 Deep Verification Script
ACTUALLY connects to services to verify they are working, not just checking env vars.
"""

import os
import sys
import asyncio
import logging
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Load Env
backend_path = Path("vision_safe_ultima_backend_v2.0")
load_dotenv(backend_path / ".env")

def print_header(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def verify_git():
    print_header("TEST 1: Git & GitHub Connection")
    try:
        # Check remote URL
        remote = subprocess.check_output(["git", "remote", "get-url", "origin"], stderr=subprocess.STDOUT).decode().strip()
        print(f"✅ Remote URL found: {remote}")
        
        # Check if we can reach it (ls-remote)
        print("⏳ Testing connection to GitHub... (this might take a second)")
        subprocess.check_output(["git", "ls-remote", "origin"], stderr=subprocess.STDOUT)
        print("✅ Connection to GitHub confirmed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Git verification failed: {e.output.decode() if e.output else str(e)}")
        return False
    except Exception as e:
        print(f"❌ Git check error: {e}")
        return False

async def verify_turso():
    print_header("TEST 2: Turso Database Connection")
    
    # We need to import the client we created
    sys.path.append(str(backend_path.absolute()))
    try:
        # Use raw client for verification to avoid app-layer complexity in script
        import libsql_client
        
        url = os.getenv("TURSO_DATABASE_URL")
        token = os.getenv("TURSO_AUTH_TOKEN")
        
        if not url:
            print("❌ TURSO_DATABASE_URL missing")
            return False

        # Ensure correct protocol for python client (http:// usually works best for rapid verification)
        if url.startswith("libsql://"):
            url = url.replace("libsql://", "https://")
        elif url.startswith("wss://"):
             url = url.replace("wss://", "https://")

        print(f"⏳ Connecting to {url}...")
        
        async with libsql_client.create_client(url, auth_token=token) as client:
            result = await client.execute("SELECT 1")
            if result:
                 print("✅ Connection successful!")
                 
                 # Check tables
                 tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
                 table_names = [r[0] for r in tables.rows]
                 print(f"✅ Found {len(table_names)} tables: {', '.join(table_names)}")
                 
                 if "users" in table_names:
                     return True
                 else:
                     print("⚠️  Users table missing. Run init_db.py again.")
                     return False
            return False

    except ImportError:
        print("❌ Could not import libsql_client.")
        return False
    except Exception as e:
        print(f"❌ Turso Connection Failed: {e}")
        return False

def verify_clerk_config():
    print_header("TEST 3: Clerk Configuration (Static Check)")
    
    # Backend
    secret = os.getenv("CLERK_SECRET_KEY")
    if secret and secret.startswith("sk_"):
        print("✅ Backend Secret Key is set and looks valid.")
    else:
        print("❌ Backend CLERK_SECRET_KEY is missing or invalid.")
        return False

    # Frontend
    frontend_env = Path("vision_safe_ultima_webapp_v2.0/.env")
    if frontend_env.exists():
        with open(frontend_env, 'r') as f:
            content = f.read()
            if "VITE_CLERK_PUBLISHABLE_KEY=pk_" in content:
                print("✅ Frontend Publishable Key found in .env.")
            else:
                 print("❌ Frontend VITE_CLERK_PUBLISHABLE_KEY missing or invalid.")
                 return False
    else:
        print("❌ Frontend .env file not found.")
        return False
        
    print("ℹ️  Info: Full Clerk login testing requires opening the webapp in a browser.")
    return True

async def main():
    print("\n🕵️ STARTING DEEP VERIFICATION...\n")
    
    git_ok = verify_git()
    turso_ok = await verify_turso()
    clerk_ok = verify_clerk_config()
    
    print_header("FINAL REPORT")
    if git_ok and turso_ok and clerk_ok:
        print("🚀 ALL SYSTEMS GO! Phase 2 is Verified.")
        print("   Ready for Integration 4 (File Storage).")
        sys.exit(0)
    else:
        print("🛑 Verification FAILED. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

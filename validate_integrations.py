"""
Integration Checker (Friendly Version)
Run this script to see if you are ready for the next steps!
"""

import os
import sys
import logging
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Setup simple logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Paths
backend_env_path = Path("vision_safe_ultima_backend_v2.0/.env")
frontend_env_path = Path("vision_safe_ultima_webapp_v2.0/.env")

# Load env vars
load_dotenv(backend_env_path)
load_dotenv(frontend_env_path)

def print_header(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def check_git():
    print_header("STEP 1: Checking Git & GitHub")
    try:
        # Check if git is initialized
        subprocess.check_output(["git", "status"], stderr=subprocess.STDOUT)
        print("✅ Git is active on your computer.")
        
        # Check remote
        remotes = subprocess.check_output(["git", "remote", "-v"], stderr=subprocess.STDOUT).decode()
        if "origin" in remotes and "github.com" in remotes:
            print(f"✅ GitHub repository is connected: {remotes.split()[1]}")
            return True
        else:
            print("❌ GitHub repository NOT connected.")
            print("   👉 Action: Run the 'git remote add' command from Step 1.")
            return False
    except FileNotFoundError:
        print("❌ Git is not installed or not in PATH.")
        return False
    except subprocess.CalledProcessError:
        print("❌ Git repository not initialized (Run 'git init' if needed, but I did that for you).")
        return False

def check_env_var(name: str, location_name: str, is_backend: bool = True):
    # Determine which file to check manually for accuracy
    env_path = backend_env_path if is_backend else frontend_env_path
    
    if not env_path.exists():
        print(f"❌ File missing: {env_path}")
        return False

    with open(env_path, 'r') as f:
        content = f.read()
    
    # Check if variable exists and has a value
    found = False
    for line in content.splitlines():
        if line.strip().startswith(f"{name}="):
            value = line.split("=", 1)[1].strip()
            if value and "your-" not in value and "pk_test_..." not in value and "sk_test_..." not in value:
                print(f"✅ Found {name} in {location_name}")
                return True
            else:
                print(f"⚠️  {name} is present but looks empty or is a placeholder.")
                print(f"   👉 Value found: {value}")
                return False
    
    print(f"❌ Missing {name} in {location_name}")
    return False

def main():
    print("\n👋 Hello! Let's check if everything is ready for the cloud.\n")
    
    all_good = True
    
    # Check Git
    if not check_git():
        all_good = False

    # Check Turso
    print_header("STEP 2: Checking Database (Turso)")
    if check_env_var("TURSO_DATABASE_URL", "Backend .env"):
        pass
    else:
        all_good = False
        
    if check_env_var("TURSO_AUTH_TOKEN", "Backend .env"):
        pass
    else:
        all_good = False

    # Check Clerk
    print_header("STEP 3: Checking Authentication (Clerk)")
    if check_env_var("VITE_CLERK_PUBLISHABLE_KEY", "Frontend .env", is_backend=False):
        pass
    else:
        all_good = False
        
    if check_env_var("CLERK_SECRET_KEY", "Backend .env"):
        pass
    else:
        all_good = False

    # Summary
    print_header("SUMMARY")
    if all_good:
        print("🎉 AWESOME! Everything looks perfect.")
        print("   You are ready to proceed to the next step.")
        sys.exit(0)
    else:
        print("🛑 Oops! Some steps are incomplete.")
        print("   Please scroll up to see what is missing (marked with ❌ or ⚠️).")
        print("   Check 'MANUAL_ACTIONS_NEEDED.md' for help.")
        sys.exit(1)

if __name__ == "__main__":
    main()

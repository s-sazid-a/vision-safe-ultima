
import asyncio
from database.client import db
import sys
import os

# Ensure we can import from current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import config to load .env variables
import config
from database.client import db

async def main():
    print("--- Checking Database Schema (Env Vars) ---")
    print(f"DEBUG: Config DB URL: {config.os.getenv('TURSO_DATABASE_URL')}")
    token = config.os.getenv('TURSO_AUTH_TOKEN', '')
    print(f"DEBUG: Config Auth Token: {token[:10]}...{token[-5:] if len(token)>5 else ''}")
    
    try:
        # Force re-initialize to pick up new env vars if needed
        # (Though process restart is better, db client is lazy loaded so it should be fine)
        if db.client:
            await db.client.close()
        db.client = None
        
        # List tables
        res = await db.fetch_all("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r['name'] for r in res]
        print(f"Tables found: {tables}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

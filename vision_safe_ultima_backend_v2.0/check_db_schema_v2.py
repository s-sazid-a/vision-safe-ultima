
import asyncio
from typing import List, Dict, Any, Optional
from database.client import TursoClient
import os
from dotenv import load_dotenv

# Force load .env
load_dotenv()

# Override client locally to test specific connection
# We need to replicate the exact environment
CANDIDATE_URL = "libsql://vision-safe-ultima-db-s-sazid-a.aws-ap-south-1.turso.io"
AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDI3MzE3MTAsImlhdCI6MTc3MTE5NTcxMCwiaWQiOiIzZDMxZjAxOS1kNWQ0LTRhYjAtYTZhMC1mOGRlM2Q2MmE1MGYiLCJyaWQiOiI3ZTlmNTM1ZC1jNTUwLTRhMWYtODMxNy0yNTZhMDVlOWJmMDQifQ.A5biUdfDl0l6qyRiPHzSYOAeg35MWvLMT_RaF0-evpGbWyz-6EH6QK5DyQnlIV2Tag1AlPJPkM0YmoiDsMJwDA"

# Manually instantiating client to avoid import side-effects / env var reliance
class TestClient(TursoClient):
    def _initialize(self):
        # Override with HARDCODED values from User
        self.client = None
        try:
            from libsql_client import create_client
            url = CANDIDATE_URL.replace("libsql://", "https://")
            self.client = create_client(url=url, auth_token=AUTH_TOKEN)
            print(f"✅ Connected to {url}")
        except Exception as e:
            print(f"❌ Failed connection: {e}")

db = TestClient()

async def list_tables():
    print("\n--- Checking Database Schema ---")
    try:
        # SQLite command to list tables
        res = await db.fetch_all("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r['name'] for r in res]
        
        if not tables:
            print("❌ DATABASE IS EMPTY! No tables found.")
            return

        print(f"Found {len(tables)} tables: {', '.join(tables)}")

        # Check for Critical Tables
        required = ['users', 'promo_codes', 'payments', 'subscriptions', 'profiles']
        missing = [t for t in required if t not in tables]
        
        if missing:
             print(f"❌ CRITICAL MISSING TABLES: {missing}")
        else:
             print("✅ All critical tables present.")
             
        # Check 'users' columns
        if 'users' in tables:
            cols = await db.fetch_all("PRAGMA table_info(users)")
            col_names = [c['name'] for c in cols]
            print(f"Users Table Columns: {col_names}")

    except Exception as e:
        print(f"❌ Query Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_tables())

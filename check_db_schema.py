
import asyncio
from database.client import db
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("Checking Database Schema...")
    try:
        # List tables
        tables = await db.fetch_all("SELECT name FROM sqlite_master WHERE type='table'")
        print(f"Found {len(tables)} tables:")
        for t in tables:
            print(f" - {t['name']}")
            
        # Check specific columns for users
        if any(t['name'] == 'users' for t in tables):
            cols = await db.fetch_all("PRAGMA table_info(users)")
            print("\nColumns in 'users':")
            for c in cols:
                print(f" - {c['name']} ({c['type']})")
        else:
            print("\n❌ 'users' table MISSING!")

        # Check promo_codes
        if any(t['name'] == 'promo_codes' for t in tables):
             print("\n✅ 'promo_codes' table exists.")
        else:
             print("\n❌ 'promo_codes' table MISSING!")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

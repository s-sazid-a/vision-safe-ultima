
import asyncio
import aiohttp
import jwt
import logging
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from database.client import db

# Configuration
API_URL = "http://127.0.0.1:8000"
USER_ID = f"user_test_{uuid.uuid4().hex[:8]}"

# Generate Dummy Token
token = jwt.encode({"sub": USER_ID, "name": "Test User"}, "secret", algorithm="HS256")
headers = {"Authorization": f"Bearer {token}"}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verifier")

async def verify():
    # 0. Insert User into DB
    try:
        logger.info(f"🔑 Pre-seeding User ID: {USER_ID}")
        # Check connection
        # We need to make sure we don't conflict with running server lock if SQLite?
        # Turso handles concurrency via HTTP, so it should be fine.
        await db.execute(
            "INSERT INTO users (id, email, full_name) VALUES (?, ?, ?)",
            (USER_ID, f"{USER_ID}@example.com", "Test User")
        )
        logger.info("✅ User inserted.")
    except Exception as e:
        logger.error(f"❌ Failed to insert user: {e}")
        # proceed anyway, maybe it exists?
        
    async with aiohttp.ClientSession() as session:
        # 1. Get Profiles (Should Create Main)
        try:
             async with session.get(f"{API_URL}/profiles/", headers=headers) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    logger.error(f"❌ GET /profiles failed: {resp.status} {text}")
                    return
                
                data = await resp.json()
                logger.info(f"GET /profiles: {resp.status} - {len(data)} profiles")
                if len(data) >= 1:
                    main = next((p for p in data if p['is_main']), None)
                    if main:
                        logger.info("✅ Main profile auto-created.")
                    else:
                        logger.error("❌ Main profile missing.")
                else:
                     logger.error(f"❌ Unexpected profile count: {len(data)}")

        except Exception as e:
             logger.error(f"Connection error: {e}")
             return

        # 2. Create Profiles
        created_ids = []
        for i in range(3):
            async with session.post(f"{API_URL}/profiles/", headers=headers, json={"name": f"Profile {i+1}"}) as resp:
                if resp.status == 200:
                    p = await resp.json()
                    logger.info(f"✅ Created Profile {i+1}: {p['name']}")
                    created_ids.append(p['profile_id'])
                else:
                    logger.error(f"❌ Failed to create Profile {i+1}: {resp.status} {await resp.text()}")

        # 3. Create 4th (Should Fail)
        async with session.post(f"{API_URL}/profiles/", headers=headers, json={"name": "Overflow Profile"}) as resp:
            if resp.status == 400:
                logger.info("✅ Verified Max Profile Limit (4).")
            else:
                logger.error(f"❌ Failed limit check: {resp.status}")

        # 4. Cleanup
        logger.info("🧹 Cleaning up...")
        await db.execute("DELETE FROM users WHERE id = ?", (USER_ID,))
        logger.info("✅ Cleanup done.")

if __name__ == "__main__":
    asyncio.run(verify())


import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

from database.client import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_migration():
    logger.info("🚀 Starting Database Migration: Add Profiles & Isolation")
    
    # SQL to create profiles table
    create_profiles_sql = """
    CREATE TABLE IF NOT EXISTS profiles (
        profile_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        is_main INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """
    
    # SQL to add columns (SQLite doesn't support IF NOT EXISTS for columns, need try/except)
    add_columns = [
        "ALTER TABLE sessions ADD COLUMN profile_id TEXT REFERENCES profiles(profile_id) ON DELETE SET NULL;",
        "ALTER TABLE detections ADD COLUMN profile_id TEXT REFERENCES profiles(profile_id) ON DELETE SET NULL;",
        "ALTER TABLE alerts ADD COLUMN profile_id TEXT REFERENCES profiles(profile_id) ON DELETE SET NULL;"
    ]

    create_index = [
        "CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_sessions_profile_id ON sessions(profile_id);",
        "CREATE INDEX IF NOT EXISTS idx_detections_profile_id ON detections(profile_id);",
        "CREATE INDEX IF NOT EXISTS idx_alerts_profile_id ON alerts(profile_id);"
    ]

    try:
        # 1. Create Profiles Table
        await db.execute(create_profiles_sql)
        logger.info("✅ Verified 'profiles' table.")

        # 2. Add Columns (Ignore if they exist)
        for sql in add_columns:
            try:
                await db.execute(sql)
                logger.info(f"✅ Executed: {sql[:30]}...")
            except Exception as e:
                if "duplicate column name" in str(e):
                    logger.info(f"ℹ️ Column already exists: {sql[:30]}...")
                else:
                    logger.warning(f"⚠️ Failed to add column: {e}")

        # 3. Create Indexes
        for sql in create_index:
             await db.execute(sql)
             logger.info(f"✅ Executed Index: {sql[:30]}...")

        logger.info("🎉 Migration Complete! Database is ready for Multi-Profile.")

    except Exception as e:
        logger.error(f"❌ Migration Failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())

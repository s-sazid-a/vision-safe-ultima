import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env vars from parent directory
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

from database.client import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_database():
    """Run schema.sql to initialize database"""
    
    # Check if DB URL is set
    if not os.getenv("TURSO_DATABASE_URL"):
        logger.error("TURSO_DATABASE_URL environment variable not set.")
        logger.error("Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env file.")
        return

    # Read schema file
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
         logger.error(f"Schema file not found at {schema_path}")
         return

    with open(schema_path) as f:
        schema_sql = f.read()
    
    # Split into individual statements
    statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
    
    logger.info(f"Executing {len(statements)} SQL statements...")
    
    for i, statement in enumerate(statements, 1):
        try:
            await db.execute(statement)
            logger.info(f"✅ Statement {i}/{len(statements)} executed")
        except Exception as e:
            logger.error(f"❌ Statement {i} failed: {e}")
            logger.error(f"Statement: {statement[:100]}...")
            raise
    
    logger.info("🎉 Database initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_database())

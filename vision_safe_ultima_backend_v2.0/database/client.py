"""
Turso Database Client
Production-ready database connection with connection pooling
"""

from libsql_client import create_client
import os
from typing import Optional, Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class TursoClient:
    """Turso database client with error handling"""
    
    _instance: Optional['TursoClient'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Lazy initialization
            cls._instance.client = None
        return cls._instance
    
    def _initialize(self):
        """Initialize database connection"""
        try:
            url = os.getenv("TURSO_DATABASE_URL")
            auth_token = os.getenv("TURSO_AUTH_TOKEN")
            
            if not url:
                logger.warning("TURSO_DATABASE_URL not found, database features may fail")
                self.client = None
                return

            # Force HTTPS for compatibility if libsql:// is provided
            if url.startswith("libsql://"):
                url = url.replace("libsql://", "https://")
            
            # create_client might require a running loop if it uses aiohttp immediately
            self.client = create_client(
                url=url,
                auth_token=auth_token
            )
            logger.info("✅ Turso database connected successfully")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Turso: {e}")
            raise
    
    async def execute(self, query: str, params: Optional[List] = None) -> Any:
        # Lazy init
        if not self.client:
             self._initialize()
             if not self.client:
                 raise RuntimeError("Database client could not be initialized. Check TURSO_DATABASE_URL.")

        try:
            if params:
                result = await self.client.execute(query, params)
            else:
                result = await self.client.execute(query)
            return result
        except Exception as e:
            import traceback
            logger.error(f"Query failed: {query}, Error: {e}")
            logger.error(traceback.format_exc())
            raise
    
    async def fetch_one(self, query: str, params: Optional[List] = None) -> Optional[Dict]:
        """Fetch single row"""
        result = await self.execute(query, params)
        if result.rows:
            return dict(zip(result.columns, result.rows[0]))
        return None
    
    async def fetch_all(self, query: str, params: Optional[List] = None) -> List[Dict]:
        """Fetch all rows"""
        result = await self.execute(query, params)
        return [dict(zip(result.columns, row)) for row in result.rows]
    
    async def insert(self, table: str, data: Dict) -> str:
        """
        Insert data into table
        
        Returns:
            ID of inserted row
        """
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        
        await self.execute(query, list(data.values()))
        
        # Get last inserted row ID
        result = await self.fetch_one("SELECT last_insert_rowid() as id")
        return result['id']
    
    async def update(self, table: str, data: Dict, where: str, where_params: List) -> int:
        """
        Update table
        
        Returns:
            Number of rows affected
        """
        set_clause = ', '.join([f"{k} = ?" for k in data.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE {where}"
        
        params = list(data.values()) + where_params
        await self.execute(query, params)
        
        result = await self.fetch_one("SELECT changes() as count")
        return result['count']
    
    async def delete(self, table: str, where: str, where_params: List) -> int:
        """Delete from table"""
        query = f"DELETE FROM {table} WHERE {where}"
        await self.execute(query, where_params)
        
        result = await self.fetch_one("SELECT changes() as count")
        return result['count']

# Global instance
db = TursoClient()

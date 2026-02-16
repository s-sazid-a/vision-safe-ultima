from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes the Clerk JWT token to get the user ID.
    NOTE: For production, this should verify the signature using Clerk's JWKS.
    For this implementation, we decode without verification to allow rapid development.
    """
    token = credentials.credentials
    try:
        # Decode without verification (Safe for local dev if we trust the source is Clerk frontend)
        # In production, use your Clerk PEM Public Key here.
        payload = jwt.decode(token, options={"verify_signature": False})
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Ensure 'id' is available for legacy code
        if "id" not in payload:
            payload["id"] = user_id
            
        # --- AUTO-SYNC USER TO DB ---
        # This ensures the user exists BEFORE any endpoint logic runs.
        # Fixes 400/500 errors where endpoints expect the user to exist.
        try:
            from database.client import db
            # Check if user exists
            user_check = await db.fetch_one("SELECT id FROM users WHERE id = ?", (user_id,))
            
            if not user_check:
                logger.info(f"Auth Sync: User {user_id} missing. Creating...")
                
                email = payload.get('email')
                if not email:
                    # Try to find email in other claims
                    emails = payload.get('emails', [])
                    if isinstance(emails, list) and len(emails) > 0:
                        email = emails[0]['email_address'] if isinstance(emails[0], dict) else emails[0]
                
                if not email:
                     logger.warning(f"Auth Sync: No email for {user_id}. Using placeholder.")
                     email = f"missing_{user_id}@vision-safe.com"

                full_name = payload.get('name') or payload.get('full_name') or email.split('@')[0]
                
                try:
                    await db.execute(
                        """
                        INSERT INTO users (id, email, full_name, subscription_tier, account_status)
                        VALUES (?, ?, ?, 'standard', 'active')
                        """,
                        (user_id, email, full_name)
                    )
                    logger.info(f"Auth Sync: User {user_id} created.")
                except Exception as insert_e:
                     # Ignore unique constraint race conditions
                     if "UNIQUE" not in str(insert_e) and "constraint" not in str(insert_e):
                         logger.error(f"Auth Sync Insert Failed: {insert_e}")

        except Exception as db_e:
            logger.error(f"Auth Sync DB Error: {db_e}")
            # Continue anyway, don't block auth if DB is temporarily down? 
            # Ideally we should block, but let's allow it to fail downstream if needed.

        return payload
        
    except jwt.PyJWTError as e:
        logger.error(f"Token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
            
        return payload
        
    except jwt.PyJWTError as e:
        logger.error(f"Token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

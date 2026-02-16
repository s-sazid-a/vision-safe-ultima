from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
import logging
from database.client import db
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

# --- Models ---
class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    account_status: str

# --- Endpoints ---

@router.get("/me", response_model=UserResponse)
async def get_current_user_details(current_user: dict = Depends(get_current_user)):
    """
    Get current logged-in user details.
    Auto-creates user from token if missing (Sync).
    """
    try:
        user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (current_user['id'],))
        
        if not user:
            logger.info(f"User {current_user['id']} missing in DB. Auto-syncing from token.")
            # Auto-create user
            email = current_user.get('email')
            if not email:
                # Try to find email in other claims if standard 'email' is missing
                # Some providers use 'emails' list
                emails = current_user.get('emails', [])
                if isinstance(emails, list) and len(emails) > 0:
                    email = emails[0]['email_address'] if isinstance(emails[0], dict) else emails[0]
            
            if not email:
                 # Fallback for users without email (e.g. phone auth)
                 logger.warning(f"No email found for user {current_user['id']}. Using placeholder.")
                 email = f"missing_{current_user['id']}@vision-safe.com"

            full_name = current_user.get('name') or current_user.get('full_name') or email.split('@')[0]
            
            await db.execute(
                """
                INSERT INTO users (id, email, full_name, subscription_tier, account_status)
                VALUES (?, ?, ?, 'standard', 'active')
                """,
                (current_user['id'], email, full_name)
            )
            # Fetch again
            user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (current_user['id'],))
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            account_status=user['account_status']
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching user details: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

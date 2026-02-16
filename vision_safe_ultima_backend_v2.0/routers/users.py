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
    subscription_tier: str
    account_status: str

class SubscriptionUpdate(BaseModel):
    tier: str

# --- Endpoints ---

@router.get("/me", response_model=UserResponse)
async def get_current_user_details(current_user: dict = Depends(get_current_user)):
    """
    Get current logged-in user details including subscription tier.
    Auto-creates user from token if missing (Sync).
    """
    try:
        user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (current_user['sub'],))
        
        if not user:
            logger.info(f"User {current_user['sub']} missing in DB. Auto-syncing from token.")
            # Auto-create user
            email = current_user.get('email')
            if not email:
                # Try to find email in other claims if standard 'email' is missing
                # Some providers use 'emails' list
                emails = current_user.get('emails', [])
                if isinstance(emails, list) and len(emails) > 0:
                    email = emails[0]['email_address'] if isinstance(emails[0], dict) else emails[0]
            
            if not email:
                 logger.error("Cannot auto-sync user: No email in token")
                 raise HTTPException(status_code=400, detail="User not found and email missing in token")

            full_name = current_user.get('name') or current_user.get('full_name') or email.split('@')[0]
            
            await db.execute(
                """
                INSERT INTO users (id, email, full_name, subscription_tier, account_status)
                VALUES (?, ?, ?, 'trial', 'active')
                """,
                (current_user['sub'], email, full_name)
            )
            # Fetch again
            user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (current_user['sub'],))
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            subscription_tier=user['subscription_tier'],
            account_status=user['account_status']
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching user details: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.patch("/me/subscription")
async def update_subscription_tier(
    update: SubscriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update subscription tier (Simulated Payment).
    """
    if update.tier not in ['trial', 'starter', 'professional', 'enterprise']:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
    try:
        # Ensure user exists first (Auto-sync if needed)
        # We call the same logic as get_current_user_details implicitly or explicitly
        # But simpler to just try UPDATE, if 0 rows, Insert.
        
        # Check if user exists
        user_check = await db.fetch_one("SELECT id FROM users WHERE id = ?", (current_user['sub'],))
        if not user_check:
            # COPY PASTE AUTO-SYNC LOGIC (Refactor would be better but keeping it robust here)
            email = current_user.get('email')
            if not email:
                emails = current_user.get('emails', [])
                if isinstance(emails, list) and len(emails) > 0:
                    email = emails[0]['email_address'] if isinstance(emails[0], dict) else emails[0]
            
            if email:
                full_name = current_user.get('name') or current_user.get('full_name') or email.split('@')[0]
                await db.execute(
                    """
                    INSERT INTO users (id, email, full_name, subscription_tier, account_status)
                    VALUES (?, ?, ?, ?, 'active')
                    """,
                    (current_user['sub'], email, full_name, 'trial') # Create as trial first
                )

        await db.execute(
            "UPDATE users SET subscription_tier = ? WHERE id = ?",
            (update.tier, current_user['sub'])
        )
        return {"message": f"Subscription updated to {update.tier}"}
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

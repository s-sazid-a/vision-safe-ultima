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
    """
    try:
        user = await db.fetch_one("SELECT * FROM users WHERE id = ?", (current_user['id'],))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            subscription_tier='enterprise', # FORCE UNLOCK: All users are Enterprise
            account_status=user['account_status']
        )
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
        await db.execute(
            "UPDATE users SET subscription_tier = ? WHERE id = ?",
            (update.tier, current_user['id'])
        )
        return {"message": f"Subscription updated to {update.tier}"}
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

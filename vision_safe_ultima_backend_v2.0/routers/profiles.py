from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
import uuid
import logging
from database.client import db
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])

# --- Models ---
class ProfileCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None

class ProfileResponse(BaseModel):
    profile_id: str
    user_id: str
    name: str
    avatar_url: Optional[str] = None
    is_main: bool
    created_at: str

# --- Endpoints ---

@router.get("/", response_model=List[ProfileResponse])
async def get_profiles(current_user: dict = Depends(get_current_user)):
    """
    Get all profiles associated with the current user's account.
    """
    user_id = current_user['sub'] # Clerk ID
    
    try:
        # Ensure table exists (self-healing)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                profile_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT,
                is_main INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Check if user exists in our DB
        result = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        if not result.rows:
            logger.info(f"User {user_id} not found in DB (Webhook might have failed). Auto-creating...")
            # Try to populate from claims if available, else placeholders
            # current_user from verify_token might have email if we expanded it, 
            # but usually it's just 'sub'. dependencies.py will tell us.
            # Assuming we might not have email/name if it's just a raw JWT verification without userinfo fetch.
            # We will use placeholders to satisfy NOT NULL constraints.
            email = current_user.get('email', f"{user_id}@placeholder.com")
            name = current_user.get('name', "New User")
            
            try:
                await db.execute(
                    "INSERT INTO users (id, email, full_name, subscription_tier, account_status) VALUES (?, ?, ?, 'trial', 'active')",
                    (user_id, email, name)
                )
            except Exception as e:
                logger.error(f"Failed to auto-create user: {e}")
                # We typically can't proceed with creating profile if user insert failed and FK is active.
                # But let's verify FK status. SQLite enforces it if enabled.

        # Check for profiles again
        result = await db.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
        rows = result.rows
        
        # If no profiles exist, create a default Main Profile
        if not rows:
            logger.info(f"No profiles found for user {user_id}. Creating Default Main Profile.")
            
            # Use data we just ensured exists
            name = "Main Account" 
            # If we just created the user, we used matching name. 
            # If user existed, we fetch real name.
             
            # Try to get user info from 'users' table (source of truth)
            user_info = await db.execute("SELECT full_name FROM users WHERE id = ?", (user_id,))
            if user_info.rows:
                name = user_info.rows[0][0] or "Main Account"
            
            # Insert Main Profile
            # We use user_id as profile_id for the main profile to keep it simple/predictable?
            # Or just UUID. Let's use UUID to be consistent with others, or user_id to ensure uniqueness of main.
            # Using UUID is safer for ForeignKey constraints if we want consistent types.
            # But let's use a new UUID.
            
            main_profile_id = str(uuid.uuid4())
            params = [main_profile_id, user_id, name, f"https://api.dicebear.com/7.x/initials/svg?seed={name}", 1]
            logger.info(f"Attempting to insert profile. Query params count: {len(params)}. Params: {params}")
            
            try:
                await db.execute(
                    "INSERT INTO profiles (profile_id, user_id, name, avatar_url, is_main) VALUES (?, ?, ?, ?, ?)",
                    params
                )
                logger.info("Main profile inserted successfully")
            except Exception as insert_err:
                logger.error(f"INSERT FAILED: {insert_err}")
                raise insert_err
            
            # Fetch again
            result = await db.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
            rows = result.rows

        profiles = []
        for row in rows:
            profiles.append(ProfileResponse(
                profile_id=row[0],
                user_id=row[1],
                name=row[2],
                avatar_url=row[3],
                is_main=bool(row[4]),
                created_at=row[5]
            ))
            
        return profiles
    except Exception as e:
        logger.error(f"Error fetching profiles: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/", response_model=ProfileResponse)
async def create_profile(profile: ProfileCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new sub-profile. Limit 4 profiles per user.
    """
    user_id = current_user['sub']

    try:
        # Self-healing: Ensure user exists
        user_check = await db.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not user_check.rows:
            logger.info(f"User {user_id} not found during create_profile. Auto-creating...")
            email = current_user.get('email', f"{user_id}@placeholder.com")
            name = current_user.get('name', "New User")
            try:
                await db.execute(
                    "INSERT INTO users (id, email, full_name, subscription_tier, account_status) VALUES (?, ?, ?, 'trial', 'active')",
                    (user_id, email, name)
                )
            except Exception as e:
                logger.error(f"Failed to auto-create user in create_profile: {e}")

        # Check profile count
        count_res = await db.execute("SELECT COUNT(*) FROM profiles WHERE user_id = ?", (user_id,))
        count = count_res.rows[0][0]

        if count >= 4:
            raise HTTPException(status_code=400, detail="Maximum limit of 4 profiles reached.")

        new_id = str(uuid.uuid4())
        
        # Insert
        await db.execute(
            "INSERT INTO profiles (profile_id, user_id, name, avatar_url, is_main) VALUES (?, ?, ?, ?, 0)",
            (new_id, user_id, profile.name, profile.avatar_url)
        )
        
        # Return created profile
        return ProfileResponse(
            profile_id=new_id,
            user_id=user_id,
            name=profile.name,
            avatar_url=profile.avatar_url,
            is_main=False,
            created_at="now" # In real app, fetch or return generated time
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create profile")

@router.delete("/{profile_id}")
async def delete_profile(profile_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete a sub-profile. Cannot delete main profile.
    """
    user_id = current_user['sub']

    try:
        # Check if profile exists and belongs to user
        res = await db.execute("SELECT is_main FROM profiles WHERE profile_id = ? AND user_id = ?", (profile_id, user_id))
        if not res.rows:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        is_main = res.rows[0][0]
        if is_main:
            raise HTTPException(status_code=400, detail="Cannot delete the main account profile.")

        await db.execute("DELETE FROM profiles WHERE profile_id = ?", (profile_id,))
        return {"message": "Profile deleted"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete profile")

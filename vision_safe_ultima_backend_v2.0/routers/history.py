from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
import logging
from database.client import db
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])

class DetectionRecord(BaseModel):
    id: int
    session_id: str
    profile_id: Optional[str]
    frame_number: int
    hazard_type: Optional[str]
    risk_level: str
    created_at: str
    camera_id: Optional[str] = None
    camera_name: Optional[str] = None

@router.get("/", response_model=List[DetectionRecord])
async def get_history(
    profile_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detection history.
    If profile_id is provided, filter by it.
    If not provided, and user is Main Account, show all? 
    Or default to current profile?
    
    The Frontend usually knows which profile is active.
    It should pass profile_id.
    """

    try:
        query = """
        SELECT 
            d.id, d.session_id, d.profile_id, d.frame_number, d.hazard_type, d.risk_level, d.created_at,
            s.camera_id, c.camera_name
        FROM detections d
        JOIN sessions s ON d.session_id = s.session_id
        LEFT JOIN cameras c ON s.camera_id = c.camera_id
        """
        params = []
        
        if profile_id:
            query += " WHERE d.profile_id = ?"
            params.append(profile_id)
        
        query += " ORDER BY d.created_at DESC LIMIT 100"
        
        result = await db.fetch_all(query, params)
        
        history = []
        for row in result:
            history.append(DetectionRecord(
                id=row['id'],
                session_id=row['session_id'],
                profile_id=row['profile_id'],
                frame_number=row['frame_number'],
                hazard_type=row['hazard_type'],
                risk_level=row['risk_level'],
                created_at=row['created_at'],
                camera_id=row['camera_id'] or "unknown",
                camera_name=row['camera_name'] or "Camera"
            ))
            
        return history

    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

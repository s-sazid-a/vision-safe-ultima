"""
Storage API Endpoints
File upload/download/delete operations

Routes:
- POST /api/v1/storage/upload/snapshot - Upload alert snapshot
- POST /api/v1/storage/upload/video - Upload video clip
- POST /api/v1/storage/upload/report - Upload exported report
- DELETE /api/v1/storage/file - Delete file
- GET /api/v1/storage/usage - Get storage usage stats
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse
from storage.b2_client import storage as b2_storage
from storage.imgbb_client import imgbb
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])

# File size limits (for free tier optimization)
MAX_SNAPSHOT_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024    # 50MB
MAX_REPORT_SIZE = 10 * 1024 * 1024   # 10MB

@router.post("/upload/snapshot")
async def upload_alert_snapshot(
    file: UploadFile = File(...),
    session_id: Optional[str] = Query(None),
    alert_id: Optional[str] = Query(None),
    use_backup: bool = Query(True, description="Also upload to Imgur backup")
):
    """
    Upload alert snapshot image
    Supported formats: JPG, PNG, WebP, GIF
    Max size: 5MB
    Storage: Backblaze B2 (primary) + Imgur (backup)
    """
    try:
        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_SNAPSHOT_SIZE:
            raise HTTPException(400, "File too large (>5MB)")
        
        # Upload to B2 (primary)
        b2_result = await b2_storage.upload_file(
            file.file,
            folder='alert-snapshots',
            filename=file.filename,
            content_type=file.content_type,
            make_public=True
        )
        
        response = {
            "success": True,
            "primary_storage": {
                "provider": "backblaze_b2",
                "url": b2_result['url'],
                "key": b2_result['key']
            },
            "filename": file.filename
        }
        
        # Upload to ImgBB (backup) if enabled
        if use_backup:
            file.file.seek(0)  # Reset file pointer
            
            # Use session_id as image name for organization
            image_name = f"alert_{session_id or 'unknown'}_{alert_id or 'unknown'}"
            
            imgbb_result = await imgbb.upload_from_file_object(
                file.file,
                filename=file.filename,
                name=image_name,
                expiration=None  # Never expire (keep forever)
            )
            
            if imgbb_result:
                response["backup_storage"] = {
                    "provider": "imgbb",
                    "url": imgbb_result['url'],
                    "display_url": imgbb_result['display_url'],
                    "thumb_url": imgbb_result['thumb_url'],
                    "delete_url": imgbb_result['delete_url'],  # Save this!
                    "size": imgbb_result['size'],
                    "width": imgbb_result['width'],
                    "height": imgbb_result['height']
                }
                logger.info(f"✅ Snapshot backed up to ImgBB")
        
        return response
        
    except Exception as e:
        logger.error(f"Snapshot upload failed: {e}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

@router.post("/upload/video")
async def upload_video_clip(
    file: UploadFile = File(...),
    session_id: str = Query(..., description="Session ID")
):
    """
    Upload short video clip (alert moment)
    Max size: 50MB
    Storage: Backblaze B2 only
    """
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(400, "Video too large (>50MB)")
        
        result = await b2_storage.upload_file(
            file.file,
            folder='video-clips',
            filename=file.filename,
            content_type=file.content_type,
            make_public=True
        )
        
        return {
            "success": True,
            "storage": {
                "provider": "backblaze_b2",
                "url": result['url'],
                "key": result['key']
            },
            "filename": file.filename
        }
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(500, str(e))

@router.get("/usage")
async def get_storage_usage():
    try:
        usage = await b2_storage.get_storage_usage()
        return {
            "success": True,
            "storage": {
                "provider": "backblaze_b2",
                "usage_details": usage,
                "limit_gb": 10
            }
        }
    except Exception as e:
        raise HTTPException(500, str(e))

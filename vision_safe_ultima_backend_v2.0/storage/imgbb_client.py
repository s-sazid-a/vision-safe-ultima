"""
ImgBB Storage Client (Backup for Alert Snapshots)
Unlimited free image hosting with API

Features:
- Unlimited free uploads
- 32MB per image
- API access
- Direct image URLs
- Auto-expiration (optional)

API Documentation: https://api.imgbb.com/

Author: Vision Safe Ultima Team
"""

import requests
import base64
import os
import logging
from typing import Optional, Dict, BinaryIO
from io import BytesIO

logger = logging.getLogger(__name__)

class ImgBBStorage:
    """
    ImgBB image storage client
    
    Features:
    - Unlimited free image uploads
    - 32MB per image limit
    - Simple REST API
    - Direct CDN URLs
    - Optional auto-expiration
    
    Environment Variables Required:
        IMGBB_API_KEY: API key from imgbb.com
    """
    
    API_URL = "https://api.imgbb.com/1/upload"
    
    def __init__(self):
        """Initialize ImgBB client"""
        
        self.api_key = os.getenv('IMGBB_API_KEY')
        
        if not self.api_key:
            logger.warning("⚠️ ImgBB API key not found - ImgBB backup disabled")
            self.enabled = False
            return
        
        self.enabled = True
        logger.info("✅ ImgBB storage initialized successfully")
        logger.info("   ImgBB backup: ENABLED")
        logger.info("   Upload limit: 32MB per image")
    
    async def upload_image(
        self,
        image_path: str,
        name: Optional[str] = None,
        expiration: Optional[int] = None
    ) -> Optional[Dict[str, str]]:
        """
        Upload image from local file path
        
        Args:
            image_path: Path to image file
            name: Image name (optional, defaults to filename)
            expiration: Auto-delete after N seconds (60-15552000)
                       Examples: 3600 = 1 hour, 86400 = 1 day
                       None = never expires
        
        Returns:
            Dictionary with:
                - url: Direct image URL
                - url_viewer: ImgBB page URL
                - thumb_url: Thumbnail URL
                - medium_url: Medium size URL
                - delete_url: URL to delete image
                - size: File size in bytes
                - width: Image width
                - height: Image height
            
            Returns None if upload fails or ImgBB is disabled
        """
        if not self.enabled:
            logger.debug("ImgBB upload skipped (disabled)")
            return None
        
        try:
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Prepare upload data
            payload = {
                'key': self.api_key,
                'image': image_data,
            }
            
            if name:
                payload['name'] = name
            
            if expiration:
                payload['expiration'] = expiration
            
            logger.info(f"Uploading image to ImgBB: {os.path.basename(image_path)}")
            
            # Upload
            response = requests.post(self.API_URL, data=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"❌ ImgBB upload failed: HTTP {response.status_code}")
                logger.error(f"   Response: {response.text}")
                return None
            
            result_data = response.json()
            
            if not result_data.get('success'):
                logger.error(f"❌ ImgBB upload failed: {result_data.get('error')}")
                return None
            
            data = result_data['data']
            
            result = {
                'url': data['url'],  # Direct image URL
                'url_viewer': data['url_viewer'],  # ImgBB page
                'display_url': data['display_url'],  # Display URL
                'thumb_url': data.get('thumb', {}).get('url'),  # Thumbnail (optional)
                'medium_url': data.get('medium', {}).get('url'),  # Medium size (optional)
                'delete_url': data['delete_url'],  # Delete URL
                'id': data['id'],
                'title': data.get('title', ''),
                'size': data['size'],
                'width': data['width'],
                'height': data['height'],
                'time': data['time'],
                'expiration': data.get('expiration', 0)  # 0 = never expires
            }
            
            logger.info(f"✅ Image uploaded to ImgBB: {result['url']}")
            logger.info(f"   Size: {result['size']} bytes, {result['width']}x{result['height']}")
            
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ ImgBB upload timeout")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ ImgBB upload failed: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected error uploading to ImgBB: {e}")
            return None
    
    async def upload_from_bytes(
        self,
        image_bytes: bytes,
        filename: str,
        name: Optional[str] = None,
        expiration: Optional[int] = None
    ) -> Optional[Dict[str, str]]:
        """
        Upload image from bytes
        
        Args:
            image_bytes: Image data as bytes
            filename: Original filename (for logging)
            name: Custom name for ImgBB
            expiration: Auto-delete after N seconds
        
        Returns:
            Dictionary with upload details, or None if failed
        """
        if not self.enabled:
            logger.debug("ImgBB upload skipped (disabled)")
            return None
        
        try:
            # Encode bytes to base64
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Prepare upload data
            payload = {
                'key': self.api_key,
                'image': image_b64,
            }
            
            if name:
                payload['name'] = name
            else:
                # Use filename without extension as name
                payload['name'] = os.path.splitext(filename)[0]
            
            if expiration:
                payload['expiration'] = expiration
            
            logger.info(f"Uploading image to ImgBB from bytes: {filename}")
            
            # Upload
            response = requests.post(self.API_URL, data=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"❌ ImgBB upload failed: HTTP {response.status_code}")
                return None
            
            result_data = response.json()
            
            if not result_data.get('success'):
                logger.error(f"❌ ImgBB upload failed: {result_data.get('error')}")
                return None
            
            data = result_data['data']
            
            result = {
                'url': data['url'],
                'url_viewer': data['url_viewer'],
                'display_url': data['display_url'],
                'thumb_url': data.get('thumb', {}).get('url'),
                'medium_url': data.get('medium', {}).get('url'),
                'delete_url': data['delete_url'],
                'id': data['id'],
                'size': data['size'],
                'width': data['width'],
                'height': data['height']
            }
            
            logger.info(f"✅ Image uploaded to ImgBB: {result['url']}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ ImgBB upload from bytes failed: {e}")
            return None
    
    async def upload_from_file_object(
        self,
        file: BinaryIO,
        filename: str,
        name: Optional[str] = None,
        expiration: Optional[int] = None
    ) -> Optional[Dict[str, str]]:
        """
        Upload image from file-like object
        
        Args:
            file: File-like object (must be in binary mode)
            filename: Original filename
            name: Custom name
            expiration: Auto-delete after N seconds
        
        Returns:
            Dictionary with upload details
        """
        if not self.enabled:
            return None
        
        try:
            # Read bytes from file object
            file.seek(0)
            image_bytes = file.read()
            
            return await self.upload_from_bytes(
                image_bytes, 
                filename, 
                name, 
                expiration
            )
            
        except Exception as e:
            logger.error(f"❌ ImgBB upload from file object failed: {e}")
            return None
    
    async def upload_from_url(
        self,
        image_url: str,
        name: Optional[str] = None,
        expiration: Optional[int] = None
    ) -> Optional[Dict[str, str]]:
        """
        Upload image from URL
        
        Args:
            image_url: URL of image to upload
            name: Custom name
            expiration: Auto-delete after N seconds
        
        Returns:
            Dictionary with upload details
        """
        if not self.enabled:
            return None
        
        try:
            # Prepare upload data (ImgBB supports URL uploads)
            payload = {
                'key': self.api_key,
                'image': image_url,  # Pass URL directly
            }
            
            if name:
                payload['name'] = name
            
            if expiration:
                payload['expiration'] = expiration
            
            logger.info(f"Uploading image to ImgBB from URL: {image_url}")
            
            # Upload
            response = requests.post(self.API_URL, data=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"❌ ImgBB upload failed: HTTP {response.status_code}")
                return None
            
            result_data = response.json()
            
            if not result_data.get('success'):
                logger.error(f"❌ ImgBB upload failed")
                return None
            
            data = result_data['data']
            
            result = {
                'url': data['url'],
                'url_viewer': data['url_viewer'],
                'display_url': data['display_url'],
                'thumb_url': data['thumb']['url'],
                'medium_url': data['medium']['url'],
                'delete_url': data['delete_url'],
                'id': data['id'],
                'size': data['size'],
                'width': data['width'],
                'height': data['height']
            }
            
            logger.info(f"✅ Image uploaded to ImgBB: {result['url']}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ ImgBB upload from URL failed: {e}")
            return None

# Global singleton instance
imgbb = ImgBBStorage()

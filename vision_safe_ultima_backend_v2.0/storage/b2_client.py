"""
Backblaze B2 Storage Client
S3-compatible API for file storage (10GB free)

Features:
- Upload files (images, videos, PDFs, etc.)
- Delete files
- Generate signed URLs
- List files in folders
- Automatic folder organization

Author: Vision Safe Ultima Team
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
import logging
from typing import Optional, BinaryIO, Dict, List
from datetime import datetime
import mimetypes

logger = logging.getLogger(__name__)

class B2Storage:
    """
    Backblaze B2 storage client using S3-compatible API
    
    Environment Variables Required:
        B2_ENDPOINT: S3 endpoint (e.g., https://s3.us-west-004.backblazeb2.com)
        B2_KEY_ID: Application key ID
        B2_APPLICATION_KEY: Application key (secret)
        B2_BUCKET_NAME: Bucket name
    """
    
    def __init__(self):
        """Initialize B2 client with credentials from environment"""
        
        # We don't raise error here to allow app to start even if credentials missing
        # We'll check again before operations
        self.bucket_name = os.getenv('B2_BUCKET_NAME')
        self.endpoint = os.getenv('B2_ENDPOINT')
        
        try:
            # Initialize S3 client for B2
            self.client = boto3.client(
                's3',
                endpoint_url=self.endpoint,
                aws_access_key_id=os.getenv('B2_KEY_ID'),
                aws_secret_access_key=os.getenv('B2_APPLICATION_KEY'),
                region_name='us-east-005' # Updated based on user input
            )
            
            logger.info("✅ Backblaze B2 storage initialized")
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize B2 client: {e}")
            self.client = None
    
    async def upload_file(
        self, 
        file: BinaryIO, 
        folder: str, 
        filename: str,
        content_type: Optional[str] = None,
        make_public: bool = True
    ) -> Dict[str, str]:
        """
        Upload file to B2 storage
        """
        if not self.client or not self.bucket_name:
             raise EnvironmentError("B2 credentials not configured")

        try:
            # Generate unique filename with timestamp
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')[:-3]  # milliseconds
            safe_filename = filename.replace(' ', '_')  # Remove spaces
            key = f"{folder}/{timestamp}_{safe_filename}"
            
            # Auto-detect content type if not provided
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
                if not content_type:
                    content_type = 'application/octet-stream'
            
            # Prepare extra arguments
            extra_args = {
                'ContentType': content_type,
            }
            
            # Make public if requested
            if make_public:
                extra_args['ACL'] = 'public-read'
            
            # Get file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            # Upload file
            logger.info(f"Uploading file to B2: {key} ({file_size} bytes)")
            
            self.client.upload_fileobj(
                file,
                self.bucket_name,
                key,
                ExtraArgs=extra_args
            )
            
            # Generate public URL
            url = f"{self.endpoint}/{self.bucket_name}/{key}"
            
            logger.info(f"✅ File uploaded successfully: {key}")
            
            return {
                'url': url,
                'key': key,
                'filename': filename,
                'size': file_size,
                'content_type': content_type,
                'folder': folder,
                'uploaded_at': datetime.utcnow().isoformat() + 'Z'
            }
            
        except ClientError as e:
            logger.error(f"❌ B2 upload failed: {e}")
            raise Exception(f"Failed to upload file: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during upload: {e}")
            raise

    async def delete_file_by_url(self, file_url: str) -> bool:
        """
        Delete file from B2 using its URL
        """
        if not self.client or not self.bucket_name:
             return False

        try:
            if f"{self.bucket_name}/" not in file_url:
                raise ValueError(f"Invalid URL format: {file_url}")
            
            key = file_url.split(f"{self.bucket_name}/")[1]
            
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return True
            
        except Exception as e:
            logger.error(f"❌ Delete by URL failed: {e}")
            return False

    async def get_storage_usage(self) -> Dict[str, int]:
        """
        Get total storage usage statistics
        """
        if not self.client or not self.bucket_name:
             return {'total_files': 0, 'total_size_bytes': 0, 'total_size_mb': 0, 'total_size_gb': 0}

        try:
            response = self.client.list_objects_v2(Bucket=self.bucket_name)
            
            total_files = 0
            total_size = 0
            
            if 'Contents' in response:
                total_files = len(response['Contents'])
                total_size = sum(obj['Size'] for obj in response['Contents'])
            
            return {
                'total_files': total_files,
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'total_size_gb': round(total_size / (1024 * 1024 * 1024), 2)
            }
            
        except ClientError as e:
            logger.error(f"❌ Get storage usage failed: {e}")
            return {
                'total_files': 0,
                'total_size_bytes': 0,
                'total_size_mb': 0,
                'total_size_gb': 0
            }

# Global singleton instance
storage = B2Storage()

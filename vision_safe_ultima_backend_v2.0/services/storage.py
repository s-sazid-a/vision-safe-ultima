import boto3
import os
import logging
from botocore.exceptions import NoCredentialsError

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.public_url = os.getenv("R2_PUBLIC_URL")

        if not all([self.account_id, self.access_key, self.secret_key, self.bucket_name]):
            logger.warning("⚠️ R2 credentials missing. Using LOCAL STORAGE (static/uploads).")
            self.s3_client = None
            # Ensure local upload directory exists
            self.upload_dir = os.path.join(os.getcwd(), "static", "uploads")
            os.makedirs(self.upload_dir, exist_ok=True)
        else:
            try:
                self.s3_client = boto3.client(
                    service_name='s3',
                    endpoint_url=f"https://{self.account_id}.r2.cloudflarestorage.com",
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name="auto", 
                )
                logger.info("✅ Cloudflare R2 Storage Service Initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize R2 Storage Service: {e}")
                self.s3_client = None
                self.upload_dir = os.path.join(os.getcwd(), "static", "uploads")
                os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_file(self, file_content: bytes, file_name: str, content_type: str = "image/jpeg") -> str | None:
        """
        Uploads a file to R2 OR Local Storage.
        """
        # LOCAL STORAGE FALLBACK
        if not self.s3_client:
            try:
                file_path = os.path.join(self.upload_dir, file_name)
                with open(file_path, "wb") as f:
                    f.write(file_content)
                logger.info(f"💾 Saved file locally: {file_path}")
                
                # Return local URL (assumes 'static' is mounted at /static)
                return f"http://localhost:8000/static/uploads/{file_name}"
            except Exception as e:
                logger.error(f"Failed to save file locally: {e}")
                return None

        # R2 STORAGE
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=file_content,
                ContentType=content_type,
            )
            
            if self.public_url:
                base_url = self.public_url.rstrip("/")
                return f"{base_url}/{file_name}"
            else:
                return f"https://{self.account_id}.r2.cloudflarestorage.com/{self.bucket_name}/{file_name}"

        except NoCredentialsError:
            logger.error("R2 Credentials not available")
            return None
        except Exception as e:
            logger.error(f"Failed to upload file to R2: {e}")
            return None

    async def delete_file(self, file_key: str) -> bool:
        """
        Deletes a file from R2.
        """
        if not self.s3_client:
            return False

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from R2: {e}")
            return False

# Singleton instance
storage_service = StorageService()

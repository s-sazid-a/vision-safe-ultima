import sys
import os
import asyncio

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from storage.imgbb_client import imgbb

async def test_imgbb_connection():
    """Test ImgBB connection"""
    print("\nTesting ImgBB connection...")
    
    if not imgbb.enabled:
        print("⚠️ ImgBB disabled (no API key)")
        return None
    
    print("✅ ImgBB initialized")
    print("   Upload limit: 32MB per image")
    
    # Try uploading a small test image (1x1 pixel)
    try:
        # 1x1 white pixel base64
        pixel_b64 = b'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
        import base64
        pixel_bytes = base64.b64decode(pixel_b64)
        
        print("   Attempting test upload...")
        result = await imgbb.upload_from_bytes(
            pixel_bytes, 
            "test_pixel.png", 
            name="verification_pixel", 
            expiration=60 # Expire in 60 seconds
        )
        
        if result:
            print(f"✅ Upload successful: {result['url']}")
            print(f"   Delete URL: {result['delete_url']}")
            return True
        else:
            print("❌ Upload failed")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_imgbb_connection())

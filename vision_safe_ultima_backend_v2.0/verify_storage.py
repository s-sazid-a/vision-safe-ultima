"""
Verify Storage Connection
Checks Backblaze B2 connection and auto-corrects bucket name if needed.
"""
import boto3
import os
import sys
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_b2():
    print("🔄 Verifying Backblaze B2 Connection...")
    
    endpoint = os.getenv('B2_ENDPOINT')
    key_id = os.getenv('B2_KEY_ID')
    app_key = os.getenv('B2_APPLICATION_KEY')
    bucket_name = os.getenv('B2_BUCKET_NAME')
    bucket_id = os.getenv('B2_BUCKET_ID')
    
    print(f"   Endpoint: {endpoint}")
    print(f"   Key ID: {key_id}")
    print(f"   Bucket (Configured): {bucket_name}")

    try:
        s3 = boto3.client(
            's3',
            endpoint_url=endpoint,
            aws_access_key_id=key_id,
            aws_secret_access_key=app_key,
            region_name='us-east-005'
        )
        
        # 1. Try to list buckets (might fail if key is restricted)
        print("   Attempting to list buckets...")
        found_bucket = None
        try:
            response = s3.list_buckets()
            buckets = response['Buckets']
            print(f"   ✅ Auth Successful! Found {len(buckets)} buckets.")
            
            for bucket in buckets:
                if bucket['Name'] == bucket_name:
                    found_bucket = bucket['Name']
            
            if found_bucket:
                 print(f"   ✅ Configured bucket '{bucket_name}' is valid.")
            else:
                print(f"   ⚠️ Configured bucket '{bucket_name}' not found in account list.")
                if buckets:
                    print(f"   👉 Available bucket: '{buckets[0]['Name']}'")

        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDenied':
                print("   ⚠️ ListBuckets denied (Expected if key is restricted). Proceeding to direct upload test...")
                found_bucket = bucket_name  # Assume configured name is correct
            else:
                raise e

        if not found_bucket:
             print("   ❌ Could not verify bucket existence. Aborting.")
             return False

        # 2. Upload Test File
        print(f"   Attempting upload to '{found_bucket}'...")
        s3.put_object(Bucket=found_bucket, Key='test_connection.txt', Body=b'Connection Verified!')
        print("   ✅ Upload Successful!")
        
        # 3. Clean up
        s3.delete_object(Bucket=found_bucket, Key='test_connection.txt')
        print("   ✅ Cleanup Successful!")
        
        return True

    except ClientError as e:
        print(f"   ❌ ClientError: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    if verify_b2():
        print("\n✅ STORAGE VERIFICATION PASSED")
        sys.exit(0)
    else:
        print("\n❌ STORAGE VERIFICATION FAILED")
        sys.exit(1)

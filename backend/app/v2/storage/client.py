import os
from typing import Optional

try:
    import boto3
    from botocore.exceptions import NoCredentialsError
    BOTO3_AVAILABLE = True
except ImportError:
    boto3 = None
    NoCredentialsError = Exception
    BOTO3_AVAILABLE = False

class StorageClient:
    def __init__(self):
        self.bucket_name = os.getenv("AWS_S3_BUCKET", "homeverse-media")
        self.s3_client = None
        
        aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        endpoint_url = os.getenv("AWS_S3_ENDPOINT_URL") # Useful for MinIO
        
        if BOTO3_AVAILABLE and aws_access_key and aws_secret_key:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key,
                    endpoint_url=endpoint_url
                )
                print("V2 Storage: AWS S3 client initialized successfully.")
            except Exception as e:
                print(f"V2 Storage Warning: Failed to initialize S3 client: {e}")

    async def upload_file(self, file_bytes: bytes, file_key: str, content_type: str = "image/jpeg") -> str:
        """
        Uploads file bytes to S3/MinIO, or falls back to local static storage.
        Returns the public HTTP URL of the asset.
        """
        if self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=file_bytes,
                    ContentType=content_type,
                    ACL='public-read'
                )
                # Handle custom S3 endpoints (MinIO)
                endpoint = self.s3_client.meta.endpoint_url
                if "amazonaws.com" in endpoint:
                    return f"https://{self.bucket_name}.s3.amazonaws.com/{file_key}"
                else:
                    return f"{endpoint}/{self.bucket_name}/{file_key}"
            except NoCredentialsError:
                print("V2 Storage: AWS S3 credentials missing. Using local storage fallback.")
            except Exception as e:
                print(f"V2 Storage: S3 upload failed: {e}. Using local storage fallback.")
                
        # Local fallback
        local_dir = "static/uploads"
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join("static", "uploads", os.path.basename(file_key))
        with open(local_path, "wb") as f:
            f.write(file_bytes)
            
        return f"http://localhost:8080/static/uploads/{os.path.basename(file_key)}"

storage_client = StorageClient()

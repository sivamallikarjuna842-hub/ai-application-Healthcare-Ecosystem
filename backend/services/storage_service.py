import os
from typing import Optional
import io

class StorageService:
    """Cloud storage abstraction layer"""
    
    def __init__(self, config):
        """Initialize storage service based on config"""
        self.config = config
        self.provider = config.get('STORAGE_PROVIDER', 'local')
        
        if self.provider == 's3':
            import boto3
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=config.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=config.get('AWS_SECRET_ACCESS_KEY'),
                region_name=config.get('AWS_REGION', 'us-east-1')
            )
            self.bucket = config.get('AWS_S3_BUCKET')
        
        elif self.provider == 'gcs':
            from google.cloud import storage as gcs
            self.gcs_client = gcs.Client.from_service_account_json(
                config.get('GCS_CREDENTIALS_PATH')
            )
            self.bucket = self.gcs_client.bucket(config.get('GCS_BUCKET_NAME'))
        
        elif self.provider == 'azure':
            from azure.storage.blob import BlobServiceClient
            self.azure_client = BlobServiceClient.from_connection_string(
                config.get('AZURE_STORAGE_CONNECTION_STRING')
            )
            self.container = self.azure_client.get_container_client(
                config.get('AZURE_CONTAINER_NAME')
            )
        
        else:  # Local storage
            self.upload_folder = config.get('UPLOAD_FOLDER', 'uploads')
            os.makedirs(self.upload_folder, exist_ok=True)
    
    def upload_file(self, file_obj, filename: str, folder: str = 'reports') -> str:
        """
        Upload file to storage
        
        Args:
            file_obj: File object to upload
            filename: Name of file
            folder: Folder/directory in storage
        
        Returns:
            URL or path to uploaded file
        """
        try:
            if self.provider == 's3':
                return self._upload_to_s3(file_obj, filename, folder)
            elif self.provider == 'gcs':
                return self._upload_to_gcs(file_obj, filename, folder)
            elif self.provider == 'azure':
                return self._upload_to_azure(file_obj, filename, folder)
            else:
                return self._upload_local(file_obj, filename, folder)
        
        except Exception as e:
            raise Exception(f"Upload failed: {str(e)}")
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage
        
        Args:
            file_path: Path to file
        
        Returns:
            True if successful
        """
        try:
            if self.provider == 's3':
                return self._delete_from_s3(file_path)
            elif self.provider == 'gcs':
                return self._delete_from_gcs(file_path)
            elif self.provider == 'azure':
                return self._delete_from_azure(file_path)
            else:
                return self._delete_local(file_path)
        
        except Exception as e:
            raise Exception(f"Delete failed: {str(e)}")
    
    def get_file_url(self, file_path: str, expiration: int = 3600) -> str:
        """
        Get downloadable URL for file
        
        Args:
            file_path: Path to file
            expiration: URL expiration in seconds
        
        Returns:
            Downloadable URL
        """
        try:
            if self.provider == 's3':
                return self._get_s3_url(file_path, expiration)
            elif self.provider == 'gcs':
                return self._get_gcs_url(file_path, expiration)
            elif self.provider == 'azure':
                return self._get_azure_url(file_path, expiration)
            else:
                return self._get_local_url(file_path)
        
        except Exception as e:
            raise Exception(f"Get URL failed: {str(e)}")
    
    # AWS S3 Methods
    def _upload_to_s3(self, file_obj, filename: str, folder: str) -> str:
        """Upload to AWS S3"""
        key = f"{folder}/{filename}"
        
        self.s3_client.upload_fileobj(
            file_obj,
            self.bucket,
            key,
            ExtraArgs={
                'ServerSideEncryption': 'AES256',
                'Metadata': {'original_name': filename}
            }
        )
        
        return f"s3://{self.bucket}/{key}"
    
    def _delete_from_s3(self, file_path: str) -> bool:
        """Delete from S3"""
        key = file_path.replace(f"s3://{self.bucket}/", "")
        self.s3_client.delete_object(Bucket=self.bucket, Key=key)
        return True
    
    def _get_s3_url(self, file_path: str, expiration: int) -> str:
        """Get S3 signed URL"""
        key = file_path.replace(f"s3://{self.bucket}/", "")
        
        return self.s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=expiration
        )
    
    # Google Cloud Storage Methods
    def _upload_to_gcs(self, file_obj, filename: str, folder: str) -> str:
        """Upload to Google Cloud Storage"""
        blob_path = f"{folder}/{filename}"
        blob = self.bucket.blob(blob_path)
        
        blob.upload_from_string(
            file_obj.read(),
            content_type=file_obj.content_type
        )
        
        return f"gs://{self.bucket.name}/{blob_path}"
    
    def _delete_from_gcs(self, file_path: str) -> bool:
        """Delete from GCS"""
        blob_path = file_path.replace(f"gs://{self.bucket.name}/", "")
        blob = self.bucket.blob(blob_path)
        blob.delete()
        return True
    
    def _get_gcs_url(self, file_path: str, expiration: int) -> str:
        """Get GCS signed URL"""
        blob_path = file_path.replace(f"gs://{self.bucket.name}/", "")
        blob = self.bucket.blob(blob_path)
        
        return blob.generate_signed_url(
            version="v4",
            expiration=expiration
        )
    
    # Azure Blob Storage Methods
    def _upload_to_azure(self, file_obj, filename: str, folder: str) -> str:
        """Upload to Azure Blob Storage"""
        blob_name = f"{folder}/{filename}"
        
        self.container.upload_blob(
            name=blob_name,
            data=file_obj.read(),
            overwrite=True
        )
        
        return f"azure://{blob_name}"
    
    def _delete_from_azure(self, file_path: str) -> bool:
        """Delete from Azure"""
        blob_name = file_path.replace("azure://", "")
        self.container.delete_blob(blob_name)
        return True
    
    def _get_azure_url(self, file_path: str, expiration: int) -> str:
        """Get Azure SAS URL"""
        from datetime import datetime, timedelta
        from azure.storage.blob import generate_blob_sas, BlobSasPermissions
        
        blob_name = file_path.replace("azure://", "")
        
        sas_token = generate_blob_sas(
            account_name=self.azure_client.account_name,
            container_name=self.container.name,
            blob_name=blob_name,
            account_key=self.azure_client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(seconds=expiration)
        )
        
        return f"{self.container.get_blob_client(blob_name).url}?{sas_token}"
    
    # Local Storage Methods
    def _upload_local(self, file_obj, filename: str, folder: str) -> str:
        """Upload to local filesystem"""
        folder_path = os.path.join(self.upload_folder, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_obj.read())
        
        return f"/uploads/{folder}/{filename}"
    
    def _delete_local(self, file_path: str) -> bool:
        """Delete from local filesystem"""
        full_path = os.path.join(self.upload_folder, file_path.replace("/uploads/", ""))
        
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        
        return False
    
    def _get_local_url(self, file_path: str) -> str:
        """Get local file URL"""
        return file_path

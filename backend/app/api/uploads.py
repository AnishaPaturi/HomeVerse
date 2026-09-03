from fastapi import APIRouter, UploadFile, File, HTTPException, status
import os
import uuid
import shutil

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    """Upload floor plans, room photographs, and design reference assets."""
    allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed_extensions}"
        )
    
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": unique_filename,
        "original_name": file.filename,
        "url": f"/static/uploads/{unique_filename}",
        "status": "uploaded"
    }

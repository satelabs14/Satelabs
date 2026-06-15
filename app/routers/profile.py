from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path

from app.database import SessionLocal
from app import models, schemas
from app.dependencies import get_current_user, get_db

router = APIRouter(tags=["Profile"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/profiles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.put("/profile/update")
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.username:
        # Check if username is already taken by someone else
        existing_user = db.query(models.User).filter(
            models.User.username == data.username,
            models.User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
            
        current_user.username = data.username

    if data.bio:
        current_user.bio = data.bio

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated",
        "user": schemas.UserOut.model_validate(current_user)
    }


@router.post("/profile/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Update user profile image
        relative_path = f"uploads/profiles/{unique_filename}"
        current_user.profile_image = relative_path
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Image uploaded successfully",
            "image": relative_path
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )
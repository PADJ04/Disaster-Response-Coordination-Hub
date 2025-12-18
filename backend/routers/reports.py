from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List, Optional
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", response_model=schemas.ReportResponse)
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    severity: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_id: str = Form(...),
    images: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Validate image count
    if images and len(images) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")

    new_report = models.Report(
        title=title,
        description=description,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        user_id=user_id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    if images:
        for image in images:
            file_extension = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            new_image = models.ReportImage(
                report_id=new_report.id,
                image_url=f"/uploads/{file_name}"
            )
            db.add(new_image)
        
        db.commit()
        db.refresh(new_report)
        
    return new_report

@router.get("/", response_model=List[schemas.ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    return db.query(models.Report).all()

@router.delete("/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Unlink tasks associated with this report
    tasks = db.query(models.Task).filter(models.Task.report_id == report_id).all()
    for task in tasks:
        task.report_id = None
        
    # Delete associated images from disk
    for image in report.images:
        # image_url is like "/uploads/filename.ext"
        if image.image_url.startswith("/uploads/"):
            filename = image.image_url.replace("/uploads/", "")
            file_path = os.path.join("uploads", filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")
    
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}


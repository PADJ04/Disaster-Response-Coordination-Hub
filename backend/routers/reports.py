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

    # Handle anonymous reports
    final_user_id = user_id if user_id != "anonymous" else None

    new_report = models.Report(
        title=title,
        description=description,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        user_id=final_user_id
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


@router.patch("/{report_id}", response_model=schemas.ReportResponse)
def update_report(report_id: str, report_update: schemas.ReportUpdate, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report_update.status is not None:
        report.status = report_update.status
        
    db.commit()
    db.refresh(report)
    return report

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    """Return a summary of zones and the reports in each zone."""
    reports = db.query(models.Report).filter(models.Report.zone != None).all()
    zones = {}
    for r in reports:
        zones.setdefault(r.zone, []).append({
            "id": r.id,
            "title": r.title,
            "severity": r.severity,
            "created_at": r.created_at,
            "status": r.status,
            "latitude": r.latitude,
            "longitude": r.longitude,
        })
    return zones

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


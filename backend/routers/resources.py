from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List

router = APIRouter()

@router.post("/rescue-centers/", response_model=schemas.RescueCenterResponse)
def create_rescue_center(center: schemas.RescueCenterCreate, db: Session = Depends(get_db)):
    new_center = models.RescueCenter(**center.dict())
    db.add(new_center)
    db.commit()
    db.refresh(new_center)
    return new_center

@router.get("/rescue-centers/", response_model=List[schemas.RescueCenterResponse])
def get_rescue_centers(db: Session = Depends(get_db)):
    return db.query(models.RescueCenter).all()

@router.delete("/rescue-centers/{center_id}")
def delete_rescue_center(center_id: str, db: Session = Depends(get_db)):
    center = db.query(models.RescueCenter).filter(models.RescueCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Rescue center not found")
    
    db.delete(center)
    db.commit()
    return {"message": "Rescue center deleted successfully"}

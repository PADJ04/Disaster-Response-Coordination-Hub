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

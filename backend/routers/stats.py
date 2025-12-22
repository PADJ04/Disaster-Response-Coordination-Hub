from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    reports_count = db.query(models.Report).count()
    volunteers_count = db.query(models.User).filter(models.User.role == "volunteer").count()
    districts_count = db.query(models.User).filter(models.User.role == "district").count()
    rescue_centers_count = db.query(models.RescueCenter).count()
    
    return {
        "reports": reports_count,
        "volunteers": volunteers_count,
        "districts": districts_count,
        "rescue_centers": rescue_centers_count
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from typing import List

# Security (Should be in env vars/config)
SECRET_KEY = "YOUR_SECRET_KEY_HERE_CHANGE_IN_PROD"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/", response_model=schemas.TaskResponse)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "district":
        raise HTTPException(status_code=403, detail="Only district authorities can assign tasks")
    
    # Verify volunteer exists
    volunteer = db.query(models.User).filter(models.User.id == task.volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    new_task = models.Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        volunteer_id=task.volunteer_id,
        report_id=task.report_id,
        status="assigned"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "district":
        # District sees all tasks
        tasks = db.query(models.Task).all()
    else:
        # Volunteer sees only their tasks
        tasks = db.query(models.Task).filter(models.Task.volunteer_id == current_user.id).all()
    return tasks

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task_status(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Authorization check
    if current_user.role == "volunteer":
        if task.volunteer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
        # Volunteers can only change status to accepted, rejected, completed
        if task_update.status not in ["accepted", "rejected", "completed"]:
             raise HTTPException(status_code=400, detail="Invalid status update for volunteer")
    
    task.status = task_update.status
    db.commit()
    db.refresh(task)
    return task

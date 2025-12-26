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
    
    lat = task.latitude
    lng = task.longitude

    if task.report_id:
        report = db.query(models.Report).filter(models.Report.id == task.report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        # Inherit from report if not provided
        if lat is None: lat = report.latitude
        if lng is None: lng = report.longitude
        # If assigning a task to a report, ensure the report is moved out of 'zone' category
        # (mutual exclusivity: report -> either zone OR task). Clear zone if present.
        # Prevent assigning a new task to a report that already has an active task
        active = db.query(models.Task).filter(models.Task.report_id == task.report_id).filter(models.Task.status.notin_(["rejected", "verified"]))
        if active.count() > 0:
            raise HTTPException(status_code=400, detail="A task is already active for this report")

        if report.zone is not None:
            report.zone = None
            db.add(report)
    
    # For manual tasks (no report_id), location is mandatory
    if not task.report_id and (lat is None or lng is None):
        raise HTTPException(status_code=400, detail="Location (latitude and longitude) is mandatory for manual tasks")

    new_task = models.Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        volunteer_id=task.volunteer_id,
        report_id=task.report_id,
        status="assigned",
        latitude=lat,
        longitude=lng,
        
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Task)
    
    if current_user.role == "district":
        # District sees all tasks, optionally filtered
        pass
    else:
        # Volunteer sees only their tasks
        query = query.filter(models.Task.volunteer_id == current_user.id)
    
    # zone filtering removed
    if status:
        query = query.filter(models.Task.status == status)
        
    return query.all()

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task_status(task_id: str, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Authorization check
    if current_user.role == "volunteer":
        if task.volunteer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
        # Volunteer transitions
        # assigned -> accepted / rejected
        # accepted -> completed (pending verification)
        allowed_statuses = ["accepted", "rejected", "completed"]
        if task_update.status not in allowed_statuses:
             raise HTTPException(status_code=400, detail="Invalid status update for volunteer")
        
        # Prevent volunteer from verifying their own task
        if task_update.status == "verified":
             raise HTTPException(status_code=403, detail="Volunteers cannot verify tasks")

    elif current_user.role == "district":
        # District can do anything, but specifically they verify
        pass
    
    task.status = task_update.status

    if task.status == "completed" or task.status == "verified":
        import datetime
        if not task.completed_at:
            task.completed_at = datetime.datetime.utcnow()

    # Update report status based on task status
    if task.report_id:
        report = db.query(models.Report).filter(models.Report.id == task.report_id).first()
        if report:
            if task.status == "verified":
                report.status = "resolved"
            elif task.status == "completed":
                # Task is done by volunteer, but not verified. Report still in progress? 
                # Or maybe we have a 'pending-verification' status for report too?
                # For now, keep it in-progress.
                report.status = "in-progress" 
            elif task.status == "accepted":
                report.status = "in-progress"
            elif task.status == "rejected":
                # If rejected, maybe report goes back to new? Or stays as is?
                # Let's leave it as is for now, or maybe 'new' if it was 'in-progress'.
                pass

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Allow district to force-delete any task; volunteers may delete their own tasks
    if current_user.role != "district":
        if task.volunteer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    # If linked to a report, reset report status to 'new' so it returns to unassigned state
    if task.report_id:
        report = db.query(models.Report).filter(models.Report.id == task.report_id).first()
        if report:
            report.status = "new"
            db.add(report)

    db.delete(task)
    db.commit()
    return {"detail": "deleted"}

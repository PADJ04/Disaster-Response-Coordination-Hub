from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import os

# Security
SECRET_KEY = "YOUR_SECRET_KEY_HERE_CHANGE_IN_PROD"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

def _truncate_password_to_72(password: str) -> str:
    """Ensure password does not exceed 72 bytes (bcrypt limit).

    Truncates on UTF-8 byte boundary to avoid ValueError from bcrypt.
    """
    if not isinstance(password, str):
        password = str(password)
    b = password.encode("utf-8")
    if len(b) <= 72:
        return password
    # truncate bytes and decode ignoring incomplete characters
    return b[:72].decode("utf-8", errors="ignore")


def verify_password(plain_password, hashed_password):
    plain_password = _truncate_password_to_72(plain_password)
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    password = _truncate_password_to_72(password)
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.phone == user.phone)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or Phone already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        address=user.address,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # Check if identifier is email or phone
    user = db.query(models.User).filter(
        (models.User.email == user_credentials.identifier) | 
        (models.User.phone == user_credentials.identifier)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if user.role != user_credentials.role:
        raise HTTPException(status_code=403, detail="Invalid role for this user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id, "name": user.name}

@router.get("/volunteers", response_model=List[schemas.UserResponse])
def get_all_volunteers(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "volunteer").all()

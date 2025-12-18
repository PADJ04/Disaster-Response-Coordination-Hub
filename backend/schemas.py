from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    phone: str
    name: str
    address: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    identifier: str # email or phone
    password: str
    role: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    title: str
    description: str
    severity: str
    latitude: float
    longitude: float

class ReportCreate(ReportBase):
    pass

class ReportImageResponse(BaseModel):
    id: str
    image_url: str

    class Config:
        from_attributes = True

class ReportResponse(ReportBase):
    id: str
    status: str
    created_at: datetime
    user_id: str
    images: List[ReportImageResponse] = []

    class Config:
        from_attributes = True

class RescueCenterBase(BaseModel):
    name: str
    address: str
    capacity: Optional[int] = None
    contact: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RescueCenterCreate(RescueCenterBase):
    pass

class RescueCenterResponse(RescueCenterBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    volunteer_id: str
    report_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: str

class TaskResponse(TaskBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'volunteer' or 'district'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("Report", back_populates="owner")
    tasks = relationship("Task", back_populates="volunteer")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String, default="new") # new, in-progress, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"))

    owner = relationship("User", back_populates="reports")
    images = relationship("ReportImage", back_populates="report", cascade="all, delete-orphan")

class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    report_id = Column(String, ForeignKey("reports.id"))
    image_url = Column(String, nullable=False)
    
    report = relationship("Report", back_populates="images")

class RescueCenter(Base):
    __tablename__ = "rescue_centers"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    capacity = Column(Integer, nullable=True)
    contact = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="assigned") # assigned, accepted, rejected, completed
    priority = Column(String, default="medium") # low, medium, high
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    volunteer_id = Column(String, ForeignKey("users.id"))
    report_id = Column(String, ForeignKey("reports.id"), nullable=True)

    volunteer = relationship("User", back_populates="tasks")
    report = relationship("Report")

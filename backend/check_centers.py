from database import SessionLocal
from models import RescueCenter

db = SessionLocal()
centers = db.query(RescueCenter).all()
print(f"Found {len(centers)} rescue centers.")
for center in centers:
    print(f"- {center.name} at ({center.latitude}, {center.longitude})")
db.close()

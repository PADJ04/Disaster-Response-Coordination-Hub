from database import SessionLocal
from models import User
import sys

def make_user_district_authority(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        print(f"Found user: {user.name} (Current Role: {user.role})")
        user.role = "district"
        db.commit()
        print(f"Successfully updated {user.name} to 'district' authority.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python update_role.py <email>")
    else:
        make_user_district_authority(sys.argv[1])

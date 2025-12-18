from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR PRIMARY KEY,
                title VARCHAR NOT NULL,
                description VARCHAR NOT NULL,
                status VARCHAR DEFAULT 'assigned',
                priority VARCHAR DEFAULT 'medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                volunteer_id VARCHAR REFERENCES users(id),
                report_id VARCHAR REFERENCES reports(id)
            );
        """))
        print("Tasks table created successfully.")

if __name__ == "__main__":
    migrate()

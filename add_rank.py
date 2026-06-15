from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE users ADD COLUMN rank VARCHAR(50) DEFAULT "Recruit"'))
        conn.commit()
        print("✓ Added rank column")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("✓ Rank column already exists")
        else:
            print(f"Error: {e}")

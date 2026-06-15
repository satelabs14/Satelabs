from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0'))
        conn.commit()
        print("✓ Added xp column")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("✓ xp column already exists")
        else:
            print(f"Error adding xp: {e}")
    
    # Note: created_at requires special handling, skip for now
    print("Migration completed!")

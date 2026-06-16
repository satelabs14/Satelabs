from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

with engine.connect() as conn:
    existing_columns = {
        row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()
    }

    if "points" not in existing_columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0"))
        conn.commit()
        print("Added points column")
    else:
        print("points column already exists")

    if "xp" in existing_columns:
        conn.execute(text("UPDATE users SET points = COALESCE(xp, 0) WHERE COALESCE(points, 0) = 0 AND COALESCE(xp, 0) > 0"))
        conn.commit()
        print("Copied legacy xp values into empty points rows. Review, then drop the legacy xp column manually if appropriate.")

    print("Points migration completed!")

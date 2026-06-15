from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# List of columns to add
columns_to_add = [
    ("profile_image", "VARCHAR(500)"),
    ("courses_completed", "INTEGER DEFAULT 0"),
    ("labs_completed", "INTEGER DEFAULT 0"),
    ("points", "INTEGER DEFAULT 0"),
    ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
]

with engine.connect() as conn:
    # Get existing columns
    result = conn.execute(text("PRAGMA table_info(users)"))
    existing_columns = {row[1] for row in result}
    print(f"Existing columns: {existing_columns}")
    
    # Add missing columns
    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✓ Added column: {col_name}")
            except OperationalError as e:
                print(f"✗ Failed to add {col_name}: {e}")
        else:
            print(f"  Column {col_name} already exists")

print("\nDatabase schema updated successfully!")

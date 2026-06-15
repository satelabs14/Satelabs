from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models
from app.utils import hash_password
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create all tables
Base.metadata.create_all(bind=engine)

# Check what tables exist
inspector = inspect(engine)
print("Tables in database:")
for table in inspector.get_table_names():
    print(f"  - {table}")

# Create a test user
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Check if user exists
test_user = db.query(models.User).filter(models.User.username == "testuser").first()
if not test_user:
    test_user = models.User(
        username="testuser",
        email="test@example.com",
        password=hash_password("password123"),
        role="user"
    )
    db.add(test_user)
    db.commit()
    print("\n✓ Test user created: testuser / password123")
else:
    print("\n✓ Test user already exists: testuser")

db.close()

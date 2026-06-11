from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True)
    password = Column(String(255))

    role = Column(String(50), default="student")

    courses_completed = Column(Integer, default=0)
    labs_completed = Column(Integer, default=0)
    points = Column(Integer, default=0)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    points = Column(Integer, default=10)

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    difficulty = Column(String)
    points = Column(Integer)
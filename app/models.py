from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True)
    password = Column(String(255))
    bio = Column(String(255), nullable=True)
    role = Column(String(50), default="student")
    profile_image = Column(String(500), nullable=True)
    courses_completed = Column(Integer, default=0)
    labs_completed = Column(Integer, default=0)
    points = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    rank = Column(String(50), default="Recruit")
    created_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    points = Column(Integer, default=10)

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    points = Column(Integer, default=10)

class ModuleProgress(Base):
    __tablename__ = "module_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    completed = Column(Boolean, default=False)

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    difficulty = Column(String)
    points = Column(Integer)
    module_id = Column(Integer, ForeignKey("modules.id"))

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    completed = Column(Boolean, default=False)
    progress_percentage = Column(Integer, default=0)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    points = Column(Integer, default=5)

class LabProgress(Base):
    __tablename__ = "lab_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lab_id = Column(Integer, ForeignKey("labs.id"))
    completed = Column(Boolean, default=False)

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

    certificate_code = Column(String, unique=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
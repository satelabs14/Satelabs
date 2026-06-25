from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

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
    rank = Column(String(50), default="Recruit")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    activities = relationship("Activity", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    points = Column(Integer, default=10)

    modules = relationship("Module", back_populates="course")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    points = Column(Integer, default=10)

    course = relationship("Course", back_populates="modules")

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

    title = Column(String, nullable=False)

    description = Column(Text)

    points = Column(Integer, default=100)

    passing_score = Column(Integer, default=70)

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id")
    )

    question = Column(Text, nullable=False)

    option_a = Column(String, nullable=False)

    option_b = Column(String, nullable=False)

    option_c = Column(String, nullable=False)

    option_d = Column(String, nullable=False)

    correct_answer = Column(
        String,
        nullable=False
    )

class QuizProgress(Base):
    __tablename__ = "quiz_progress"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))

    score = Column(Integer)
    passed = Column(Boolean)

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
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="certificates")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    related_id = Column(Integer, nullable=True) # e.g., module_id or course_id

    user = relationship("User", back_populates="activities")
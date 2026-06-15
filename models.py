from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    level = Column(String) # Beginner, Intermediate, Advanced
    total_xp = Column(Integer, default=0)
    image_url = Column(String)
    
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")

class Module(Base):
    __tablename__ = 'modules'
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    title = Column(String)
    description = Column(Text)
    order = Column(Integer)
    xp_reward = Column(Integer, default=50)
    
    course = relationship("Course", back_populates="modules")
    topics = relationship("Topic", back_populates="module", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = 'topics'
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey('modules.id'))
    title = Column(String)
    content = Column(Text)
    order = Column(Integer)
    
    module = relationship("Module", back_populates="topics")

class Enrollment(Base):
    __tablename__ = 'enrollments'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id')) # Assuming a users table exists
    course_id = Column(Integer, ForeignKey('courses.id'))
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    course = relationship("Course", back_populates="enrollments")
    progress = relationship("Progress", back_populates="enrollment", cascade="all, delete-orphan")

class Progress(Base):
    __tablename__ = 'progress'
    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey('enrollments.id'))
    module_id = Column(Integer, ForeignKey('modules.id'))
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    enrollment = relationship("Enrollment", back_populates="progress")

class Certificate(Base):
    __tablename__ = 'certificates'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    certificate_url = Column(String)

class Achievement(Base):
    __tablename__ = 'achievements'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    description = Column(String)
    icon = Column(String)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())
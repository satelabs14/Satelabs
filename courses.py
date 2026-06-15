from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("/", response_model=List[schemas.CourseList])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@router.get("/{course_id}", response_model=schemas.CourseDetail)
def get_course_detail(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id, 
        models.Enrollment.user_id == current_user.id
    ).first()
    
    # Attach user-specific progress to the response dynamically
    course_dict = course.__dict__.copy()
    course_dict['is_enrolled'] = bool(enrollment)
    course_dict['progress'] = enrollment.progress if enrollment else []
    course_dict['modules'] = course.modules
    
    return course_dict

@router.post("/{course_id}/enroll")
def enroll_in_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    existing = db.query(models.Enrollment).filter_by(user_id=current_user.id, course_id=course_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
        
    enrollment = models.Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    return {"message": "Successfully enrolled in course", "course_id": course_id}

@router.post("/modules/{module_id}/complete")
def complete_module(module_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    enrollment = db.query(models.Enrollment).filter_by(user_id=current_user.id, course_id=module.course_id).first()
    if not enrollment:
        raise HTTPException(status_code=400, detail="Must be enrolled to complete modules")
        
    progress = db.query(models.Progress).filter_by(enrollment_id=enrollment.id, module_id=module_id).first()
    
    if progress and progress.completed:
        return {"message": "Module already completed"}
        
    if not progress:
        progress = models.Progress(enrollment_id=enrollment.id, module_id=module_id, completed=True, completed_at=datetime.utcnow())
        db.add(progress)
    else:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        
    # Award XP
    if hasattr(current_user, 'points'):
        current_user.points += module.xp_reward
    else:
        current_user.xp += module.xp_reward
    
    # Check Course Completion
    total_modules = db.query(models.Module).filter_by(course_id=module.course_id).count()
    completed_modules = db.query(models.Progress).filter_by(enrollment_id=enrollment.id, completed=True).count()
    
    if completed_modules >= total_modules:
        enrollment.completed = True
        enrollment.completed_at = datetime.utcnow()
        
        # Award Certificate
        cert = models.Certificate(user_id=current_user.id, course_id=module.course_id, certificate_url=f"/certs/{current_user.id}-{module.course_id}.pdf")
        db.add(cert)
        
        # Award Achievement
        achievement = models.Achievement(user_id=current_user.id, title=f"Graduated: {module.course.title}", icon="🎓")
        db.add(achievement)
        
    db.commit()
    
    return {
        "message": "Module completed",
        "xp_earned": module.xp_reward,
        "course_completed": enrollment.completed
    }
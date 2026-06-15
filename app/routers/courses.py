from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app import models, schemas
from app.dependencies import get_current_user, get_db
from app.utils import calculate_rank, generate_certificate_code

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


# ── List all courses ──────────────────────────────────────────────────────────
@router.get("/", response_model=list[schemas.CourseWithProgress])
def get_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List all courses with user progress."""
    courses = db.query(models.Course).all()
    result = []
    
    for course in courses:
        # Get total modules
        modules = db.query(models.Module).filter(models.Module.course_id == course.id).all()
        total_modules = len(modules)
        
        # Get completed modules
        completed = db.query(models.ModuleProgress).filter(
            models.ModuleProgress.user_id == current_user.id,
            models.ModuleProgress.module_id.in_([m.id for m in modules]),
            models.ModuleProgress.completed == True
        ).count()
        
        progress = (completed / total_modules * 100) if total_modules > 0 else 0
        
        # Get module details
        module_list = []
        for module in modules:
            module_completed = db.query(models.ModuleProgress).filter(
                models.ModuleProgress.user_id == current_user.id,
                models.ModuleProgress.module_id == module.id,
                models.ModuleProgress.completed == True
            ).first()
            
            module_list.append(schemas.ModuleOut(
                id=module.id,
                course_id=module.course_id,
                title=module.title,
                content=module.content,
                points=module.points,
                completed=module_completed is not None
            ))
        
        result.append(schemas.CourseWithProgress(
            id=course.id,
            title=course.title,
            description=course.description,
            points=course.points,
            total_modules=total_modules,
            completed_modules=completed,
            progress_percentage=int(progress),
            modules=module_list
        ))
    
    return result


# ── Get course details ────────────────────────────────────────────────────────
@router.get("/{course_id}", response_model=schemas.CourseWithProgress)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get course details with modules and user progress."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules = db.query(models.Module).filter(models.Module.course_id == course_id).all()
    total_modules = len(modules)
    
    completed = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.module_id.in_([m.id for m in modules]),
        models.ModuleProgress.completed == True
    ).count()
    
    progress = (completed / total_modules * 100) if total_modules > 0 else 0
    
    module_list = []
    for module in modules:
        module_completed = db.query(models.ModuleProgress).filter(
            models.ModuleProgress.user_id == current_user.id,
            models.ModuleProgress.module_id == module.id,
            models.ModuleProgress.completed == True
        ).first()
        
        module_list.append(schemas.ModuleOut(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            content=module.content,
            points=module.points,
            completed=module_completed is not None
        ))
    
    return schemas.CourseWithProgress(
        id=course.id,
        title=course.title,
        description=course.description,
        points=course.points,
        total_modules=total_modules,
        completed_modules=completed,
        progress_percentage=int(progress),
        modules=module_list
    )


# ── Complete module ───────────────────────────────────────────────────────────
@router.post("/modules/{module_id}/complete", response_model=schemas.ModuleCompletionResponse)
def complete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark a module as completed and award XP."""
    
    # Verify module exists
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check if already completed
    existing = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.module_id == module_id
    ).first()
    
    if existing and existing.completed:
        raise HTTPException(
            status_code=400,
            detail="Module already completed"
        )
    
    # Mark module as completed
    if existing:
        existing.completed = True
    else:
        progress = models.ModuleProgress(
            user_id=current_user.id,
            module_id=module_id,
            completed=True
        )
        db.add(progress)
    
    # Award XP
    xp_earned = module.points
    current_user.xp += xp_earned
    
    # Update rank
    new_rank = calculate_rank(current_user.xp)
    current_user.rank = new_rank
    
    # Update course progress
    course_id = module.course_id
    modules_in_course = db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).all()
    
    completed_count = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.module_id.in_([m.id for m in modules_in_course]),
        models.ModuleProgress.completed == True
    ).count()
    
    progress_percentage = (completed_count / len(modules_in_course) * 100) if modules_in_course else 0
    
    # Update or create UserProgress
    user_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()
    
    if user_progress:
        user_progress.progress_percentage = int(progress_percentage)
        if progress_percentage == 100:
            user_progress.completed = True
    else:
        user_progress = models.UserProgress(
            user_id=current_user.id,
            course_id=course_id,
            progress_percentage=int(progress_percentage),
            completed=progress_percentage == 100
        )
        db.add(user_progress)
    
    # Generate certificate if course is 100% complete
    if progress_percentage == 100:
        existing_cert = db.query(models.Certificate).filter(
            models.Certificate.user_id == current_user.id,
            models.Certificate.course_id == course_id
        ).first()
        
        if not existing_cert:
            certificate = models.Certificate(
                user_id=current_user.id,
                course_id=course_id,
                certificate_code=generate_certificate_code()
            )
            db.add(certificate)
            current_user.courses_completed += 1
    
    db.commit()
    db.refresh(current_user)
    
    return schemas.ModuleCompletionResponse(
        message="Module completed successfully",
        xp_earned=xp_earned,
        new_xp_total=current_user.xp,
        new_rank=current_user.rank,
        progress_percentage=int(progress_percentage)
    )


# ── Create course (admin only) ────────────────────────────────────────────────
@router.post("/", response_model=schemas.CourseWithProgress, status_code=201)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new course (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    new_course = models.Course(
        title=course.title,
        description=course.description,
        points=course.points
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return schemas.CourseWithProgress(
        id=new_course.id,
        title=new_course.title,
        description=new_course.description,
        points=new_course.points,
        total_modules=0,
        completed_modules=0,
        progress_percentage=0,
        modules=[]
    )

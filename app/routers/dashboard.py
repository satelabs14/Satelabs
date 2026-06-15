from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.dependencies import get_current_user, get_db
from app import models, schemas

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ── Dashboard home ───────────────────────────────────────────────────────────
@router.get("/")
def dashboard(current_user: models.User = Depends(get_current_user)):
    """Get basic dashboard info."""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "xp": current_user.xp,
        "rank": current_user.rank,
        "courses_completed": current_user.courses_completed,
        "labs_completed": current_user.labs_completed,
        "points": current_user.points
    }


# ── Dashboard stats ──────────────────────────────────────────────────────────
@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics."""
    
    # Count completed modules
    completed_modules = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.completed == True
    ).count()
    
    # Get active courses (in progress)
    active_courses_query = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.completed == False,
        models.UserProgress.progress_percentage > 0
    ).all()
    
    active_courses = len(active_courses_query)
    
    # Get certificates
    certificates_count = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).count()
    
    # Get all courses with progress
    all_courses = db.query(models.Course).all()
    courses_with_progress = []
    
    for course in all_courses:
        modules = db.query(models.Module).filter(models.Module.course_id == course.id).all()
        total_modules = len(modules)
        
        if total_modules == 0:
            continue
        
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
        
        courses_with_progress.append(schemas.CourseWithProgress(
            id=course.id,
            title=course.title,
            description=course.description,
            points=course.points,
            total_modules=total_modules,
            completed_modules=completed,
            progress_percentage=int(progress),
            modules=module_list
        ))
    
    return schemas.DashboardStats(
        current_xp=current_user.xp,
        current_rank=current_user.rank,
        completed_modules=completed_modules,
        active_courses=active_courses,
        completed_courses=current_user.courses_completed,
        completed_labs=current_user.labs_completed,
        certificates_earned=certificates_count,
        courses=courses_with_progress
    )


# ── Leaderboard ──────────────────────────────────────────────────────────────
@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Get leaderboard sorted by XP."""
    users = db.query(models.User).order_by(desc(models.User.xp)).limit(limit).all()
    
    result = []
    for idx, user in enumerate(users, 1):
        result.append(schemas.LeaderboardEntry(
            rank=idx,
            username=user.username,
            xp=user.xp,
            user_rank=user.rank
        ))
    
    return result


# ── Profile endpoint ────────────────────────────────────────────────────────
@router.get("/profile", response_model=schemas.UserOut)
def profile(current_user: models.User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user

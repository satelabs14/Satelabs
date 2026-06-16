from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List
from app.dependencies import get_current_user, get_db
from app import models, schemas
from app.utils import get_next_rank_details

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
        "rank": current_user.rank,
        "courses_completed": current_user.courses_completed,
        "labs_completed": current_user.labs_completed,
        "points": current_user.points
    }


@router.get("")
def dashboard_no_slash(current_user: models.User = Depends(get_current_user)):
    """Get basic dashboard info without relying on redirect-slash behavior."""
    return dashboard(current_user)


# ── Dashboard stats ──────────────────────────────────────────────────────────
@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics."""

    completed_modules_count = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.completed == True
    ).count()

    certificates_count = db.query(models.Certificate).filter(
        models.Certificate.user_id == current_user.id
    ).count()

    certificate_course_count = db.query(models.Certificate.course_id).filter(
        models.Certificate.user_id == current_user.id
    ).distinct().count()

    user_progress_records = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
    ).all()

    completed_progress_courses = sum(1 for p in user_progress_records if p.completed or p.progress_percentage >= 100)
    completed_courses = max(current_user.courses_completed or 0, completed_progress_courses, certificate_course_count)
    active_courses = sum(1 for p in user_progress_records if not p.completed and p.progress_percentage > 0)
    progress_percentages = [p.progress_percentage for p in user_progress_records if p.progress_percentage > 0]
    overall_progress = sum(progress_percentages) // len(progress_percentages) if progress_percentages else 0
    leaderboard_position = db.query(func.count(models.User.id)).filter(
        models.User.points > current_user.points
    ).scalar() + 1

    return schemas.DashboardStats(
        points=current_user.points,
        rank=current_user.rank,
        completed_modules=completed_modules_count,
        active_courses=active_courses,
        completed_courses=completed_courses,
        completed_labs=current_user.labs_completed,
        certificates_earned=certificates_count,
        leaderboard_position=leaderboard_position,
        overall_progress=overall_progress,
        courses=[] # Keep this endpoint fast; courses are fetched separately
    )


# ── Leaderboard ──────────────────────────────────────────────────────────────
@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Get leaderboard sorted by points."""
    users = db.query(models.User).order_by(desc(models.User.points)).limit(limit).all()

    result = []
    for idx, user in enumerate(users, 1):
        result.append(schemas.LeaderboardEntry(
            rank=idx,
            username=user.username,
            points=user.points,
            user_rank=user.rank,
            profile_image=user.profile_image
        ))

    return result


# ── Profile endpoint ────────────────────────────────────────────────────────
@router.get("/profile", response_model=schemas.UserOut)
def profile(current_user: models.User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


# ── Rank Progression ─────────────────────────────────────────────────────────
@router.get("/rank-progress", response_model=schemas.RankProgressOut)
def get_rank_progress(current_user: models.User = Depends(get_current_user)):
    """Get user's rank progression details."""
    return get_next_rank_details(current_user.points)


# ── Activity Feed ────────────────────────────────────────────────────────────
@router.get("/activity", response_model=List[schemas.ActivityOut])
def get_activity_feed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = 15
):
    """Get recent user activity."""
    activities = db.query(models.Activity).filter(
        models.Activity.user_id == current_user.id
    ).order_by(desc(models.Activity.timestamp)).limit(limit).all()
    return activities

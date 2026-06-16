from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_db
from app import models

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/")
def dashboard(current_user=Depends(get_current_user)):
    return {
    "username": current_user.username,
    "email": current_user.email,
    "courses_completed": current_user.courses_completed,
    "labs_completed": current_user.labs_completed,
    "points": current_user.points
}

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):

    users = (
        db.query(models.User)
        .order_by(models.User.points.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "username": user.username,
            "points": user.points
        }
        for user in users
    ]

@router.get("/profile")
def profile(
    current_user = Depends(get_current_user)
):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "courses_completed": current_user.courses_completed,
        "labs_completed": current_user.labs_completed,
        "points": current_user.points
    }

@router.get("/badges")
def get_badges(
    current_user = Depends(get_current_user)
):
    badges = []

    if current_user.courses_completed >= 1:
        badges.append("Cyber Rookie")

    if current_user.courses_completed >= 5:
        badges.append("Security Explorer")

    if current_user.labs_completed >= 10:
        badges.append("Lab Master")

    if current_user.points >= 100:
        badges.append("Ethical Hacker")

    if current_user.points >= 500:
        badges.append("Cyber Warrior")

    return {
        "username": current_user.username,
        "badges": badges
    }

@router.get("/stats")
def stats(db: Session = Depends(get_db)):

    total_users = db.query(models.User).count()
    total_courses = db.query(models.Course).count()
    total_labs = db.query(models.Lab).count()

    total_points_awarded = (
        db.query(models.User)
        .with_entities(models.User.points)
        .all()
    )

    points_sum = sum(point[0] for point in total_points_awarded)

    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_labs": total_labs,
        "total_points_awarded": points_sum
    }
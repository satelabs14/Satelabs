from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.database import SessionLocal
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.CourseOut)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db)
):
    new_course = models.Course(
        title=course.title,
        description=course.description,
        points=course.points
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course


@router.get("/", response_model=list[schemas.CourseOut])
def get_courses(
    db: Session = Depends(get_db)
):
    return db.query(models.Course).all()


@router.post("/{course_id}/start")
def start_course(
    course_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(
        models.Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()

    if existing:
        return {
            "message": "Course already started"
        }

    progress = models.UserProgress(
        user_id=current_user.id,
        course_id=course_id,
        progress_percentage=0,
        completed=False
    )

    db.add(progress)
    db.commit()

    return {
        "message": "Course started successfully"
    }


@router.put("/{course_id}/progress/{percentage}")
def update_progress(
    course_id: int,
    percentage: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Course not started"
        )

    progress.progress_percentage = percentage

    if percentage >= 100:
        progress.progress_percentage = 100
        progress.completed = True

    db.commit()

    return {
        "course_id": course_id,
        "progress": progress.progress_percentage,
        "completed": progress.completed
    }


@router.post("/{course_id}/complete")
def complete_course(
    course_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(
        models.Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=400,
            detail="Start the course first"
        )

    if progress.progress_percentage < 100:
        raise HTTPException(
            status_code=400,
            detail="Course not completed yet"
        )

    user = db.query(models.User).filter(
        models.User.id == current_user.id
    ).first()

    existing_certificate = db.query(
        models.Certificate
    ).filter(
        models.Certificate.user_id == user.id,
        models.Certificate.course_id == course_id
    ).first()

    if existing_certificate:
        return {
            "message": "Course already completed",
            "certificate_code": existing_certificate.certificate_code
        }

    user.courses_completed += 1
    user.points += course.points

    certificate = models.Certificate(
        user_id=user.id,
        course_id=course_id,
        certificate_code=str(uuid.uuid4())[:8].upper()
    )

    db.add(certificate)
    db.commit()

    db.refresh(user)
    db.refresh(certificate)

    return {
        "message": "Course completed successfully",
        "points_earned": course.points,
        "total_points": user.points,
        "courses_completed": user.courses_completed,
        "certificate_generated": True,
        "certificate_code": certificate.certificate_code
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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

    # Re-attach user to current session
    user = db.query(models.User).filter(
        models.User.id == current_user.id
    ).first()

    user.courses_completed += 1
    user.points += course.points

    db.commit()
    db.refresh(user)  # ensures updated values are loaded

    return {
        "message": "Course completed successfully",
        "points_earned": course.points,
        "total_points": user.points,
        "courses_completed": user.courses_completed
    }


@router.get("/", response_model=list[schemas.CourseOut])
def get_courses(
    db: Session = Depends(get_db)
):
    return db.query(models.Course).all()
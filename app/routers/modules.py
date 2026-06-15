from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, require_admin, get_db

router = APIRouter(
    prefix="/modules",
    tags=["Modules"]
)

@router.post("/")
def create_module(
    module: schemas.ModuleCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_module = models.Module(
        course_id=module.course_id,
        title=module.title,
        content=module.content,
        points=module.points
    )

    db.add(new_module)
    db.commit()
    db.refresh(new_module)

    return new_module

@router.get("/{course_id}")
def get_modules(
    course_id: int,
    db: Session = Depends(get_db)
):
    modules = db.query(models.Module).filter(
        models.Module.course_id == course_id
    ).all()

    return modules

@router.post("/{module_id}/complete")
def complete_module(
    module_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    module = db.query(models.Module).filter(
        models.Module.id == module_id
    ).first()

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found"
        )

    existing = db.query(models.ModuleProgress).filter(
        models.ModuleProgress.user_id == current_user.id,
        models.ModuleProgress.module_id == module_id
    ).first()

    if existing:
        return {
            "message": "Module already completed"
        }

    progress = models.ModuleProgress(
        user_id=current_user.id,
        module_id=module_id,
        completed=True
    )

    db.add(progress)

    user = db.query(models.User).filter(
        models.User.id == current_user.id
    ).first()

    user.points += module.points

    db.commit()

    return {
        "message": "Module completed",
        "points_earned": module.points,
        "total_points": user.points
    }
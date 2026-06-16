from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db, get_current_user
from app.utils import calculate_rank

router = APIRouter(
    prefix="/labs",
    tags=["Labs"]
)


@router.get("/", response_model=list[schemas.LabOut])
def get_labs(db: Session = Depends(get_db)):
    return db.query(models.Lab).all()


@router.post("/", response_model=schemas.LabOut)
def create_lab(
    lab: schemas.LabCreate,
    db: Session = Depends(get_db)
):
    new_lab = models.Lab(
        title=lab.title,
        description=lab.description,
        difficulty=lab.difficulty,
        points=lab.points,
        module_id=lab.module_id
    )

    db.add(new_lab)
    db.commit()
    db.refresh(new_lab)

    return new_lab


@router.get("/{lab_id}", response_model=schemas.LabOut)
def get_lab(
    lab_id: int,
    db: Session = Depends(get_db)
):
    lab = db.query(models.Lab).filter(
        models.Lab.id == lab_id
    ).first()

    if not lab:
        raise HTTPException(
            status_code=404,
            detail="Lab not found"
        )

    return lab


@router.get("/module/{module_id}", response_model=list[schemas.LabOut])
def get_labs_by_module(
    module_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.Lab).filter(
        models.Lab.module_id == module_id
    ).all()


@router.post("/{lab_id}/complete")
def complete_lab(
    lab_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lab = db.query(models.Lab).filter(
        models.Lab.id == lab_id
    ).first()

    if not lab:
        raise HTTPException(
            status_code=404,
            detail="Lab not found"
        )

    existing_progress = db.query(
        models.LabProgress
    ).filter(
        models.LabProgress.user_id == current_user.id,
        models.LabProgress.lab_id == lab_id
    ).first()

    if existing_progress:
        raise HTTPException(
            status_code=400,
            detail="Lab already completed"
        )

    progress = models.LabProgress(
        user_id=current_user.id,
        lab_id=lab_id,
        completed=True
    )

    db.add(progress)

    current_user.labs_completed += 1
    current_user.points += lab.points
    current_user.rank = calculate_rank(current_user.points)

    db.commit()

    return {
        "message": "Lab completed successfully",
        "points_earned": lab.points,
        "total_points": current_user.points,
        "new_rank": current_user.rank
    }

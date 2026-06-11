from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_db
from fastapi import HTTPException
from app.dependencies import get_current_user

router = APIRouter()


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
        points=lab.points
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
    return db.query(models.Lab).filter(
        models.Lab.id == lab_id
    ).first()

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

    current_user.labs_completed += 1
    current_user.points += lab.points

    db.commit()

    return {
        "message": "Lab completed successfully",
        "points_earned": lab.points,
        "total_points": current_user.points
    }
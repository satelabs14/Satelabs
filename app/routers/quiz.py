from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, require_admin, get_db

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"]
)

@router.post("/")
def create_quiz(
    quiz: schemas.QuizCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    new_quiz = models.Quiz(**quiz.model_dump())

    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return new_quiz

@router.get("/{module_id}")
def get_quizzes(
    module_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.Quiz).filter(
        models.Quiz.module_id == module_id
    ).all()

@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int, 
    payload: schemas.QuizSubmit, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # 1. Quiz question tracking
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # 2. String comparison using strip() and lower() to avoid formatting mismatch
    user_answer = payload.answer.strip().lower()
    correct_db_answer = quiz.correct_answer.strip().lower()
    
    if user_answer == correct_db_answer:
        # Fetch fresh user instance from db context
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        user.points += quiz.points
        db.commit()
        
        return {
            "correct": True, 
            "points_earned": quiz.points, 
            "total_points": user.points
        }
        
    return {
        "correct": False, 
        "points_earned": 0,
        "hint": f"Your answer: '{payload.answer}', did not match."  # Debugging help
    }
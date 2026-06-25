from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.dependencies import get_current_user, require_admin, get_db
from app.utils import calculate_rank

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

@router.get("", response_model=list[schemas.QuizOut])
def get_all_quizzes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Quiz).all()

@router.get(
    "/{quiz_id}/questions",
    response_model=list[schemas.QuizQuestionOut]
)
def get_questions(
    quiz_id: int,
    db: Session = Depends(get_db)
):
    return db.query(
        models.QuizQuestion
    ).filter(
        models.QuizQuestion.quiz_id == quiz_id
    ).all()

@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    payload: schemas.QuizSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    score = 0
    total = len(payload.answers)

    review = []

    for item in payload.answers:

        question = db.query(
            models.QuizQuestion
        ).filter(
            models.QuizQuestion.id == item.question_id
        ).first()

        if not question:
            continue

        is_correct = (
            item.answer.lower().strip()
            ==
            question.correct_answer.lower().strip()
        )

        review.append({
            "question": question.question,
            "your_answer": item.answer,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct
        })

        if is_correct:
            score += 1

    percentage = (score / total) * 100 if total > 0 else 0

    passed = percentage >= 70

    points_earned = 0

    existing_progress = db.query(
        models.QuizProgress
    ).filter(
        models.QuizProgress.user_id == current_user.id,
        models.QuizProgress.quiz_id == quiz_id
    ).first()

    first_attempt = existing_progress is None

    if passed and first_attempt:

        quiz = db.query(
            models.Quiz
        ).filter(
            models.Quiz.id == quiz_id
        ).first()

        if quiz:

            points_earned = quiz.points

            current_user.points += points_earned

            current_user.rank = calculate_rank(
                current_user.points
            )

    if first_attempt:

        progress = models.QuizProgress(
            user_id=current_user.id,
            quiz_id=quiz_id,
            score=score,
            passed=passed
        )

        db.add(progress)

    else:

        existing_progress.score = score
        existing_progress.passed = passed

    db.commit()

    return {
        "score": score,
        "total": total,
        "passed": passed,
        "points_earned": points_earned,
        "total_points": current_user.points,
        "review": review,
        "first_attempt": first_attempt
    }

@router.post("/question")
def create_question(
    question: schemas.QuizQuestionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):

    new_question = models.QuizQuestion(
        **question.model_dump()
    )

    db.add(new_question)

    db.commit()

    db.refresh(new_question)

    return new_question

@router.get("/progress/me")
def get_quiz_progress(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = db.query(
        models.QuizProgress
    ).filter(
        models.QuizProgress.user_id == current_user.id
    ).all()

    return progress
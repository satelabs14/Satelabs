from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

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
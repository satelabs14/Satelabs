from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.dependencies import get_db, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── GET /admin/users — list every user ───────────────────────────────────────
@router.get("/users", response_model=List[schemas.AdminUserOut])
def get_all_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),   # ← enforces admin role
):
    return db.query(models.User).all()


# ── GET /admin/users/{user_id} — get one user ────────────────────────────────
@router.get("/users/{user_id}", response_model=schemas.AdminUserOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return user


# ── PATCH /admin/users/{user_id}/role — promote or demote a user ─────────────
@router.patch("/users/{user_id}/role", response_model=schemas.AdminUserOut)
def update_user_role(
    user_id: int,
    new_role: str,                             # ?new_role=admin  or  ?new_role=user
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    if new_role not in ("admin", "user"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'user'",
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role",
        )

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user


# ── DELETE /admin/users/{user_id} — remove a user ────────────────────────────
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    db.delete(user)
    db.commit()
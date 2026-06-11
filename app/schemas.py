from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Auth schemas ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


# ── Token schemas ─────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ── User response schemas ───
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


class AdminUserOut(BaseModel):
    """Richer view shown only to admins."""
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    title: str
    description: str
    points: int


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    points: int

    class Config:
        from_attributes = True

class LabCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    points: int


class LabOut(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    points: int

    class Config:
        from_attributes = True

class Message(BaseModel):
    message: str
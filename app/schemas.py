from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    points: int = 0
    xp: int = 0
    rank: str = "Recruit"
    courses_completed: int = 0
    labs_completed: int = 0

    class Config:
        from_attributes = True


class AdminUserOut(BaseModel):
    """Richer view shown only to admins."""
    id: int
    username: str
    email: str
    role: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    points: int = 0
    xp: int = 0
    rank: str = "Recruit"
    courses_completed: int = 0
    labs_completed: int = 0

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

class Message(BaseModel):
    message: str

class ModuleCreate(BaseModel):
    course_id: int
    title: str
    content: str
    points: int = 10

class QuizCreate(BaseModel):
    module_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    points: int = 5


class QuizOut(BaseModel):
    id: int
    module_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int

    class Config:
        from_attributes = True


class QuizSubmit(BaseModel):
    answer: str

class LabCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    points: int
    module_id: int

class LabOut(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    points: int
    module_id: int

    class Config:
        from_attributes = True
        
class CertificateOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    certificate_code: str
    issued_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    username: str | None = None
    bio: str | None = None


# ── Course and Learning schemas ───────────────────────────────────────────────

class ModuleOut(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    points: int
    completed: bool = False

    class Config:
        from_attributes = True


class CourseWithProgress(BaseModel):
    id: int
    title: str
    description: str
    points: int
    total_modules: int = 0
    completed_modules: int = 0
    progress_percentage: int = 0
    modules: list[ModuleOut] = []

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    xp: int
    user_rank: str

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    current_xp: int
    current_rank: str
    completed_modules: int
    active_courses: int
    completed_courses: int
    completed_labs: int
    certificates_earned: int
    courses: list[CourseWithProgress] = []


class ModuleCompletionResponse(BaseModel):
    message: str
    xp_earned: int
    new_xp_total: int
    new_rank: str
    progress_percentage: int
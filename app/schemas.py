from pydantic import BaseModel, EmailStr
from typing import Optional, List
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
    is_enrolled: bool = False

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    points: int
    user_rank: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class RankProgressOut(BaseModel):
    current_rank: str
    next_rank: Optional[str]
    points_to_next_rank: Optional[int]
    progress_percentage: float


class ActivityOut(BaseModel):
    id: int
    message: str
    timestamp: datetime
    activity_type: str
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    points: int
    rank: str
    completed_modules: int
    active_courses: int
    completed_courses: int
    completed_labs: int
    certificates_earned: int
    leaderboard_position: int
    overall_progress: int = 0
    courses: List[CourseWithProgress] = []


class ModuleCompletionResponse(BaseModel):
    message: str
    points_earned: int
    new_points_total: int
    new_rank: str
    progress_percentage: int

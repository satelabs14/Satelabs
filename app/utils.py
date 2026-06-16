import uuid
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError

SECRET_KEY = "your-super-secret-key"  # Best practice: Move this to environment variables later!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

RANKS = {
    "Recruit": (0, 99),
    "Apprentice": (100, 249),
    "Analyst": (250, 499),
    "Specialist": (500, 999),
    "Expert": (1000, 1999),
    "Elite": (2000, 4999),
    "Legend": (5000, float('inf'))
}

RANK_ORDER = ["Recruit", "Apprentice", "Analyst", "Specialist", "Expert", "Elite", "Legend"]

def calculate_rank(points: int) -> str:
    for rank, (min_points, max_points) in RANKS.items():
        if min_points <= points <= max_points:
            return rank
    return "Legend" # Fallback for points >= 5000

def generate_certificate_code(user_id: int, course_id: int) -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"CERT-{user_id}-{course_id}-{timestamp}"

def get_next_rank_details(points: int):
    current_rank = calculate_rank(points)
    
    try:
        current_rank_index = RANK_ORDER.index(current_rank)
    except ValueError:
        return None # Should not happen if calculate_rank is correct

    if current_rank == "Legend":
        return {
            "current_rank": "Legend",
            "next_rank": None,
            "points_to_next_rank": 0,
            "progress_percentage": 100.0
        }

    next_rank_name = RANK_ORDER[current_rank_index + 1]
    points_for_next_rank = RANKS[next_rank_name][0]
    points_for_current_rank = RANKS[current_rank][0]

    points_in_current_tier = points - points_for_current_rank
    tier_total_points = points_for_next_rank - points_for_current_rank
    
    progress_percentage = (points_in_current_tier / tier_total_points) * 100 if tier_total_points > 0 else 0

    return {
        "current_rank": current_rank,
        "next_rank": next_rank_name,
        "points_to_next_rank": points_for_next_rank - points,
        "progress_percentage": round(progress_percentage, 2)
    }

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
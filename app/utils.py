from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT configuration ─────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a signed JWT access token.
    `data` should contain at least {"sub": username}.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.
    Returns the payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ── Rank calculation ──────────────────────────────────────────────────────────
def calculate_rank(xp: int) -> str:
    """
    Calculate rank based on XP.
    0–100 XP → Recruit
    101–300 XP → Analyst
    301–700 XP → Hunter
    701–1500 XP → Specialist
    1501+ XP → Elite
    """
    if xp < 101:
        return "Recruit"
    elif xp < 301:
        return "Analyst"
    elif xp < 701:
        return "Hunter"
    elif xp < 1501:
        return "Specialist"
    else:
        return "Elite"


# ── Certificate generation ────────────────────────────────────────────────────
def generate_certificate_code() -> str:
    """Generate a unique certificate code."""
    return f"CERT-{uuid.uuid4().hex[:12].upper()}"
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import auth, admin
from app.routers import dashboard
from app.routers.courses import router as courses_router
from app.routers import labs
from app.database import engine
from app import models
from app.routers import modules
from app.routers import quiz
from app.routers import certificates
from fastapi.middleware.cors import CORSMiddleware
from app.routers import profile
from pathlib import Path


models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Satelabs - Cyber Security Learning Platform",
    description="API for learning and practicing cybersecurity skills",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for uploads
upload_dir = Path("uploads")
if upload_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(courses_router)
app.include_router(labs.router)
app.include_router(modules.router)
app.include_router(quiz.router)
app.include_router(certificates.router)
app.include_router(profile.router)

@app.get("/")
def root():
    return {"message": "Welcome to Satelabs 🛡️"}
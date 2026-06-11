from fastapi import FastAPI
from app.routers import auth, admin
from app.routers import dashboard
from app.routers.courses import router as courses_router
from app.routers import labs




app = FastAPI(
    title="Satelabs - Cyber Security Learning Platform",
    description="API for learning and practicing cybersecurity skills",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(courses_router)
app.include_router(
    labs.router,
    prefix="/labs",
    tags=["Labs"]
)

@app.get("/")
def root():
    return {"message": "Welcome to Satelabs 🛡️"}
from fastapi import FastAPI

app = FastAPI(
    title="SateLabs",
    description="Cyber Security Learning Platform",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Welcome to SateLabs 🚀"
    }
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes.resume import router as resume_router
from routes.career import router as career_router
from routes.roadmap import router as roadmap_router
from routes.quiz import router as quiz_router
from routes.progress import router as progress_router
from routes.dashboard import router as dashboard_router
from routes.chat import router as chat_router
from routes.interview import router as interview_router

app = FastAPI(title="VidyaGuide AI API", version="1.0.0")

# Read allowed origins from env var or default to localhost
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router)
app.include_router(career_router)
app.include_router(roadmap_router)
app.include_router(quiz_router)
app.include_router(progress_router)
app.include_router(dashboard_router)
app.include_router(chat_router)
app.include_router(interview_router)


@app.get("/")
def root():
    return {"status": "VidyaGuide AI backend running"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)

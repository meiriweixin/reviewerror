from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.routers import auth, questions, stats, usage

load_dotenv()

app = FastAPI(
    title="Student Review API",
    description="AI-powered Student Review Application API",
    version="1.0.0"
)

# CORS Configuration
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory (only used as fallback if Supabase Storage fails)
# NOTE: Images are now stored in Supabase Storage for persistence on Railway
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files (fallback for local development)
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(questions.router, prefix="/questions", tags=["Questions"])
app.include_router(stats.router, prefix="/stats", tags=["Statistics"])
app.include_router(usage.router, prefix="/usage", tags=["Usage"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Supabase client is initialized in supabase_db_service.py
    print("✅ Application started successfully")

@app.get("/")
async def root():
    return {
        "message": "Student Review API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

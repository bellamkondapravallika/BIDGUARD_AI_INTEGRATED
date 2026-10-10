import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine, Base
import app.models  # load all models for metadata creation

# Routers
from app.routers import (
    auth,
    profile,
    dashboard,
    bids,
    documents,
    analysis,
    risks,
    evidence,
    reports,
    audit,
    notifications,
    demo,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bidguard")

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = ROOT / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", exc)
    
    # Ensure storage folders exist
    Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
    (Path(settings.STORAGE_DIR) / "uploads").mkdir(parents=True, exist_ok=True)
    (Path(settings.STORAGE_DIR) / "reports").mkdir(parents=True, exist_ok=True)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BIDGUARD AI — AI-Powered Procurement Compliance & Assurance System for GeM Public Procurement.",
    lifespan=lifespan,
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(dashboard.router)
app.include_router(bids.router)
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(risks.router)
app.include_router(evidence.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(demo.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected",
        "environment": settings.ENVIRONMENT,
    }


# Serve built React frontend if available
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"message": "BIDGUARD AI API is running. Build frontend with 'npm run build'."}

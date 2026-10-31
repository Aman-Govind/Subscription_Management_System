"""
FastAPI application entry point for the Subscription Management System.

Run with:
    uvicorn app.main:app --reload

The app is intentionally kept free of database connections in Stage 1.
Database integration will be added in Stage 5 once Member 1 delivers the models.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router

# ── Create the FastAPI application ───────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for the Brightloop Subscription Management System. "
        "Handles products, plans, quotations, subscriptions, invoices, payments, "
        "and financial reporting."
    ),
    docs_url="/docs",       # Swagger UI  →  http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc UI    →  http://localhost:8000/redoc
    openapi_url="/openapi.json",
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
# Allows the React frontend (running on a different port) to call this API.
# Origins are read from the ALLOWED_ORIGINS environment variable.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,  # e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, PUT, PATCH, DELETE, OPTIONS
    allow_headers=["*"],       # Authorization, Content-Type, etc.
)

# ── Register Routers ──────────────────────────────────────────────────────────
# Each router is a separate file under app/api/.
# New routers (subscriptions, invoices, etc.) will be added here in later stages.
app.include_router(health_router)

# ── Root redirect (optional convenience) ─────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    """Redirect hint for anyone who hits the bare root URL."""
    return {
        "message": "Welcome to the Subscription Management API",
        "docs": "/docs",
        "health": "/api/health",
    }

"""
FastAPI application entry point for the Subscription Management System.

Run with:
    uvicorn app.main:app --reload

Provides endpoints for:
- Health checks (/api/health)
- Authentication & RBAC (/api/auth)
- Products & Variants CRUD (/api/products)
- Subscription Plans CRUD (/api/plans)
- Tax Configurations & Calculations (/api/taxes)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.plans import router as plans_router
from app.api.products import router as products_router
from app.api.taxes import router as taxes_router
from app.core.config import settings

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
# Routers organized under app/api/ with clean dependency injection.
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(plans_router)
app.include_router(taxes_router)


# ── Root redirect / information ──────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    """Redirect hint for anyone who hits the bare root URL."""
    return {
        "message": f"Welcome to the {settings.APP_NAME}",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/api/health",
        "auth": "/api/auth",
        "products": "/api/products",
        "plans": "/api/plans",
        "taxes": "/api/taxes",
    }

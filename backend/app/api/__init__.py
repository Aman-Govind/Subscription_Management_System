"""API routers package."""

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.plans import router as plans_router
from app.api.products import router as products_router
from app.api.taxes import router as taxes_router

__all__ = [
    "health_router",
    "auth_router",
    "products_router",
    "plans_router",
    "taxes_router",
]

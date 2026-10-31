"""
Health check router.

Provides GET /api/health so load balancers, CI pipelines,
and the React frontend can confirm the API is reachable.
No database connection required — intentional for Stage 1.
"""

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(
    prefix="/api",          # all routes in this file start with /api
    tags=["Health"],        # groups them under "Health" in /docs
)


@router.get(
    "/health",
    summary="Health check",
    description=(
        "Returns a simple JSON payload confirming the API process is running. "
        "No database or external service is contacted."
    ),
    response_description="API is healthy and reachable.",
)
def health_check() -> dict:
    """
    GET /api/health

    Returns:
        200 OK with a JSON body:
        {
            "status": "healthy",
            "message": "Subscription Management API is running",
            "version": "1.0.0"
        }
    """
    return {
        "status": "healthy",
        "message": f"{settings.APP_NAME} is running",
        "version": settings.APP_VERSION,
    }

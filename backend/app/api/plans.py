"""Subscription Plans CRUD API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.plan import Plan
from app.models.product import Product
from app.schemas.plan import (
    PlanCreate,
    PlanResponse,
    PlanUpdate,
)

router = APIRouter(
    prefix="/api/plans",
    tags=["Subscription Plans"],
)


def _serialize_plan(plan: Plan) -> PlanResponse:
    """Helper to convert Plan ORM to response schema with enriched productName."""
    res = PlanResponse.model_validate(plan)
    if plan.product:
        res._product_name = plan.product.name  # type: ignore[attr-defined]
    return res


@router.get(
    "",
    response_model=list[PlanResponse],
    status_code=status.HTTP_200_OK,
    summary="List all subscription plans",
    description="Fetch recurring pricing plans with optional filtering by frequency, product, or status.",
)
def list_plans(
    product_id: int | None = Query(default=None, description="Filter by product ID"),
    billing_frequency: str | None = Query(default=None, description="Filter by frequency: daily, weekly, monthly, yearly"),
    availability: str | None = Query(default=None, description="Filter by availability: active, beta, archived"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    search: str | None = Query(default=None, description="Search term for plan name"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PlanResponse]:
    """Retrieve recurring billing plans."""
    query = db.query(Plan)

    if product_id is not None:
        query = query.filter(Plan.product_id == product_id)
    if billing_frequency:
        query = query.filter(Plan.billing_frequency.ilike(billing_frequency.strip()))
    if availability:
        query = query.filter(Plan.availability.ilike(availability.strip()))
    if is_active is not None:
        query = query.filter(Plan.is_active == is_active)
    if search:
        query = query.filter(Plan.name.ilike(f"%{search.strip()}%"))

    plans = query.order_by(Plan.id.desc()).offset(skip).limit(limit).all()
    return [_serialize_plan(p) for p in plans]


@router.post(
    "",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create subscription plan",
    description="Configure a new recurring billing plan linked to a product (Admin & Staff only).",
)
def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> PlanResponse:
    """Create a new recurring plan."""
    # If product_id specified, verify that the product exists
    if plan_in.product_id is not None:
        product = db.query(Product).filter(Product.id == plan_in.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Associated Product with ID {plan_in.product_id} not found.",
            )

    new_plan = Plan(
        name=plan_in.name.strip(),
        product_id=plan_in.product_id,
        price=plan_in.price,
        billing_frequency=plan_in.billing_frequency.strip().lower(),
        availability=plan_in.availability.strip().lower(),
        notes=plan_in.notes.strip() if plan_in.notes else None,
        is_active=True,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return _serialize_plan(new_plan)


@router.get(
    "/{plan_id}",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Get plan details",
)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
) -> PlanResponse:
    """Retrieve single plan by ID."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription plan with ID {plan_id} not found.",
        )
    return _serialize_plan(plan)


@router.put(
    "/{plan_id}",
    response_model=PlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Update subscription plan",
)
def update_plan(
    plan_id: int,
    plan_update: PlanUpdate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> PlanResponse:
    """Update fields of an existing plan (Admin & Staff only)."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription plan with ID {plan_id} not found.",
        )

    if plan_update.product_id is not None:
        product = db.query(Product).filter(Product.id == plan_update.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Associated Product with ID {plan_update.product_id} not found.",
            )
        plan.product_id = plan_update.product_id

    if plan_update.name is not None:
        plan.name = plan_update.name.strip()
    if plan_update.price is not None:
        plan.price = plan_update.price
    if plan_update.billing_frequency is not None:
        plan.billing_frequency = plan_update.billing_frequency.strip().lower()
    if plan_update.availability is not None:
        plan.availability = plan_update.availability.strip().lower()
    if plan_update.notes is not None:
        plan.notes = plan_update.notes.strip() if plan_update.notes else None
    if plan_update.is_active is not None:
        plan.is_active = plan_update.is_active

    db.commit()
    db.refresh(plan)
    return _serialize_plan(plan)


@router.delete(
    "/{plan_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete subscription plan",
)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin")),
) -> dict[str, object]:
    """Delete a plan (Admin only)."""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription plan with ID {plan_id} not found.",
        )

    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted successfully", "id": plan_id}


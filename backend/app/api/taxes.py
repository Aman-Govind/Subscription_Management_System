"""Tax Configuration and Calculation API router."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.tax import Tax
from app.schemas.tax import (
    TaxCalculationRequest,
    TaxCalculationResponse,
    TaxCreate,
    TaxResponse,
    TaxUpdate,
)

router = APIRouter(
    prefix="/api/taxes",
    tags=["Taxes"],
)

TWO_PLACES = Decimal("0.01")


def _round_curr(val: Decimal) -> Decimal:
    """Round monetary amount to 2 decimal places."""
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@router.get(
    "",
    response_model=list[TaxResponse],
    status_code=status.HTTP_200_OK,
    summary="List all tax rules",
    description="Retrieve configured tax rates and regional applicability.",
)
def list_taxes(
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    country: str | None = Query(default=None, description="Filter by country/region code"),
    search: str | None = Query(default=None, description="Search term for tax name"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[TaxResponse]:
    """Retrieve all configured taxes."""
    query = db.query(Tax)

    if is_active is not None:
        query = query.filter(Tax.is_active == is_active)
    if country:
        query = query.filter(Tax.country.ilike(country.strip()))
    if search:
        query = query.filter(Tax.name.ilike(f"%{search.strip()}%"))

    taxes = query.order_by(Tax.id.desc()).offset(skip).limit(limit).all()
    return [TaxResponse.model_validate(t) for t in taxes]


@router.post(
    "",
    response_model=TaxResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create tax rule",
    description="Add a new tax rate configuration (Admin & Staff only).",
)
def create_tax(
    tax_in: TaxCreate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> TaxResponse:
    """Create a new tax rule."""
    new_tax = Tax(
        name=tax_in.name.strip(),
        rate=tax_in.rate,
        tax_type=tax_in.tax_type.strip().lower(),
        country=tax_in.country.strip() if tax_in.country else None,
        description=tax_in.description.strip() if tax_in.description else None,
        is_inclusive=tax_in.is_inclusive,
        is_active=True,
    )
    db.add(new_tax)
    db.commit()
    db.refresh(new_tax)
    return TaxResponse.model_validate(new_tax)


@router.get(
    "/{tax_id}",
    response_model=TaxResponse,
    status_code=status.HTTP_200_OK,
    summary="Get tax rule details",
)
def get_tax(
    tax_id: int,
    db: Session = Depends(get_db),
) -> TaxResponse:
    """Retrieve details of a single tax rule by ID."""
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax configuration with ID {tax_id} not found.",
        )
    return TaxResponse.model_validate(tax)


@router.put(
    "/{tax_id}",
    response_model=TaxResponse,
    status_code=status.HTTP_200_OK,
    summary="Update tax rule",
)
def update_tax(
    tax_id: int,
    tax_update: TaxUpdate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> TaxResponse:
    """Update fields on an existing tax configuration (Admin & Staff only)."""
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax configuration with ID {tax_id} not found.",
        )

    if tax_update.name is not None:
        tax.name = tax_update.name.strip()
    if tax_update.rate is not None:
        tax.rate = tax_update.rate
    if tax_update.tax_type is not None:
        tax.tax_type = tax_update.tax_type.strip().lower()
    if tax_update.country is not None:
        tax.country = tax_update.country.strip() if tax_update.country else None
    if tax_update.description is not None:
        tax.description = tax_update.description.strip() if tax_update.description else None
    if tax_update.is_inclusive is not None:
        tax.is_inclusive = tax_update.is_inclusive
    if tax_update.is_active is not None:
        tax.is_active = tax_update.is_active

    db.commit()
    db.refresh(tax)
    return TaxResponse.model_validate(tax)


@router.delete(
    "/{tax_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete tax rule",
)
def delete_tax(
    tax_id: int,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin")),
) -> dict[str, object]:
    """Delete a tax rule (Admin only)."""
    tax = db.query(Tax).filter(Tax.id == tax_id).first()
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax configuration with ID {tax_id} not found.",
        )

    db.delete(tax)
    db.commit()
    return {"message": "Tax configuration deleted successfully", "id": tax_id}


@router.post(
    "/calculate",
    response_model=TaxCalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate tax amount",
    description="Utility endpoint to calculate the exact tax amount for a given base amount and tax rule.",
)
def calculate_tax(
    calc_in: TaxCalculationRequest,
    db: Session = Depends(get_db),
) -> TaxCalculationResponse:
    """Calculate tax for invoices, order lines, or subscription quotes."""
    tax = db.query(Tax).filter(Tax.id == calc_in.tax_id).first()
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax configuration with ID {calc_in.tax_id} not found.",
        )

    amount = calc_in.amount
    rate = Decimal(str(tax.rate))

    if tax.tax_type == "percentage":
        if tax.is_inclusive:
            # Inclusive: total is the given amount, tax is extracted
            # total = amount; base = amount / (1 + rate/100)
            divisor = Decimal("1") + (rate / Decimal("100"))
            base_amount = _round_curr(amount / divisor)
            tax_amount = amount - base_amount
            total_amount = amount
        else:
            # Exclusive: tax is added on top of base amount
            base_amount = amount
            tax_amount = _round_curr(base_amount * (rate / Decimal("100")))
            total_amount = base_amount + tax_amount
    else:  # fixed
        if tax.is_inclusive:
            tax_amount = min(rate, amount)
            base_amount = amount - tax_amount
            total_amount = amount
        else:
            base_amount = amount
            tax_amount = rate
            total_amount = base_amount + tax_amount

    return TaxCalculationResponse(
        base_amount=base_amount,
        tax_id=tax.id,
        tax_name=tax.name,
        tax_rate=rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        is_inclusive=tax.is_inclusive,
    )


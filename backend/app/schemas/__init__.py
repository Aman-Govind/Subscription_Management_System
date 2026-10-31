"""Pydantic schemas package for Subscription Management System."""

from app.schemas.plan import (
    PlanBase,
    PlanCreate,
    PlanResponse,
    PlanUpdate,
)
from app.schemas.product import (
    ProductBase,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ProductVariantBase,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)
from app.schemas.tax import (
    TaxBase,
    TaxCalculationRequest,
    TaxCalculationResponse,
    TaxCreate,
    TaxResponse,
    TaxUpdate,
)
from app.schemas.user import (
    TokenPayload,
    TokenResponse,
    UserBase,
    UserCreate,
    UserLogin,
    UserResponse,
    UserRole,
)

__all__ = [
    # User / Auth
    "UserRole",
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "TokenPayload",
    # Products & Variants
    "ProductVariantBase",
    "ProductVariantCreate",
    "ProductVariantUpdate",
    "ProductVariantResponse",
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    # Plans
    "PlanBase",
    "PlanCreate",
    "PlanUpdate",
    "PlanResponse",
    # Taxes
    "TaxBase",
    "TaxCreate",
    "TaxUpdate",
    "TaxResponse",
    "TaxCalculationRequest",
    "TaxCalculationResponse",
]

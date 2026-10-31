"""Pydantic schemas for Subscription Plans."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
)


class PlanBase(BaseModel):
    """Base schema for subscription billing plans."""
    name: str = Field(..., min_length=1, max_length=255)
    product_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("product_id", "productId"),
        description="ID of associated product catalog item",
    )
    price: Decimal = Field(
        default=Decimal("0.00"),
        description="Recurring price amount per billing cadence",
    )
    billing_frequency: str = Field(
        default="monthly",
        validation_alias=AliasChoices("billing_frequency", "billingFrequency"),
        description="Cadence: daily, weekly, monthly, or yearly",
    )
    availability: str = Field(
        default="active",
        description="Plan status: active, beta, or archived",
    )
    notes: str | None = Field(default=None, description="Plan terms and feature descriptions")


class PlanCreate(PlanBase):
    """Payload to create a new subscription plan."""
    product_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("product_name", "productName"),
    )


class PlanUpdate(BaseModel):
    """Payload to update an existing plan."""
    name: str | None = Field(default=None, max_length=255)
    product_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("product_id", "productId"),
    )
    price: Decimal | None = None
    billing_frequency: str | None = Field(
        default=None,
        validation_alias=AliasChoices("billing_frequency", "billingFrequency"),
    )
    availability: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class PlanResponse(BaseModel):
    """Plan serialization returned to clients."""
    id: int
    product_id: int | None = None
    name: str
    price: Decimal
    billing_frequency: str
    availability: str
    subscribers_count: int = 0
    notes: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @computed_field  # type: ignore[misc]
    @property
    def productId(self) -> int | None:
        """CamelCase alias for frontend."""
        return self.product_id

    @computed_field  # type: ignore[misc]
    @property
    def billingFrequency(self) -> str:
        """CamelCase alias for frontend."""
        return self.billing_frequency

    @computed_field  # type: ignore[misc]
    @property
    def subscribersCount(self) -> int:
        """CamelCase alias for frontend."""
        return self.subscribers_count

    @computed_field  # type: ignore[misc]
    @property
    def productName(self) -> str | None:
        """Convenience property for product name."""
        return getattr(self, "_product_name", None)


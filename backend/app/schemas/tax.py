"""Pydantic schemas for Tax Configuration and calculation."""

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


class TaxBase(BaseModel):
    """Base schema for tax configurations."""
    name: str = Field(..., min_length=1, max_length=255, description="Tax name (e.g., GST 18%, VAT 20%)")
    rate: Decimal = Field(..., description="Tax rate percentage (e.g. 18.00 for 18%) or fixed amount")
    tax_type: str = Field(
        default="percentage",
        validation_alias=AliasChoices("tax_type", "type"),
        description="Type of tax rule: 'percentage' or 'fixed'",
    )
    country: str | None = Field(default=None, max_length=100, description="Regional or national code (e.g. IN, US, EU)")
    description: str | None = Field(default=None, description="Detailed tax notes or statutory clause")
    is_inclusive: bool = Field(default=False, description="Whether the tax is already included in catalog prices")


class TaxCreate(TaxBase):
    """Payload to create a new tax configuration."""
    pass


class TaxUpdate(BaseModel):
    """Payload to update an existing tax configuration."""
    name: str | None = Field(default=None, max_length=255)
    rate: Decimal | None = None
    tax_type: str | None = Field(default=None, validation_alias=AliasChoices("tax_type", "type"))
    country: str | None = None
    description: str | None = None
    is_inclusive: bool | None = None
    is_active: bool | None = None


class TaxResponse(BaseModel):
    """Tax configuration serialization."""
    id: int
    name: str
    rate: Decimal
    tax_type: str
    country: str | None = None
    description: str | None = None
    is_inclusive: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @computed_field  # type: ignore[misc]
    @property
    def formattedRate(self) -> str:
        """User-friendly display representation."""
        if self.tax_type == "percentage":
            return f"{self.rate}%"
        return f"₹{self.rate}"


class TaxCalculationRequest(BaseModel):
    """Input payload to calculate tax on an arbitrary invoice or order line amount."""
    amount: Decimal = Field(..., gt=0, description="Base line amount before or including tax")
    tax_id: int = Field(..., description="ID of the configured tax rule to apply")


class TaxCalculationResponse(BaseModel):
    """Result of computing tax according to the rule."""
    base_amount: Decimal
    tax_id: int
    tax_name: str
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    is_inclusive: bool


"""Pydantic schemas for Products and Product Variants."""

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


# ── Product Variant Schemas ──────────────────────────────────────────────────

class ProductVariantBase(BaseModel):
    """Base schema for Product Variant."""
    name: str = Field(..., min_length=1, max_length=255, description="Variant name")
    code: str = Field(..., min_length=1, max_length=100, description="SKU / code for variant")
    additional_price: Decimal = Field(
        default=Decimal("0.00"),
        validation_alias=AliasChoices("additional_price", "additionalPrice"),
        description="Additional price increment for this variant",
    )


class ProductVariantCreate(ProductVariantBase):
    """Payload to create a new product variant."""
    pass


class ProductVariantUpdate(BaseModel):
    """Payload to update an existing variant."""
    name: str | None = Field(default=None, max_length=255)
    code: str | None = Field(default=None, max_length=100)
    additional_price: Decimal | None = Field(
        default=None,
        validation_alias=AliasChoices("additional_price", "additionalPrice"),
    )
    is_active: bool | None = None


class ProductVariantResponse(BaseModel):
    """Variant serialization returned to API consumers."""
    id: int
    product_id: int
    name: str
    code: str
    additional_price: Decimal
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @computed_field  # type: ignore[misc]
    @property
    def additionalPrice(self) -> float:
        """CamelCase alias for frontend compatibility."""
        return float(self.additional_price)


# ── Product Schemas ──────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    """Base product attributes."""
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="SaaS Subscription", max_length=100)
    sales_price: Decimal = Field(
        default=Decimal("0.00"),
        validation_alias=AliasChoices("sales_price", "salesPrice"),
        description="Standard sales price",
    )
    cost_price: Decimal = Field(
        default=Decimal("0.00"),
        validation_alias=AliasChoices("cost_price", "costPrice"),
        description="Cost basis for profitability calculation",
    )
    notes: str | None = Field(default=None, description="Internal notes / service description")


class ProductCreate(ProductBase):
    """Payload to create a new product with optional initial variants."""
    variants: list[ProductVariantCreate] | None = Field(
        default=None,
        description="Optional list of variants to create along with the product",
    )


class ProductUpdate(BaseModel):
    """Payload to update an existing product."""
    name: str | None = Field(default=None, max_length=255)
    type: str | None = Field(default=None, max_length=100)
    sales_price: Decimal | None = Field(
        default=None,
        validation_alias=AliasChoices("sales_price", "salesPrice"),
    )
    cost_price: Decimal | None = Field(
        default=None,
        validation_alias=AliasChoices("cost_price", "costPrice"),
    )
    notes: str | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    """Product serialization with associated variants."""
    id: int
    name: str
    type: str
    sales_price: Decimal
    cost_price: Decimal
    notes: str | None = None
    is_active: bool
    variants: list[ProductVariantResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @computed_field  # type: ignore[misc]
    @property
    def salesPrice(self) -> float:
        """CamelCase alias for frontend compatibility."""
        return float(self.sales_price)

    @computed_field  # type: ignore[misc]
    @property
    def costPrice(self) -> float:
        """CamelCase alias for frontend compatibility."""
        return float(self.cost_price)


"""SQLAlchemy ORM models for the Subscription Management System."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

MONEY = Numeric(10, 2)


def utc_now() -> datetime:
    """Return the current UTC timestamp for application-managed defaults."""
    return datetime.now(timezone.utc)


def database_enum(enum_class: type[PyEnum], name: str) -> Enum:
    """Persist enum values such as active, not Python member names."""
    return Enum(
        enum_class,
        name=name,
        values_callable=lambda values: [member.value for member in values],
    )


class UserRole(str, PyEnum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


class BillingCycle(str, PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, PyEnum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    CLOSED = "closed"


class DiscountType(str, PyEnum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"


class InvoiceStatus(str, PyEnum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PAID = "paid"


# ── User ──────────────────────────────────────────────────────────────────────

class User(Base):
    """Authenticated application user; passwords are stored only as hashes."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        database_enum(UserRole, "user_role"), nullable=False, default=UserRole.CUSTOMER
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # ── Registration / profile columns (API-required) ─────────────────────────
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="customer", passive_deletes=True
    )

    # ── hashed_password alias (auth.py write-through) ────────────────────────
    @property
    def hashed_password(self) -> str:
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value: str) -> None:
        self.password_hash = value


# ── Product ───────────────────────────────────────────────────────────────────

class Product(Base):
    """Catalog product that may have variants and appear on subscription lines."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    sales_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Catalog status / audit columns (API-required) ─────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    subscription_lines: Mapped[list["SubscriptionLine"]] = relationship(
        back_populates="product", passive_deletes=True
    )
    plans: Mapped[list["Plan"]] = relationship(
        back_populates="product", passive_deletes=True
    )


# ── ProductVariant ────────────────────────────────────────────────────────────

class ProductVariant(Base):
    """Optional product configuration with a price addition."""

    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    variant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    price_addition: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)

    # ── API-required columns ───────────────────────────────────────────────────
    code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    product: Mapped["Product"] = relationship(back_populates="variants")
    subscription_lines: Mapped[list["SubscriptionLine"]] = relationship(
        back_populates="variant", passive_deletes=True
    )

    # ── Field aliases (write-through properties for API compatibility) ─────────
    @property
    def name(self) -> str:
        return self.variant_name

    @name.setter
    def name(self, value: str) -> None:
        self.variant_name = value

    @property
    def additional_price(self) -> Decimal:
        return self.price_addition

    @additional_price.setter
    def additional_price(self, value: Decimal) -> None:
        self.price_addition = value


# ── Plan ──────────────────────────────────────────────────────────────────────

class Plan(Base):
    """Reusable subscription pricing and lifecycle configuration."""

    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "products.id",
            name="fk_plans_product_id_products",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    base_cost: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    billing_cycle: Mapped[BillingCycle] = mapped_column(
        database_enum(BillingCycle, "billing_cycle"), nullable=False
    )
    min_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    can_pause: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    auto_close: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── API-required columns ───────────────────────────────────────────────────
    availability: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


    product: Mapped["Product | None"] = relationship(back_populates="plans")
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="plan", passive_deletes=True
    )

    # ── Field aliases (write-through properties for API compatibility) ─────────
    @property
    def price(self) -> Decimal:
        return self.base_cost

    @price.setter
    def price(self, value: Decimal) -> None:
        self.base_cost = value

    @property
    def billing_frequency(self) -> str:
        """Read billing_cycle as a plain string for API serialization."""
        return self.billing_cycle.value if hasattr(self.billing_cycle, "value") else str(self.billing_cycle)

    @billing_frequency.setter
    def billing_frequency(self, value: str) -> None:
        self.billing_cycle = BillingCycle(value)

    @property
    def subscribers_count(self) -> int:
        return len(self.subscriptions) if self.subscriptions else 0

    @property
    def product_name(self) -> str | None:
        return self.product.name if self.product else None


# ── Subscription ──────────────────────────────────────────────────────────────

class Subscription(Base):
    """Customer subscription and its lifecycle state."""

    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    plan_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "plans.id",
            name="fk_subscriptions_plan_id_plans",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        database_enum(SubscriptionStatus, "subscription_status"),
        nullable=False,
        default=SubscriptionStatus.DRAFT,
        index=True,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_billing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_terms: Mapped[str | None] = mapped_column(String(255), nullable=True)

    customer: Mapped["User"] = relationship(back_populates="subscriptions")
    plan: Mapped["Plan | None"] = relationship(back_populates="subscriptions")
    lines: Mapped[list["SubscriptionLine"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan"
    )
    invoices: Mapped[list["Invoice"]] = relationship(
        back_populates="subscription", passive_deletes=True
    )


# ── SubscriptionLine ──────────────────────────────────────────────────────────

class SubscriptionLine(Base):
    """Priced product line belonging to a subscription."""

    __tablename__ = "subscription_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)

    subscription: Mapped["Subscription"] = relationship(back_populates="lines")
    product: Mapped["Product"] = relationship(back_populates="subscription_lines")
    variant: Mapped["ProductVariant | None"] = relationship(
        back_populates="subscription_lines"
    )


# ── TaxRule ───────────────────────────────────────────────────────────────────

class TaxRule(Base):
    """Configured percentage-based or fixed tax rule."""

    __tablename__ = "tax_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    percentage: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # ── API-required columns ───────────────────────────────────────────────────
    tax_type: Mapped[str] = mapped_column(String(50), nullable=False, default="percentage")
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_inclusive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # ── Rate alias: API uses .rate, DB column is .percentage ──────────────────
    @property
    def rate(self) -> Decimal:
        return self.percentage

    @rate.setter
    def rate(self, value: Decimal) -> None:
        self.percentage = value


# ── DiscountRule ──────────────────────────────────────────────────────────────

class DiscountRule(Base):
    """Configured fixed or percentage discount with optional usage cap."""

    __tablename__ = "discount_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type: Mapped[DiscountType] = mapped_column(
        database_enum(DiscountType, "discount_type"), nullable=False
    )
    value: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)


# ── Invoice ───────────────────────────────────────────────────────────────────

class Invoice(Base):
    """Invoice generated for a subscription."""

    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    status: Mapped[InvoiceStatus] = mapped_column(
        database_enum(InvoiceStatus, "invoice_status"),
        nullable=False,
        default=InvoiceStatus.DRAFT,
        index=True,
    )
    subtotal: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    tax_total: Mapped[Decimal] = mapped_column(MONEY, nullable=False, default=0)
    grand_total: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    subscription: Mapped["Subscription"] = relationship(back_populates="invoices")
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="invoice", passive_deletes=True
    )


# ── Payment ───────────────────────────────────────────────────────────────────

class Payment(Base):
    """Recorded invoice payment; no card credentials are stored."""

    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    method: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    invoice: Mapped["Invoice"] = relationship(back_populates="payments")

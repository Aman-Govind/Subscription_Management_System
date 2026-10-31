"""Subscription Plan model for recurring pricing tiers and billing cadences."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Plan(Base):
    """Recurring billing tier configured for a Product (daily, weekly, monthly, yearly)."""

    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(12, 2), default=0.00, nullable=False)
    billing_frequency = Column(String(50), default="monthly", nullable=False)  # daily, weekly, monthly, yearly
    availability = Column(String(50), default="active", nullable=False)  # active, beta, archived
    subscribers_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship back to parent product
    product = relationship("Product", back_populates="plans", lazy="selectin")

    @property
    def product_name(self) -> str | None:
        """Convenience accessor for the associated product name."""
        return self.product.name if self.product else None

    def __repr__(self) -> str:
        return f"<Plan id={self.id} name={self.name!r} frequency={self.billing_frequency!r} price={self.price}>"


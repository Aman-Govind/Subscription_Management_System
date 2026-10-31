"""Tax configuration model for subscription quotations, plans, and invoices."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text

from app.database import Base


class Tax(Base):
    """Tax configuration rule defining rate percentage, regional scope, and inclusive status."""

    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    rate = Column(Numeric(6, 2), nullable=False)  # e.g. 18.00 for 18%
    tax_type = Column(String(50), default="percentage", nullable=False)  # percentage, fixed
    country = Column(String(100), nullable=True)  # e.g. 'IN', 'US', 'EU', 'Global'
    description = Column(Text, nullable=True)
    is_inclusive = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Tax id={self.id} name={self.name!r} rate={self.rate}%>"


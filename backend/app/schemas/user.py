"""Pydantic schemas for authentication and user accounts."""

from __future__ import annotations

import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserRole(str, Enum):
    """Allowed user roles."""
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


def _check_email(v: str) -> str:
    cleaned = v.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email address format.")
    return cleaned


class UserBase(BaseModel):
    """Base schema for user data."""
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: str = Field(..., min_length=3, max_length=255, description="Corporate or personal email address")
    company: str | None = Field(default=None, max_length=255, description="Company / Organization name")
    department: str | None = Field(default=None, max_length=255, description="Department name")
    role: str = Field(default="customer", description="User role: admin, staff, or customer")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _check_email(v)


class UserCreate(BaseModel):
    """Schema for registering a new user."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, description="Plaintext password (min 6 characters)")
    company: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    role: str = Field(default="customer", description="Assigned role: admin, staff, or customer")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _check_email(v)


class UserLogin(BaseModel):
    """Schema for user authentication."""
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return _check_email(v)


class UserResponse(BaseModel):
    """Schema returned for user profile details."""
    id: int
    name: str
    email: str
    company: str | None = None
    department: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT Bearer token response matching the frontend authentication format."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """Decoded JWT payload structure."""
    sub: str | None = None
    email: str | None = None
    role: str | None = None
    exp: int | None = None

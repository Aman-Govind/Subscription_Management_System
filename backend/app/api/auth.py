"""Authentication API router for registration, login, and identity verification."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

VALID_ROLES = {"admin", "staff", "customer", "internal staff", "internal_staff"}


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
    description="Creates a new account with role assignment (Admin, Staff, or Customer) and returns an access token.",
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Register a new enterprise user account."""
    # Normalize email
    normalized_email = user_in.email.strip().lower()

    # Check for existing email
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Normalize role
    raw_role = user_in.role.strip().lower()
    if raw_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_in.role}'. Allowed roles: admin, staff, customer.",
        )
    normalized_role = "staff" if raw_role in ("internal staff", "internal_staff") else raw_role

    # Create user record
    new_user = User(
        name=user_in.name.strip(),
        email=normalized_email,
        hashed_password=hash_password(user_in.password),
        company=user_in.company.strip() if user_in.company else None,
        department=user_in.department.strip() if user_in.department else None,
        role=normalized_role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT
    token_payload = {
        "sub": new_user.email,
        "email": new_user.email,
        "role": new_user.role,
        "id": new_user.id,
    }
    token = create_access_token(token_payload)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate with email and password to receive a JWT access token.",
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate existing user credentials."""
    normalized_email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated.",
        )

    token_payload = {
        "sub": user.email,
        "email": user.email,
        "role": user.role,
        "id": user.id,
    }
    token = create_access_token(token_payload)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return identity of current JWT session bearer."""
    return UserResponse.model_validate(current_user)


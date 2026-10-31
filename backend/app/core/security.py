"""
Security and authentication utilities.

Provides:
- Secure password hashing and verification (PBKDF2-HMAC-SHA256 with bcrypt fallback)
- Standard RFC 7519 JWT token generation and verification
- FastAPI dependencies for JWT authentication and Role-Based Access Control (RBAC)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Sequence

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db

# Try importing bcrypt / passlib if installed, fallback gracefully to PBKDF2
try:
    from passlib.context import CryptContext  # type: ignore
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    _pwd_context = None

# Try importing pyjwt if installed, fallback to pure python RFC 7519
try:
    import jwt as pyjwt  # type: ignore
except Exception:
    pyjwt = None

security_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 260_000


# ── Password Hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password securely using PBKDF2-HMAC-SHA256 or bcrypt."""
    if _pwd_context is not None:
        try:
            return _pwd_context.hash(password)
        except Exception:
            pass

    # Standard library PBKDF2-HMAC-SHA256 with random salt
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    if not hashed_password:
        return False

    if hashed_password.startswith("pbkdf2_sha256$"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 4:
                return False
            _, iterations_str, salt, stored_hash = parts
            iterations = int(iterations_str)
            computed = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            )
            return hmac.compare_digest(computed.hex(), stored_hash)
        except Exception:
            return False

    if _pwd_context is not None:
        try:
            return _pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    return False


# ── JWT Token Generation & Verification ──────────────────────────────────────

def _b64url_encode(data: bytes) -> str:
    """Base64 URL-safe encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    """Base64 URL-safe decode with restored padding."""
    padding = 4 - (len(data) % 4)
    if padding and padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("ascii"))


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": int(expire.timestamp()), "iat": int(now.timestamp())})

    if pyjwt is not None:
        try:
            return pyjwt.encode(to_encode, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)
        except Exception:
            pass

    # Fallback to pure RFC 7519 HMAC-SHA256 JWT
    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_json = json.dumps(to_encode, separators=(",", ":"), sort_keys=True).encode("utf-8")

    unsigned_token = f"{_b64url_encode(header_json)}.{_b64url_encode(payload_json)}"
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        unsigned_token.encode("ascii"),
        hashlib.sha256,
    ).digest()

    return f"{unsigned_token}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token. Raises HTTPException if invalid or expired."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if pyjwt is not None:
        try:
            payload = pyjwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except Exception:
            raise credentials_exception

    # Pure RFC 7519 JWT verification
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise credentials_exception
        header_b64, payload_b64, signature_b64 = parts

        unsigned_token = f"{header_b64}.{payload_b64}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            unsigned_token.encode("ascii"),
            hashlib.sha256,
        ).digest()

        actual_sig = _b64url_decode(signature_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise credentials_exception

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Verify expiration
        exp = payload.get("exp")
        if exp is not None and time.time() > float(exp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception


# ── Role-Based Access Control (RBAC) & Dependencies ─────────────────────────

def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> dict[str, Any]:
    """Extract and validate the JWT token payload from the Authorization header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)


def get_current_user(
    payload: dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
) -> Any:
    """Fetch the active user from the database corresponding to the token subject."""
    # Lazy import to avoid circular dependencies
    from app.models.user import User

    email = payload.get("sub") or payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return user


def require_role(*allowed_roles: str) -> Callable[[Any], Any]:
    """
    Dependency factory that enforces Role-Based Access Control (RBAC).
    Allowed roles can be: 'admin', 'staff', 'customer'.
    """
    normalized_allowed = {r.strip().lower() for r in allowed_roles}
    # Allow 'internal staff' alias for 'staff'
    if "staff" in normalized_allowed:
        normalized_allowed.add("internal staff")
        normalized_allowed.add("internal_staff")

    def role_checker(current_user: Any = Depends(get_current_user)) -> Any:
        _raw_role = getattr(current_user, "role", "")
        # Use .value if it's an enum (avoids str(UserRole.ADMIN) → 'UserRole.ADMIN')
        user_role = (getattr(_raw_role, "value", None) or str(_raw_role)).strip().lower()
        if user_role not in normalized_allowed and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker


def _check_role(user_role: str, allowed_roles: list[str]) -> bool:
    """
    Pure-logic helper exposing the RBAC condition for unit testing.

    Mirrors the exact logic inside require_role's role_checker closure
    WITHOUT requiring a database session or an HTTP request.

    Returns True if the role would be granted, False if it would be denied.
    """
    normalized_allowed = {r.strip().lower() for r in allowed_roles}
    if "staff" in normalized_allowed:
        normalized_allowed.add("internal staff")
        normalized_allowed.add("internal_staff")
    normalized_user = user_role.strip().lower()
    return normalized_user in normalized_allowed or normalized_user == "admin"

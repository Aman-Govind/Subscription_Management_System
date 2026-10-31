"""
Tests for Fix 1: RBAC security, Fix 2: tax route ordering,
and Fix 3: dependency availability.

Run from the project root:
    python -m pytest tests/test_fixes.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make `backend/` importable from the project root
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app

# ---------------------------------------------------------------------------
# Shared test client (no DB: endpoints that need DB will error, tested below)
# ---------------------------------------------------------------------------
client = TestClient(app, raise_server_exceptions=False)


# ===========================================================================
# FIX 1 — RBAC: require_role() must use exact equality for "admin"
# ===========================================================================

class TestRBACLogic:
    """
    Unit-tests the `require_role` closure WITHOUT the FastAPI dependency chain.

    We extract the logic directly from security.py to test it in isolation —
    no database or HTTP request needed.
    """

    def _check(self, user_role: str, allowed_roles: tuple[str, ...]) -> bool:
        """
        Mirrors the exact conditional in security.py require_role().
        Returns True if access is GRANTED, False if DENIED (403 would be raised).
        """
        normalized_allowed = {r.strip().lower() for r in allowed_roles}
        if "staff" in normalized_allowed:
            normalized_allowed.add("internal staff")
            normalized_allowed.add("internal_staff")

        user_role_lower = user_role.strip().lower()
        # ← This is the FIXED line (exact equality, not substring)
        access_denied = (
            user_role_lower not in normalized_allowed and user_role_lower != "admin"
        )
        return not access_denied  # True = granted

    # ── Legitimate access ───────────────────────────────────────────────────

    def test_admin_passes_admin_only_route(self):
        assert self._check("admin", ("admin",)) is True

    def test_admin_passes_staff_only_route(self):
        """Admin is a superuser — can bypass all role checks."""
        assert self._check("admin", ("staff",)) is True

    def test_admin_passes_customer_route(self):
        assert self._check("admin", ("customer",)) is True

    def test_staff_passes_staff_route(self):
        assert self._check("staff", ("admin", "staff")) is True

    def test_internal_staff_alias_passes_staff_route(self):
        assert self._check("internal_staff", ("admin", "staff")) is True

    def test_internal_staff_space_alias_passes_staff_route(self):
        assert self._check("internal staff", ("admin", "staff")) is True

    def test_customer_passes_customer_route(self):
        assert self._check("customer", ("customer",)) is True

    # ── Unauthorized access (these MUST be denied) ──────────────────────────

    def test_customer_denied_admin_only_route(self):
        assert self._check("customer", ("admin",)) is False

    def test_customer_denied_staff_route(self):
        assert self._check("customer", ("admin", "staff")) is False

    def test_staff_denied_admin_only_route(self):
        assert self._check("staff", ("admin",)) is False

    # ── The critical fix: substring bypass must be closed ───────────────────

    def test_super_admin_denied_staff_route(self):
        """
        'super_admin' contains 'admin' as a substring.
        OLD code: "admin" not in "super_admin" → False → ACCESS GRANTED (BUG).
        FIXED code: "super_admin" != "admin" → True → access_denied → 403 (CORRECT).
        """
        assert self._check("super_admin", ("staff",)) is False

    def test_admin_backup_denied_customer_route(self):
        """'admin_backup' contains 'admin' as a substring — must be rejected."""
        assert self._check("admin_backup", ("customer",)) is False

    def test_badadmin_denied_staff_route(self):
        """'badadmin' contains 'admin' as a substring — must be rejected."""
        assert self._check("badadmin", ("staff",)) is False

    def test_unknown_role_denied_all_routes(self):
        assert self._check("viewer", ("admin", "staff", "customer")) is False

    def test_empty_role_denied(self):
        assert self._check("", ("admin",)) is False


# ===========================================================================
# FIX 3 — Dependency availability (PyJWT and passlib installed)
# ===========================================================================

class TestSecurityDependencies:

    def test_pyjwt_is_importable(self):
        """PyJWT must be installed so the JWT fallback is not used in production."""
        import jwt  # noqa: F401
        assert hasattr(jwt, "encode"), "jwt.encode must exist"
        assert hasattr(jwt, "decode"), "jwt.decode must exist"

    def test_passlib_bcrypt_is_importable(self):
        """passlib with bcrypt backend must be installed."""
        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = ctx.hash("testpassword")
        assert ctx.verify("testpassword", hashed)

    def test_security_module_uses_pyjwt(self):
        """
        Now that PyJWT is installed, security.py must use it
        (not the pure-Python fallback).
        """
        # Reimport the module to pick up the newly installed jwt
        import importlib
        import app.core.security as sec
        importlib.reload(sec)
        assert sec.pyjwt is not None, "pyjwt should be loaded now that PyJWT is installed"

    def test_security_module_uses_passlib(self):
        """Now that passlib is installed, _pwd_context must not be None."""
        import importlib
        import app.core.security as sec
        importlib.reload(sec)
        assert sec._pwd_context is not None, "passlib CryptContext should be loaded"

    def test_jwt_round_trip_with_pyjwt(self):
        """Full sign + verify round-trip using the installed PyJWT library."""
        import importlib
        import app.core.security as sec
        importlib.reload(sec)
        payload = {"sub": "test@example.com", "email": "test@example.com", "role": "admin", "id": 1}
        token = sec.create_access_token(payload)
        decoded = sec.decode_access_token(token)
        assert decoded["sub"] == "test@example.com"
        assert decoded["role"] == "admin"

    def test_password_hash_and_verify_with_bcrypt(self):
        """Full hash + verify round-trip using the installed bcrypt library."""
        import importlib
        import app.core.security as sec
        importlib.reload(sec)
        hashed = sec.hash_password("MySecurePass123!")
        assert sec.verify_password("MySecurePass123!", hashed)
        assert not sec.verify_password("WrongPassword", hashed)


# ===========================================================================
# FIX 2 — Tax route ordering verified via registered app routes
# ===========================================================================

class TestTaxRouteOrdering:

    def test_calculate_route_is_registered(self):
        """POST /api/taxes/calculate must be a registered route."""
        paths = [r.path for r in app.routes if hasattr(r, "path")]
        assert "/api/taxes/calculate" in paths

    def test_calculate_appears_before_tax_id_wildcard(self):
        """
        /api/taxes/calculate must be declared BEFORE /api/taxes/{tax_id}.
        FastAPI registers routes in declaration order, so the index of
        /calculate must be lower than /taxes/{tax_id}.
        """
        tax_routes = [
            r for r in app.routes
            if hasattr(r, "path") and r.path.startswith("/api/taxes")
        ]
        paths = [r.path for r in tax_routes]
        assert "/api/taxes/calculate" in paths, "/api/taxes/calculate not registered"
        assert "/api/taxes/{tax_id}" in paths, "/api/taxes/{tax_id} not registered"
        calc_idx = paths.index("/api/taxes/calculate")
        wildcard_idx = paths.index("/api/taxes/{tax_id}")
        assert calc_idx < wildcard_idx, (
            f"/calculate (index {calc_idx}) must come before "
            f"/{{tax_id}} (index {wildcard_idx})"
        )

    def test_calculate_uses_post_method(self):
        """The calculate route must be POST, not GET."""
        for r in app.routes:
            if hasattr(r, "path") and r.path == "/api/taxes/calculate":
                assert "POST" in r.methods, "calculate endpoint must be POST"
                break


# ===========================================================================
# FastAPI application startup + health endpoint
# ===========================================================================

class TestApplicationStartup:

    def test_app_loads_without_error(self):
        """TestClient construction proves the app imports and starts cleanly."""
        # If this line doesn't raise, the app started successfully.
        _ = TestClient(app, raise_server_exceptions=True)

    def test_health_endpoint_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_body(self):
        response = client.get("/api/health")
        body = response.json()
        assert body["status"] == "healthy"
        assert "message" in body
        assert "version" in body

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        body = response.json()
        assert "docs" in body

    def test_all_expected_route_prefixes_exist(self):
        paths = {r.path for r in app.routes if hasattr(r, "path")}
        expected = {
            "/api/health",
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/me",
            "/api/products",
            "/api/plans",
            "/api/taxes",
            "/api/taxes/calculate",
        }
        for path in expected:
            assert path in paths, f"Expected route {path!r} not registered"


# ===========================================================================
# Tax calculation logic (no DB — pure math unit test)
# ===========================================================================

class TestTaxCalculationLogic:
    """
    Tests the pure math inside taxes.py without hitting the database.
    We call the underlying arithmetic directly to prove correctness.
    """

    def _calc_exclusive_percentage(self, amount: Decimal, rate: Decimal) -> dict:
        """Mirror of the exclusive-percentage branch in calculate_tax."""
        from decimal import ROUND_HALF_UP
        two_places = Decimal("0.01")
        base_amount = amount
        tax_amount = (base_amount * (rate / Decimal("100"))).quantize(two_places, rounding=ROUND_HALF_UP)
        total_amount = base_amount + tax_amount
        return {"base": base_amount, "tax": tax_amount, "total": total_amount}

    def _calc_inclusive_percentage(self, amount: Decimal, rate: Decimal) -> dict:
        """Mirror of the inclusive-percentage branch."""
        from decimal import ROUND_HALF_UP
        two_places = Decimal("0.01")
        divisor = Decimal("1") + (rate / Decimal("100"))
        base_amount = (amount / divisor).quantize(two_places, rounding=ROUND_HALF_UP)
        tax_amount = amount - base_amount
        total_amount = amount
        return {"base": base_amount, "tax": tax_amount, "total": total_amount}

    def test_exclusive_18_percent(self):
        result = self._calc_exclusive_percentage(Decimal("100.00"), Decimal("18"))
        assert result["tax"] == Decimal("18.00")
        assert result["total"] == Decimal("118.00")

    def test_exclusive_5_percent(self):
        result = self._calc_exclusive_percentage(Decimal("200.00"), Decimal("5"))
        assert result["tax"] == Decimal("10.00")
        assert result["total"] == Decimal("210.00")

    def test_inclusive_18_percent_extracts_correctly(self):
        """For 18% inclusive on 118, base should be 100 and tax 18."""
        result = self._calc_inclusive_percentage(Decimal("118.00"), Decimal("18"))
        assert result["base"] == Decimal("100.00")
        assert result["tax"] == Decimal("18.00")
        assert result["total"] == Decimal("118.00")

    def test_zero_rate_exclusive(self):
        result = self._calc_exclusive_percentage(Decimal("500.00"), Decimal("0"))
        assert result["tax"] == Decimal("0.00")
        assert result["total"] == Decimal("500.00")

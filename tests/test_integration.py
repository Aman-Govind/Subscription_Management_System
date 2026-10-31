"""
Integration and compatibility tests for the Brightloop Subscription Management System backend.

Covers:
  - Model constructor compatibility (all fields now real mapped columns)
  - SQLAlchemy filter expression correctness (no @property filtering)
  - Schema ↔ model serialization (model_validate round-trips)
  - Auth API endpoints (register, login, me) via TestClient with SQLite
  - Product API endpoints (CRUD + variant CRUD + active filtering)
  - Plan API endpoints (CRUD + billing_frequency / availability / is_active filtering)
  - Tax API endpoints (CRUD + country filter + inclusive/exclusive calculation)
  - Security: RBAC, inactive-user rejection, bad JWT rejection

All HTTP tests use SQLite in-memory via FastAPI dependency override.
No production MySQL credentials are required.
"""

from __future__ import annotations

import sys
from decimal import Decimal
from pathlib import Path

import pytest

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

# ---------------------------------------------------------------------------
# SQLAlchemy in-memory SQLite engine
# ---------------------------------------------------------------------------
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.models  # noqa: F401 – registers all ORM models with Base.metadata

TEST_DATABASE_URL = "sqlite:///./test_integration.db"

TEST_ENGINE = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(
    bind=TEST_ENGINE, autoflush=False, expire_on_commit=False
)


@pytest.fixture(scope="session", autouse=True)
def _db_lifecycle():
    """Create all tables once for the entire session; drop them afterwards."""
    Base.metadata.create_all(TEST_ENGINE)
    yield
    Base.metadata.drop_all(TEST_ENGINE)


@pytest.fixture()
def db():
    """Provide a fresh session for each test; rollback after."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ---------------------------------------------------------------------------
# FastAPI TestClient with SQLite DB override
# ---------------------------------------------------------------------------
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db


def _override_get_db():
    session = TestSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app, raise_server_exceptions=False)


# ===========================================================================
# SECTION 1 — Model constructor compatibility
# ===========================================================================

class TestModelConstructors:
    """Verify all model constructors accept the fields the API passes."""

    def test_user_constructor_with_all_api_fields(self, db):
        from app.models.models import User, UserRole
        u = User(
            email="ctor_alice@test.com",
            password_hash="hashed",
            role=UserRole.CUSTOMER,
            name="Alice",
            company="ACME",
            department="Engineering",
            is_active=True,
        )
        db.add(u)
        db.flush()
        assert u.id is not None
        assert u.name == "Alice"
        assert u.company == "ACME"
        assert u.department == "Engineering"
        assert u.is_active is True

    def test_user_constructor_minimal(self, db):
        from app.models.models import User, UserRole
        u = User(email="ctor_bob@test.com", password_hash="hashed", role=UserRole.STAFF)
        db.add(u)
        db.flush()
        assert u.is_active is True  # default
        assert u.name is None

    def test_tax_constructor_with_all_api_fields(self, db):
        from app.models.models import TaxRule
        t = TaxRule(
            name="ctor_GST 18",
            percentage=Decimal("18.00"),
            tax_type="percentage",
            country="IN",
            description="Standard goods and services tax",
            is_inclusive=False,
            is_active=True,
        )
        db.add(t)
        db.flush()
        assert t.id is not None
        assert t.tax_type == "percentage"
        assert t.country == "IN"
        assert t.is_inclusive is False

    def test_tax_rate_alias(self):
        from app.models.models import TaxRule
        t = TaxRule(name="alias_VAT", percentage=Decimal("20.00"))
        assert t.rate == Decimal("20.00")
        t.rate = Decimal("22.00")
        assert t.percentage == Decimal("22.00")

    def test_plan_constructor_with_all_api_fields(self, db):
        from app.models.models import Plan, BillingCycle
        p = Plan(
            name="ctor_Pro Monthly",
            base_cost=Decimal("49.99"),
            billing_cycle=BillingCycle.MONTHLY,
            availability="active",
            notes="Full feature set",
            is_active=True,
        )
        db.add(p)
        db.flush()
        assert p.id is not None
        assert p.availability == "active"
        assert p.notes == "Full feature set"
        assert p.is_active is True

    def test_plan_price_alias(self):
        from app.models.models import Plan, BillingCycle
        p = Plan(name="alias_Plan", base_cost=Decimal("9.99"), billing_cycle=BillingCycle.WEEKLY)
        assert p.price == Decimal("9.99")
        p.price = Decimal("19.99")
        assert p.base_cost == Decimal("19.99")

    def test_plan_billing_frequency_alias(self):
        from app.models.models import Plan, BillingCycle
        p = Plan(name="freq_Plan", base_cost=Decimal("5.00"), billing_cycle=BillingCycle.MONTHLY)
        assert p.billing_frequency == "monthly"
        p.billing_frequency = "yearly"
        assert p.billing_cycle == BillingCycle.YEARLY

    def test_product_constructor_with_is_active(self, db):
        from app.models.models import Product
        p = Product(
            name="ctor_My SaaS",
            type="SaaS",
            sales_price=Decimal("99.00"),
            cost_price=Decimal("30.00"),
            is_active=True,
        )
        db.add(p)
        db.flush()
        assert p.id is not None
        assert p.is_active is True

    def test_product_variant_constructor_with_code_and_is_active(self, db):
        from app.models.models import Product, ProductVariant
        prod = Product(name="ctor_Widget", type="SaaS", sales_price=Decimal("10"), cost_price=Decimal("2"))
        db.add(prod)
        db.flush()
        v = ProductVariant(
            product_id=prod.id,
            variant_name="Pro",
            price_addition=Decimal("5.00"),
            code="WIDGET-PRO",
            is_active=True,
        )
        db.add(v)
        db.flush()
        assert v.id is not None
        assert v.code == "WIDGET-PRO"
        assert v.is_active is True

    def test_product_variant_name_alias(self, db):
        from app.models.models import Product, ProductVariant
        prod = Product(name="ctor_Service", type="SaaS", sales_price=Decimal("10"), cost_price=Decimal("2"))
        db.add(prod)
        db.flush()
        v = ProductVariant(product_id=prod.id, variant_name="Basic", price_addition=Decimal("0"))
        assert v.name == "Basic"
        v.name = "Advanced"
        assert v.variant_name == "Advanced"

    def test_product_variant_additional_price_alias(self, db):
        from app.models.models import Product, ProductVariant
        prod = Product(name="ctor_Svc2", type="SaaS", sales_price=Decimal("10"), cost_price=Decimal("2"))
        db.add(prod)
        db.flush()
        v = ProductVariant(product_id=prod.id, variant_name="Std", price_addition=Decimal("3.00"))
        assert v.additional_price == Decimal("3.00")
        v.additional_price = Decimal("6.00")
        assert v.price_addition == Decimal("6.00")


# ===========================================================================
# SECTION 2 — SQLAlchemy filter expression correctness
# ===========================================================================

class TestSQLAlchemyFilters:
    """Confirm that all filter expressions use real mapped columns (not @property)."""

    def test_plan_is_active_filter_is_real_column(self):
        from app.models.models import Plan
        expr = Plan.is_active == True  # noqa: E712
        assert not isinstance(expr, bool), (
            "Plan.is_active is still a Python @property — it is not a mapped column"
        )

    def test_plan_availability_filter_has_ilike(self):
        from app.models.models import Plan
        assert hasattr(Plan.availability, "ilike"), (
            "Plan.availability does not have .ilike() — it is not a mapped column"
        )

    def test_plan_billing_cycle_filter_has_ilike(self):
        from app.models.models import Plan
        assert hasattr(Plan.billing_cycle, "ilike"), (
            "Plan.billing_cycle does not have .ilike() — it is not a mapped column"
        )

    def test_tax_is_active_filter_is_real_column(self):
        from app.models.models import TaxRule
        expr = TaxRule.is_active == True  # noqa: E712
        assert not isinstance(expr, bool)

    def test_tax_country_filter_has_ilike(self):
        from app.models.models import TaxRule
        assert hasattr(TaxRule.country, "ilike")

    def test_tax_tax_type_filter_supports_equality(self):
        from app.models.models import TaxRule
        expr = TaxRule.tax_type == "percentage"
        assert not isinstance(expr, bool)

    def test_product_is_active_filter_is_real_column(self):
        from app.models.models import Product
        expr = Product.is_active == True  # noqa: E712
        assert not isinstance(expr, bool)

    def test_user_is_active_filter_is_real_column(self):
        from app.models.models import User
        expr = User.is_active == True  # noqa: E712
        assert not isinstance(expr, bool)

    def test_product_variant_is_active_filter_is_real_column(self):
        from app.models.models import ProductVariant
        expr = ProductVariant.is_active == True  # noqa: E712
        assert not isinstance(expr, bool)


# ===========================================================================
# SECTION 3 — Schema ↔ model serialization
# ===========================================================================

class TestSchemaSerialization:
    """Verify model_validate works for all response schemas."""

    def test_user_response_serializes_correctly(self, db):
        from app.models.models import User, UserRole
        from app.schemas.user import UserResponse
        u = User(
            email="ser_carol@test.com",
            password_hash="hash",
            role=UserRole.ADMIN,
            name="Carol",
            company="Brightloop",
            department="Sales",
            is_active=True,
        )
        db.add(u)
        db.flush()
        resp = UserResponse.model_validate(u)
        assert resp.name == "Carol"
        assert resp.company == "Brightloop"
        assert resp.is_active is True
        assert resp.email == "ser_carol@test.com"

    def test_user_response_does_not_expose_password(self, db):
        from app.models.models import User, UserRole
        from app.schemas.user import UserResponse
        u = User(email="ser_dave@test.com", password_hash="SECRETHASH", role=UserRole.CUSTOMER)
        db.add(u)
        db.flush()
        resp = UserResponse.model_validate(u)
        resp_dict = resp.model_dump()
        # password_hash and hashed_password must NOT appear
        assert "password_hash" not in resp_dict
        assert "hashed_password" not in resp_dict
        # The raw hash value must not be present in the serialized values
        for v in resp_dict.values():
            assert v != "SECRETHASH", f"Password hash leaked in field: {resp_dict}"

    def test_plan_response_serializes_all_new_columns(self, db):
        from app.models.models import Plan, BillingCycle
        from app.schemas.plan import PlanResponse
        p = Plan(
            name="ser_Full Plan",
            base_cost=Decimal("29.99"),
            billing_cycle=BillingCycle.MONTHLY,
            availability="active",
            notes="Trial terms apply",
            is_active=True,
        )
        db.add(p)
        db.flush()
        resp = PlanResponse.model_validate(p)
        assert resp.availability == "active"
        assert resp.notes == "Trial terms apply"
        assert resp.is_active is True
        assert resp.price == Decimal("29.99")
        assert resp.billing_frequency == "monthly"
        assert resp.updated_at is not None

    def test_tax_response_serializes_all_new_columns(self, db):
        from app.models.models import TaxRule
        from app.schemas.tax import TaxResponse
        t = TaxRule(
            name="ser_IGST",
            percentage=Decimal("12.00"),
            tax_type="percentage",
            country="IN",
            description="Integrated GST",
            is_inclusive=True,
            is_active=True,
        )
        db.add(t)
        db.flush()
        resp = TaxResponse.model_validate(t)
        assert resp.tax_type == "percentage"
        assert resp.country == "IN"
        assert resp.is_inclusive is True
        assert resp.rate == Decimal("12.00")
        assert resp.updated_at is not None

    def test_product_response_serializes_is_active_and_timestamps(self, db):
        from app.models.models import Product
        from app.schemas.product import ProductResponse
        p = Product(name="ser_App X", type="SaaS", sales_price=Decimal("50"), cost_price=Decimal("10"))
        db.add(p)
        db.flush()
        resp = ProductResponse.model_validate(p)
        assert resp.is_active is True
        assert resp.created_at is not None
        assert resp.updated_at is not None

    def test_product_variant_response_serializes_code_and_is_active(self, db):
        from app.models.models import Product, ProductVariant
        from app.schemas.product import ProductVariantResponse
        prod = Product(name="ser_PlatformY", type="SaaS", sales_price=Decimal("100"), cost_price=Decimal("20"))
        db.add(prod)
        db.flush()
        v = ProductVariant(
            product_id=prod.id,
            variant_name="Enterprise",
            price_addition=Decimal("50"),
            code="ENT-001",
            is_active=True,
        )
        db.add(v)
        db.flush()
        resp = ProductVariantResponse.model_validate(v)
        assert resp.code == "ENT-001"
        assert resp.is_active is True
        assert resp.name == "Enterprise"
        assert resp.created_at is not None


# ===========================================================================
# SECTION 4 — Health endpoint
# ===========================================================================

class TestHealthEndpoint:
    def test_health_returns_200(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_body_is_healthy(self):
        body = client.get("/api/health").json()
        assert body["status"] == "healthy"

    def test_root_endpoint_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_docs_endpoint_loads(self):
        resp = client.get("/docs")
        assert resp.status_code == 200


# ===========================================================================
# SECTION 5 — Authentication endpoints
# ===========================================================================

class TestAuthEndpoints:

    def test_register_valid_customer(self):
        resp = client.post("/api/auth/register", json={
            "name": "Test User Reg",
            "email": "test_reg_01@example.com",
            "password": "securepass",
            "role": "customer",
        })
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert "access_token" in body
        assert body["user"]["email"] == "test_reg_01@example.com"
        assert body["user"]["role"] == "customer"
        assert "password" not in body["user"]
        assert "password_hash" not in body["user"]

    def test_register_with_company_and_department(self):
        resp = client.post("/api/auth/register", json={
            "name": "Corp User",
            "email": "corp_reg_02@example.com",
            "password": "pass1234",
            "role": "staff",
            "company": "ACME Corp",
            "department": "IT",
        })
        assert resp.status_code == 201, resp.text
        user = resp.json()["user"]
        assert user["company"] == "ACME Corp"
        assert user["department"] == "IT"

    def test_register_invalid_email_format(self):
        resp = client.post("/api/auth/register", json={
            "name": "Bad Email",
            "email": "not-an-email",
            "password": "pass1234",
            "role": "customer",
        })
        assert resp.status_code == 422

    def test_register_password_too_short(self):
        resp = client.post("/api/auth/register", json={
            "name": "Short Pass",
            "email": "shortpass_reg_03@example.com",
            "password": "abc",
            "role": "customer",
        })
        assert resp.status_code == 422

    def test_register_invalid_role(self):
        resp = client.post("/api/auth/register", json={
            "name": "Bad Role",
            "email": "badrole_reg_04@example.com",
            "password": "pass1234",
            "role": "superuser",
        })
        assert resp.status_code == 400

    def test_register_duplicate_email(self):
        payload = {
            "name": "First",
            "email": "duplicate_reg_05@example.com",
            "password": "pass1234",
            "role": "customer",
        }
        r1 = client.post("/api/auth/register", json=payload)
        assert r1.status_code == 201
        r2 = client.post("/api/auth/register", json=payload)
        assert r2.status_code == 400
        assert "already" in r2.json()["detail"].lower()

    def test_login_with_correct_password(self):
        client.post("/api/auth/register", json={
            "name": "Login User",
            "email": "loginok_reg_06@example.com",
            "password": "mypassword",
            "role": "customer",
        })
        resp = client.post("/api/auth/login", json={
            "email": "loginok_reg_06@example.com",
            "password": "mypassword",
        })
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password_returns_401(self):
        client.post("/api/auth/register", json={
            "name": "WrongPw",
            "email": "wrongpw_reg_07@example.com",
            "password": "correctpass",
            "role": "customer",
        })
        resp = client.post("/api/auth/login", json={
            "email": "wrongpw_reg_07@example.com",
            "password": "wrongpass",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user_returns_401(self):
        resp = client.post("/api/auth/login", json={
            "email": "nobody_reg_08@example.com",
            "password": "anypass",
        })
        assert resp.status_code == 401

    def test_me_requires_valid_token(self):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401

    def test_me_with_valid_token(self):
        register_resp = client.post("/api/auth/register", json={
            "name": "Me User",
            "email": "meuser_reg_09@example.com",
            "password": "pass1234",
            "role": "customer",
        })
        assert register_resp.status_code == 201, register_resp.text
        token = register_resp.json()["access_token"]
        me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == "meuser_reg_09@example.com"

    def test_inactive_user_login_rejected(self):
        """A user with is_active=False must be rejected on login."""
        reg = client.post("/api/auth/register", json={
            "name": "Inactive Test",
            "email": "inactive_reg_10@example.com",
            "password": "pass1234",
            "role": "customer",
        })
        assert reg.status_code == 201

        # Deactivate directly in DB
        with TEST_ENGINE.connect() as conn:
            conn.execute(
                text("UPDATE users SET is_active = 0 WHERE email = 'inactive_reg_10@example.com'")
            )
            conn.commit()

        resp = client.post("/api/auth/login", json={
            "email": "inactive_reg_10@example.com",
            "password": "pass1234",
        })
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Helpers for authenticated requests
# ---------------------------------------------------------------------------

_ADMIN_EMAIL = "admin_shared@example.com"
_ADMIN_PASS = "adminpass1234"
_ADMIN_TOKEN: str | None = None


def _get_admin_token() -> str:
    global _ADMIN_TOKEN
    if _ADMIN_TOKEN:
        return _ADMIN_TOKEN
    r = client.post("/api/auth/register", json={
        "name": "Admin",
        "email": _ADMIN_EMAIL,
        "password": _ADMIN_PASS,
        "role": "admin",
    })
    if r.status_code == 400:
        r = client.post("/api/auth/login", json={"email": _ADMIN_EMAIL, "password": _ADMIN_PASS})
    _ADMIN_TOKEN = r.json()["access_token"]
    return _ADMIN_TOKEN


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# SECTION 6 — Products endpoints
# ===========================================================================

class TestProductEndpoints:

    def test_list_products_unauthenticated_ok(self):
        resp = client.get("/api/products")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_product_requires_auth(self):
        resp = client.post("/api/products", json={
            "name": "Auth Required",
            "type": "SaaS",
            "sales_price": "10.00",
            "cost_price": "5.00",
        })
        assert resp.status_code == 401

    def test_create_product_as_admin(self):
        token = _get_admin_token()
        resp = client.post("/api/products", json={
            "name": "CRM Platform",
            "type": "SaaS",
            "sales_price": "99.00",
            "cost_price": "30.00",
            "notes": "Customer relationship management",
        }, headers=_auth(token))
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["name"] == "CRM Platform"
        assert body["is_active"] is True
        assert "created_at" in body
        assert "updated_at" in body

    def test_get_product_by_id(self):
        token = _get_admin_token()
        create_resp = client.post("/api/products", json={
            "name": "HR Tool",
            "type": "SaaS",
            "sales_price": "49.00",
            "cost_price": "15.00",
        }, headers=_auth(token))
        pid = create_resp.json()["id"]
        resp = client.get(f"/api/products/{pid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == pid

    def test_get_nonexistent_product_returns_404(self):
        resp = client.get("/api/products/999999")
        assert resp.status_code == 404

    def test_update_product_as_admin(self):
        token = _get_admin_token()
        create = client.post("/api/products", json={
            "name": "Analytics Suite",
            "type": "Analytics",
            "sales_price": "79.00",
            "cost_price": "20.00",
        }, headers=_auth(token))
        pid = create.json()["id"]
        resp = client.put(f"/api/products/{pid}", json={
            "sales_price": "89.00",
            "notes": "Updated notes",
        }, headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json()["notes"] == "Updated notes"

    def test_delete_product_as_admin(self):
        token = _get_admin_token()
        create = client.post("/api/products", json={
            "name": "To Delete Product",
            "type": "SaaS",
            "sales_price": "10.00",
            "cost_price": "2.00",
        }, headers=_auth(token))
        pid = create.json()["id"]
        del_resp = client.delete(f"/api/products/{pid}", headers=_auth(token))
        assert del_resp.status_code == 200
        assert client.get(f"/api/products/{pid}").status_code == 404

    def test_filter_products_by_is_active_true(self):
        """is_active=true filter must use real column — must NOT silently return 0 rows."""
        token = _get_admin_token()
        client.post("/api/products", json={
            "name": "Active Product Filter Test",
            "type": "SaaS",
            "sales_price": "20.00",
            "cost_price": "5.00",
        }, headers=_auth(token))
        resp = client.get("/api/products?is_active=true")
        assert resp.status_code == 200
        body = resp.json()
        names = [p["name"] for p in body]
        assert "Active Product Filter Test" in names, (
            f"is_active=true filter returned: {names}\n"
            "Filter may still be broken (property-based filtering)"
        )

    def test_create_product_with_variants(self):
        token = _get_admin_token()
        resp = client.post("/api/products", json={
            "name": "Multi Variant Product",
            "type": "SaaS",
            "sales_price": "50.00",
            "cost_price": "10.00",
            "variants": [
                {"name": "Starter", "code": "MVP-STR", "additional_price": "0.00"},
                {"name": "Pro", "code": "MVP-PRO", "additional_price": "20.00"},
            ],
        }, headers=_auth(token))
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert len(body["variants"]) == 2

    def test_create_variant_for_existing_product(self):
        token = _get_admin_token()
        prod = client.post("/api/products", json={
            "name": "Variant Parent",
            "type": "SaaS",
            "sales_price": "30.00",
            "cost_price": "8.00",
        }, headers=_auth(token)).json()
        pid = prod["id"]
        resp = client.post(f"/api/products/{pid}/variants", json={
            "name": "Enterprise Edition",
            "code": "ENT-ED",
            "additional_price": "25.00",
        }, headers=_auth(token))
        assert resp.status_code == 201, resp.text
        v = resp.json()
        assert v["name"] == "Enterprise Edition"
        assert v["code"] == "ENT-ED"
        assert v["is_active"] is True


# ===========================================================================
# SECTION 7 — Plans endpoints
# ===========================================================================

class TestPlanEndpoints:

    def test_list_plans_unauthenticated_ok(self):
        resp = client.get("/api/plans")
        assert resp.status_code == 200

    def test_create_plan_as_admin(self):
        token = _get_admin_token()
        resp = client.post("/api/plans", json={
            "name": "Monthly Pro Plan",
            "price": "49.99",
            "billing_frequency": "monthly",
            "availability": "active",
            "notes": "Full features",
        }, headers=_auth(token))
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["billing_frequency"] == "monthly"
        assert body["availability"] == "active"
        assert body["notes"] == "Full features"
        assert body["is_active"] is True

    def test_get_plan_by_id(self):
        token = _get_admin_token()
        plan = client.post("/api/plans", json={
            "name": "Weekly Plan Get",
            "price": "9.99",
            "billing_frequency": "weekly",
            "availability": "active",
        }, headers=_auth(token)).json()
        pid = plan["id"]
        resp = client.get(f"/api/plans/{pid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == pid

    def test_get_nonexistent_plan_returns_404(self):
        resp = client.get("/api/plans/999998")
        assert resp.status_code == 404

    def test_update_plan_as_admin(self):
        token = _get_admin_token()
        plan = client.post("/api/plans", json={
            "name": "Plan To Update",
            "price": "19.99",
            "billing_frequency": "monthly",
            "availability": "beta",
        }, headers=_auth(token)).json()
        pid = plan["id"]
        resp = client.put(f"/api/plans/{pid}", json={
            "availability": "active",
            "notes": "Now live",
        }, headers=_auth(token))
        assert resp.status_code == 200
        body = resp.json()
        assert body["availability"] == "active"
        assert body["notes"] == "Now live"

    def test_filter_plans_by_billing_frequency(self):
        """billing_frequency filter uses Plan.billing_cycle — must actually filter."""
        token = _get_admin_token()
        client.post("/api/plans", json={
            "name": "Yearly Filter Plan",
            "price": "499.00",
            "billing_frequency": "yearly",
            "availability": "active",
        }, headers=_auth(token))
        resp = client.get("/api/plans?billing_frequency=yearly")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert len(body) > 0, "billing_frequency=yearly filter returned no results"
        freqs = [p["billing_frequency"] for p in body]
        assert all(f == "yearly" for f in freqs), (
            f"Filter returned plans with non-yearly frequency: {freqs}"
        )

    def test_filter_plans_by_availability(self):
        """availability is a real mapped column."""
        token = _get_admin_token()
        client.post("/api/plans", json={
            "name": "Beta Plan Filter Test",
            "price": "0.00",
            "billing_frequency": "monthly",
            "availability": "beta",
        }, headers=_auth(token))
        resp = client.get("/api/plans?availability=beta")
        assert resp.status_code == 200
        body = resp.json()
        assert any(p["availability"] == "beta" for p in body)

    def test_filter_plans_by_is_active_true(self):
        """is_active=true must use real column — must return active plans."""
        token = _get_admin_token()
        client.post("/api/plans", json={
            "name": "Active Plan Filter",
            "price": "5.00",
            "billing_frequency": "daily",
            "availability": "active",
        }, headers=_auth(token))
        resp = client.get("/api/plans?is_active=true")
        assert resp.status_code == 200
        body = resp.json()
        names = [p["name"] for p in body]
        assert "Active Plan Filter" in names, (
            f"is_active=true filter returned: {names}"
        )

    def test_delete_plan_as_admin(self):
        token = _get_admin_token()
        plan = client.post("/api/plans", json={
            "name": "Plan To Delete",
            "price": "1.00",
            "billing_frequency": "monthly",
            "availability": "active",
        }, headers=_auth(token)).json()
        pid = plan["id"]
        resp = client.delete(f"/api/plans/{pid}", headers=_auth(token))
        assert resp.status_code == 200
        assert client.get(f"/api/plans/{pid}").status_code == 404


# ===========================================================================
# SECTION 8 — Taxes endpoints
# ===========================================================================

class TestTaxEndpoints:

    def test_list_taxes_unauthenticated_ok(self):
        resp = client.get("/api/taxes")
        assert resp.status_code == 200

    def test_create_tax_as_admin(self):
        token = _get_admin_token()
        resp = client.post("/api/taxes", json={
            "name": "GST 18 Create",
            "rate": "18.00",
            "tax_type": "percentage",
            "country": "IN",
            "description": "Standard GST",
            "is_inclusive": False,
        }, headers=_auth(token))
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["tax_type"] == "percentage"
        assert body["country"] == "IN"
        assert body["is_inclusive"] is False
        assert body["is_active"] is True
        assert "created_at" in body
        assert "updated_at" in body

    def test_get_tax_by_id(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "VAT 20 Get",
            "rate": "20.00",
            "tax_type": "percentage",
        }, headers=_auth(token)).json()
        tid = tax["id"]
        resp = client.get(f"/api/taxes/{tid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == tid

    def test_get_nonexistent_tax_returns_404(self):
        resp = client.get("/api/taxes/888888")
        assert resp.status_code == 404

    def test_update_tax_as_admin(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "Tax To Update",
            "rate": "5.00",
            "tax_type": "percentage",
        }, headers=_auth(token)).json()
        tid = tax["id"]
        resp = client.put(f"/api/taxes/{tid}", json={
            "rate": "7.00",
            "country": "US",
        }, headers=_auth(token))
        assert resp.status_code == 200
        body = resp.json()
        assert body["country"] == "US"

    def test_delete_tax_as_admin(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "Tax To Delete",
            "rate": "3.00",
            "tax_type": "percentage",
        }, headers=_auth(token)).json()
        tid = tax["id"]
        resp = client.delete(f"/api/taxes/{tid}", headers=_auth(token))
        assert resp.status_code == 200
        assert client.get(f"/api/taxes/{tid}").status_code == 404

    def test_filter_taxes_by_country(self):
        token = _get_admin_token()
        client.post("/api/taxes", json={
            "name": "UK VAT Country Filter",
            "rate": "20.00",
            "tax_type": "percentage",
            "country": "GB",
        }, headers=_auth(token))
        resp = client.get("/api/taxes?country=GB")
        assert resp.status_code == 200
        body = resp.json()
        assert any(t["country"] == "GB" for t in body)

    def test_filter_taxes_by_is_active(self):
        """is_active filter must use real column."""
        token = _get_admin_token()
        client.post("/api/taxes", json={
            "name": "Active Tax Filter Test",
            "rate": "10.00",
            "tax_type": "percentage",
        }, headers=_auth(token))
        resp = client.get("/api/taxes?is_active=true")
        assert resp.status_code == 200
        body = resp.json()
        names = [t["name"] for t in body]
        assert "Active Tax Filter Test" in names, (
            f"is_active=true filter returned: {names}"
        )

    def test_calculate_exclusive_18_percent(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "Calc GST 18 Excl",
            "rate": "18.00",
            "tax_type": "percentage",
            "is_inclusive": False,
        }, headers=_auth(token)).json()
        resp = client.post("/api/taxes/calculate", json={
            "amount": "100.00",
            "tax_id": tax["id"],
        })
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert float(body["base_amount"]) == pytest.approx(100.0)
        assert float(body["tax_amount"]) == pytest.approx(18.0)
        assert float(body["total_amount"]) == pytest.approx(118.0)
        assert body["is_inclusive"] is False

    def test_calculate_inclusive_18_percent(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "Calc GST 18 Incl",
            "rate": "18.00",
            "tax_type": "percentage",
            "is_inclusive": True,
        }, headers=_auth(token)).json()
        resp = client.post("/api/taxes/calculate", json={
            "amount": "118.00",
            "tax_id": tax["id"],
        })
        assert resp.status_code == 200, resp.text
        body = resp.json()
        # base = 118 / 1.18 = 100
        assert float(body["base_amount"]) == pytest.approx(100.0, abs=0.02)
        assert float(body["total_amount"]) == pytest.approx(118.0, abs=0.01)
        assert body["is_inclusive"] is True

    def test_calculate_zero_rate_tax(self):
        token = _get_admin_token()
        tax = client.post("/api/taxes", json={
            "name": "Zero Rate Tax Calc",
            "rate": "0.00",
            "tax_type": "percentage",
            "is_inclusive": False,
        }, headers=_auth(token)).json()
        resp = client.post("/api/taxes/calculate", json={
            "amount": "250.00",
            "tax_id": tax["id"],
        })
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert float(body["tax_amount"]) == pytest.approx(0.0)
        assert float(body["total_amount"]) == pytest.approx(250.0)

    def test_calculate_with_nonexistent_tax_returns_404(self):
        resp = client.post("/api/taxes/calculate", json={
            "amount": "100.00",
            "tax_id": 999997,
        })
        assert resp.status_code == 404

    def test_calculate_route_before_wildcard(self):
        """The /calculate route must appear before /{tax_id} in router route list."""
        from app.api.taxes import router
        # Routes may be stored as full prefixed paths or relative paths
        # Check by looking at any path attribute
        paths = []
        for r in router.routes:
            p = getattr(r, "path", None)
            if p:
                paths.append(p)
        calculate_idx = next(
            (i for i, p in enumerate(paths) if "calculate" in p), None
        )
        wildcard_idx = next(
            (i for i, p in enumerate(paths) if "{tax_id}" in p), None
        )
        assert calculate_idx is not None, f"No /calculate route found. Paths: {paths}"
        assert wildcard_idx is not None, f"No wildcard route found. Paths: {paths}"
        assert calculate_idx < wildcard_idx, (
            f"/calculate (idx {calculate_idx}) appears AFTER /{'{tax_id}'} (idx {wildcard_idx})"
        )


# ===========================================================================
# SECTION 9 — Security / RBAC
# ===========================================================================

class TestSecurityRBAC:
    """RBAC tests using the _check_role pure-logic helper."""

    def test_admin_passes_admin_only_route(self):
        from app.core.security import _check_role
        assert _check_role("admin", ["admin"]) is True

    def test_admin_passes_staff_route(self):
        from app.core.security import _check_role
        assert _check_role("admin", ["staff"]) is True

    def test_staff_passes_staff_route(self):
        from app.core.security import _check_role
        assert _check_role("staff", ["staff"]) is True

    def test_customer_denied_staff_route(self):
        from app.core.security import _check_role
        assert _check_role("customer", ["staff"]) is False

    def test_super_admin_denied_admin_route(self):
        from app.core.security import _check_role
        assert _check_role("super_admin", ["admin"]) is False

    def test_admin_backup_denied(self):
        from app.core.security import _check_role
        assert _check_role("admin_backup", ["staff"]) is False

    def test_badadmin_denied(self):
        from app.core.security import _check_role
        assert _check_role("badadmin", ["admin"]) is False

    def test_create_product_without_token_returns_401(self):
        resp = client.post("/api/products", json={
            "name": "Unauth Product",
            "type": "SaaS",
            "sales_price": "1.00",
            "cost_price": "0.50",
        })
        assert resp.status_code == 401

    def test_create_plan_without_token_returns_401(self):
        resp = client.post("/api/plans", json={
            "name": "Unauth Plan",
            "price": "1.00",
            "billing_frequency": "monthly",
        })
        assert resp.status_code == 401

    def test_create_tax_without_token_returns_401(self):
        resp = client.post("/api/taxes", json={
            "name": "Unauth Tax",
            "rate": "5.00",
            "tax_type": "percentage",
        })
        assert resp.status_code == 401

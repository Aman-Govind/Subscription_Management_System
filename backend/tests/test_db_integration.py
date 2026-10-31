"""Database-level tests for ORM mappings and relationships."""

from datetime import date
from decimal import Decimal
from pathlib import Path
import sys

from sqlalchemy import Numeric, create_engine
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base
from app.models import BillingCycle, Plan, Product, Subscription, SubscriptionStatus, User, UserRole


def test_subscription_model_persists_dates_and_related_objects() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    try:
        with Session(engine) as session:
            user = User(
                email="model-test@example.com",
                password_hash="test-hash",
                role=UserRole.CUSTOMER,
            )
            product = Product(
                name="Model Test Product",
                type="SaaS",
                sales_price=Decimal("49.99"),
                cost_price=Decimal("12.50"),
            )
            session.add_all([user, product])
            session.flush()

            plan = Plan(
                product_id=product.id,
                name="Model Test Monthly",
                base_cost=Decimal("49.99"),
                billing_cycle=BillingCycle.MONTHLY,
            )
            session.add(plan)
            session.flush()

            subscription = Subscription(
                customer_id=user.id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                start_date=date(2026, 1, 1),
                next_billing_date=date(2026, 2, 1),
                end_date=date(2026, 12, 31),
            )
            session.add(subscription)
            session.commit()

            persisted = session.get(Subscription, subscription.id)
            assert persisted is not None
            assert persisted.next_billing_date == date(2026, 2, 1)
            assert persisted.end_date == date(2026, 12, 31)
            assert persisted.plan is not None
            assert persisted.plan.product is not None
            assert persisted.plan.product.name == "Model Test Product"

    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_model_monetary_columns_use_numeric_precision() -> None:
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if column.name in {
                "sales_price",
                "cost_price",
                "price_addition",
                "base_cost",
                "percentage",
                "value",
                "unit_price",
                "tax_amount",
                "total_amount",
                "subtotal",
                "tax_total",
                "grand_total",
                "amount",
            }:
                assert isinstance(column.type, Numeric), f"{table.name}.{column.name}"
                assert column.type.precision == 10, f"{table.name}.{column.name}"
                assert column.type.scale == 2, f"{table.name}.{column.name}"

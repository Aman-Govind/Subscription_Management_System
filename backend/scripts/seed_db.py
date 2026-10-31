"""Populate the local Subscription Management database with demo records.

Run from the backend directory:
    python scripts/seed_db.py

Use --reset only for local development data. It deletes all rows in the
implemented application tables before recreating the demo dataset.
"""

from __future__ import annotations

import argparse
from datetime import date
from decimal import Decimal
from pathlib import Path
import sys

# Make direct script execution work from any current directory.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models import (
    BillingCycle,
    DiscountRule,
    DiscountType,
    Invoice,
    InvoiceStatus,
    Payment,
    Plan,
    Product,
    ProductVariant,
    Subscription,
    SubscriptionLine,
    SubscriptionStatus,
    TaxRule,
    User,
    UserRole,
)

DUMMY_PASSWORD_HASH = "hashed_password_123"


def clear_seedable_data(session) -> None:
    """Delete rows child-first so MySQL foreign-key constraints remain valid."""
    session.execute(delete(Payment))
    session.execute(delete(Invoice))
    session.execute(delete(SubscriptionLine))
    session.execute(delete(Subscription))
    session.execute(delete(ProductVariant))
    session.execute(delete(Product))
    session.execute(delete(Plan))
    session.execute(delete(TaxRule))
    session.execute(delete(DiscountRule))
    session.execute(delete(User))


def database_has_users(session) -> bool:
    """Return whether seeding would collide with existing user records."""
    return session.scalar(select(User.id).limit(1)) is not None


def seed_database(reset: bool = False) -> None:
    """Create a realistic, deterministic local dataset in one transaction."""
    with SessionLocal() as session:
        try:
            if reset:
                clear_seedable_data(session)
                session.flush()
                print("Existing local application data cleared.")
            elif database_has_users(session):
                raise RuntimeError(
                    "Database already contains users. Re-run with --reset only "
                    "if deleting local demo data is intended."
                )

            admin = User(
                email="admin@brightloop.test",
                password_hash=DUMMY_PASSWORD_HASH,
                role=UserRole.ADMIN,
            )
            staff = User(
                email="staff@brightloop.test",
                password_hash=DUMMY_PASSWORD_HASH,
                role=UserRole.STAFF,
            )
            customer_one = User(
                email="customer.one@brightloop.test",
                password_hash=DUMMY_PASSWORD_HASH,
                role=UserRole.CUSTOMER,
            )
            customer_two = User(
                email="customer.two@brightloop.test",
                password_hash=DUMMY_PASSWORD_HASH,
                role=UserRole.CUSTOMER,
            )
            session.add_all([admin, staff, customer_one, customer_two])

            business_software = Product(
                name="Business Software",
                type="SaaS",
                sales_price=Decimal("99.00"),
                cost_price=Decimal("35.00"),
                notes="Team collaboration and reporting platform.",
            )
            cloud_storage = Product(
                name="Cloud Storage",
                type="Cloud Service",
                sales_price=Decimal("25.00"),
                cost_price=Decimal("8.00"),
                notes="Secure storage for business documents.",
            )
            session.add_all([business_software, cloud_storage])
            session.flush()

            software_pro = ProductVariant(
                product_id=business_software.id,
                variant_name="Professional Edition",
                price_addition=Decimal("20.00"),
            )
            storage_plus = ProductVariant(
                product_id=cloud_storage.id,
                variant_name="1 TB Add-on",
                price_addition=Decimal("15.00"),
            )
            session.add_all([software_pro, storage_plus])

            monthly_basic = Plan(
                product_id=business_software.id,
                name="Monthly Basic",
                base_cost=Decimal("99.00"),
                billing_cycle=BillingCycle.MONTHLY,
                min_quantity=1,
                can_pause=True,
                auto_close=False,
            )
            yearly_premium = Plan(
                product_id=business_software.id,
                name="Yearly Premium",
                base_cost=Decimal("1188.00"),
                billing_cycle=BillingCycle.YEARLY,
                min_quantity=1,
                can_pause=True,
                auto_close=False,
            )
            weekly_storage = Plan(
                product_id=cloud_storage.id,
                name="Weekly Storage",
                base_cost=Decimal("25.00"),
                billing_cycle=BillingCycle.WEEKLY,
                min_quantity=1,
                can_pause=False,
                auto_close=True,
            )
            session.add_all([monthly_basic, yearly_premium, weekly_storage])
            session.flush()

            tax_rule = TaxRule(name="Standard VAT", percentage=Decimal("18.00"))
            discount_rule = DiscountRule(
                name="Welcome Discount",
                type=DiscountType.PERCENTAGE,
                value=Decimal("10.00"),
                usage_limit=100,
                times_used=0,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 12, 31),
            )
            session.add_all([tax_rule, discount_rule])
            session.flush()

            subscription_one = Subscription(
                customer_id=customer_one.id,
                plan_id=monthly_basic.id,
                status=SubscriptionStatus.ACTIVE,
                start_date=date(2026, 1, 1),
                expiry_date=date(2026, 12, 31),
                payment_terms="Net 30",
            )
            subscription_two = Subscription(
                customer_id=customer_two.id,
                plan_id=weekly_storage.id,
                status=SubscriptionStatus.CONFIRMED,
                start_date=date(2026, 6, 1),
                expiry_date=date(2027, 5, 31),
                payment_terms="Due on receipt",
            )
            session.add_all([subscription_one, subscription_two])
            session.flush()

            session.add_all(
                [
                    SubscriptionLine(
                        subscription_id=subscription_one.id,
                        product_id=business_software.id,
                        variant_id=software_pro.id,
                        quantity=1,
                        unit_price=Decimal("119.00"),
                        tax_amount=Decimal("21.42"),
                        total_amount=Decimal("140.42"),
                    ),
                    SubscriptionLine(
                        subscription_id=subscription_two.id,
                        product_id=cloud_storage.id,
                        variant_id=storage_plus.id,
                        quantity=2,
                        unit_price=Decimal("40.00"),
                        tax_amount=Decimal("14.40"),
                        total_amount=Decimal("94.40"),
                    ),
                ]
            )

            invoice = Invoice(
                subscription_id=subscription_one.id,
                status=InvoiceStatus.CONFIRMED,
                subtotal=Decimal("119.00"),
                tax_total=Decimal("21.42"),
                grand_total=Decimal("140.42"),
                issue_date=date(2026, 1, 1),
            )
            session.add(invoice)
            session.flush()

            session.add(
                Payment(
                    invoice_id=invoice.id,
                    amount=Decimal("140.42"),
                    payment_date=date(2026, 1, 15),
                    method="bank_transfer",
                    note="Demo payment for confirmed invoice.",
                )
            )

            session.commit()
            print("Database seeded successfully.")
            print("Users: 4 | Products: 2 | Variants: 2 | Plans: 3")
            print("Subscriptions: 2 | Subscription lines: 2")
            print("Tax rules: 1 | Discount rules: 1 | Invoices: 1 | Payments: 1")
        except Exception:
            session.rollback()
            raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed local Brightloop demo data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing local application rows before seeding.",
    )
    args = parser.parse_args()
    seed_database(reset=args.reset)


if __name__ == "__main__":
    main()

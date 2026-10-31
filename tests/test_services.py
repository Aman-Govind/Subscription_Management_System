from datetime import date
from decimal import Decimal
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.services.analytics_service import generate_dashboard_analytics
from app.services.billing_service import (
    calculate_annualized_cost,
    calculate_monthly_cost,
    calculate_next_renewal,
)
from app.services.expense_service import (
    calculate_annual_expense,
    calculate_category_expenses,
    calculate_total_monthly_expense,
)
from app.services.notification_service import generate_renewal_notifications
from app.services.renewal_service import (
    get_due_today,
    get_expired_subscriptions,
    get_overdue_subscriptions,
    get_upcoming_renewals,
)
from app.services.subscription_service import (
    cancel_subscription,
    prepare_subscription,
    validate_subscription,
)


TODAY = date(2026, 3, 10)


def subscription(**overrides):
    data = {
        "id": 1,
        "service_name": "Streaming",
        "amount": Decimal("12.00"),
        "billing_cycle": "monthly",
        "start_date": date(2026, 1, 10),
        "next_billing_date": date(2026, 3, 15),
        "status": "active",
        "category_name": "Entertainment",
    }
    data.update(overrides)
    return data


@pytest.mark.parametrize(
    ("amount", "cycle", "monthly", "annual"),
    [
        (Decimal("10"), "weekly", Decimal("43.33333333333333333333333333"), Decimal("520")),
        (Decimal("10"), "monthly", Decimal("10"), Decimal("120")),
        (Decimal("120"), "yearly", Decimal("10"), Decimal("120")),
    ],
)
def test_billing_costs_for_all_cycles(amount, cycle, monthly, annual):
    assert calculate_monthly_cost(amount, cycle) == monthly
    assert calculate_annualized_cost(amount, cycle) == annual


@pytest.mark.parametrize(
    ("start", "cycle", "expected"),
    [
        (date(2025, 1, 31), "monthly", date(2025, 2, 28)),
        (date(2024, 1, 31), "monthly", date(2024, 2, 29)),
        (date(2023, 2, 28), "yearly", date(2024, 2, 28)),
        (date(2024, 2, 29), "yearly", date(2025, 2, 28)),
    ],
)
def test_renewal_date_handles_month_end_and_leap_year(start, cycle, expected):
    assert calculate_next_renewal(start, cycle) == expected


@pytest.mark.parametrize("amount", [0, -1, "not-money", float("nan")])
def test_invalid_subscription_amounts_are_rejected(amount):
    with pytest.raises(ValueError):
        validate_subscription(subscription(amount=amount))


def test_invalid_billing_cycle_is_rejected():
    with pytest.raises(ValueError):
        validate_subscription(subscription(billing_cycle="quarterly"))


def test_prepare_subscription_normalizes_valid_data():
    prepared = prepare_subscription(
        subscription(service_name="  Music  ", amount="9.99", next_billing_date=None)
    )
    assert prepared["service_name"] == "Music"
    assert prepared["amount"] == Decimal("9.99")
    assert prepared["next_billing_date"] == date(2026, 2, 10)


def test_cancellation_is_non_mutating_and_cannot_repeat():
    original = subscription()
    cancelled = cancel_subscription(original)
    assert original["status"] == "active"
    assert cancelled["status"] == "cancelled"
    with pytest.raises(ValueError):
        cancel_subscription(cancelled)


def test_renewal_filters_identify_upcoming_due_overdue_and_expired():
    items = [
        subscription(id=1, next_billing_date=TODAY),
        subscription(id=2, next_billing_date=date(2026, 3, 17)),
        subscription(id=3, next_billing_date=date(2026, 3, 9)),
        subscription(id=4, next_billing_date=date(2026, 3, 12), status="cancelled"),
        subscription(id=5, next_billing_date=date(2026, 3, 12), end_date=date(2026, 3, 9)),
    ]
    assert [item["id"] for item in get_upcoming_renewals(items, TODAY)] == [1, 2]
    assert [item["id"] for item in get_due_today(items, TODAY)] == [1]
    assert [item["id"] for item in get_overdue_subscriptions(items, TODAY)] == [3]
    assert [item["id"] for item in get_expired_subscriptions(items, TODAY)] == [5]


def test_expenses_exclude_cancelled_and_expired_subscriptions():
    items = [
        subscription(id=1, amount=Decimal("10"), billing_cycle="monthly"),
        subscription(id=2, amount=Decimal("12"), billing_cycle="yearly", category_name="Work"),
        subscription(id=3, amount=Decimal("100"), status="cancelled"),
        subscription(id=4, amount=Decimal("100"), status="expired"),
    ]
    assert calculate_total_monthly_expense(items, TODAY) == Decimal("11.00")
    assert calculate_annual_expense(items, TODAY) == Decimal("132.00")
    assert calculate_category_expenses(items, TODAY) == {
        "Entertainment": Decimal("10.00"),
        "Work": Decimal("1.00"),
    }


def test_analytics_and_notifications_exclude_inactive_items():
    items = [
        subscription(id=1, amount=Decimal("10"), next_billing_date=date(2026, 3, 12)),
        subscription(id=2, amount=Decimal("50"), status="cancelled", next_billing_date=date(2026, 3, 11)),
        subscription(id=3, amount=Decimal("40"), status="expired", next_billing_date=date(2026, 3, 11)),
    ]
    analytics = generate_dashboard_analytics(items, TODAY)
    assert analytics["total_subscriptions"] == 3
    assert analytics["active_subscriptions"] == 1
    assert analytics["highest_spending_category"] == "Entertainment"
    notifications = generate_renewal_notifications(items, TODAY)
    assert [notice["subscription_id"] for notice in notifications] == [1]

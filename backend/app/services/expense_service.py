"""Subscription spending calculations."""

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Mapping

from .billing_service import calculate_annualized_cost, calculate_monthly_cost
from .renewal_service import is_expired

Subscription = Mapping[str, object]
MONEY_QUANTUM = Decimal("0.01")


def _currency(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def is_active_spending(
    subscription: Subscription, today: date | datetime | None = None
) -> bool:
    """Return whether a subscription should contribute to active spending."""
    if str(subscription.get("status", "active")).strip().lower() != "active":
        return False
    return not is_expired(subscription, today)


def calculate_total_monthly_expense(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> Decimal:
    """Return total active monthly-equivalent spend rounded once to cents."""
    total = sum(
        (
            calculate_monthly_cost(sub["amount"], str(sub["billing_cycle"]))
            for sub in subscriptions
            if is_active_spending(sub, today)
        ),
        Decimal("0"),
    )
    return _currency(total)


def calculate_annual_expense(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> Decimal:
    """Return total active annualized spend rounded once to cents."""
    total = sum(
        (
            calculate_annualized_cost(sub["amount"], str(sub["billing_cycle"]))
            for sub in subscriptions
            if is_active_spending(sub, today)
        ),
        Decimal("0"),
    )
    return _currency(total)


def calculate_category_expenses(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> dict[str, Decimal]:
    """Return active monthly-equivalent spending grouped by category."""
    totals: dict[str, Decimal] = {}
    for sub in subscriptions:
        if not is_active_spending(sub, today):
            continue
        raw_category = sub.get("category_name")
        category = raw_category.strip() if isinstance(raw_category, str) and raw_category.strip() else "Other"
        totals[category] = totals.get(category, Decimal("0")) + calculate_monthly_cost(
            sub["amount"], str(sub["billing_cycle"])
        )
    return {category: _currency(total) for category, total in totals.items()}

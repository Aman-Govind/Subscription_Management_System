"""Composable dashboard analytics for subscription collections."""

from datetime import date, datetime
from typing import Iterable, Mapping

from .expense_service import (
    calculate_annual_expense,
    calculate_category_expenses,
    calculate_total_monthly_expense,
    is_active_spending,
)
from .renewal_service import get_upcoming_renewals

Subscription = Mapping[str, object]


def generate_dashboard_analytics(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> dict[str, object]:
    """Calculate dashboard metrics without database or framework dependencies."""
    items = list(subscriptions)
    active = [sub for sub in items if is_active_spending(sub, today)]
    category_expenses = calculate_category_expenses(items, today)
    highest_category = (
        max(category_expenses, key=category_expenses.get) if category_expenses else None
    )
    return {
        "total_subscriptions": len(items),
        "active_subscriptions": len(active),
        "monthly_expense": calculate_total_monthly_expense(items, today),
        "annual_expense": calculate_annual_expense(items, today),
        "upcoming_renewals": get_upcoming_renewals(items, today),
        "category_expenses": category_expenses,
        "highest_spending_category": highest_category,
    }

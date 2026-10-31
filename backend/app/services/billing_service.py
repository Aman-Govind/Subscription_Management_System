
import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Final

VALID_BILLING_CYCLES: Final[frozenset[str]] = frozenset({"weekly", "monthly", "yearly"})
WEEKS_PER_YEAR: Final[Decimal] = Decimal("52")
MONTHS_PER_YEAR: Final[Decimal] = Decimal("12")


def validate_billing_cycle(billing_cycle: str) -> str:
    """Return a normalized billing cycle or raise ValueError."""
    if not isinstance(billing_cycle, str):
        raise ValueError("Billing cycle must be weekly, monthly, or yearly")
    normalized = billing_cycle.strip().lower()
    if normalized not in VALID_BILLING_CYCLES:
        raise ValueError("Billing cycle must be weekly, monthly, or yearly")
    return normalized


def to_decimal_amount(amount: object) -> Decimal:
    """Convert a positive, finite monetary amount to Decimal."""
    if isinstance(amount, bool):
        raise ValueError("Amount must be a positive number")
    try:
        value = Decimal(str(amount))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Amount must be a positive number") from exc
    if not value.is_finite() or value <= 0:
        raise ValueError("Amount must be a positive number")
    return value


def as_date(value: date | datetime, field_name: str = "date") -> date:
    """Return a calendar date, retaining an aware datetime's local date."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raise ValueError(f"{field_name} must be a date or datetime")


def calculate_monthly_cost(amount: object, billing_cycle: str) -> Decimal:
    """Return the monthly equivalent of a weekly, monthly, or yearly charge."""
    value = to_decimal_amount(amount)
    cycle = validate_billing_cycle(billing_cycle)
    if cycle == "weekly":
        return value * WEEKS_PER_YEAR / MONTHS_PER_YEAR
    if cycle == "yearly":
        return value / MONTHS_PER_YEAR
    return value


def calculate_annualized_cost(amount: object, billing_cycle: str) -> Decimal:
    """Return the yearly equivalent of a recurring charge."""
    value = to_decimal_amount(amount)
    cycle = validate_billing_cycle(billing_cycle)
    if cycle == "weekly":
        return value * WEEKS_PER_YEAR
    if cycle == "monthly":
        return value * MONTHS_PER_YEAR
    return value


def calculate_next_renewal(start_date: date | datetime, billing_cycle: str) -> date:
    """Calculate one billing interval after start_date, including month-end rules."""
    renewal_date = as_date(start_date, "start_date")
    cycle = validate_billing_cycle(billing_cycle)
    if cycle == "weekly":
        return renewal_date + timedelta(days=7)
    if cycle == "yearly":
        year = renewal_date.year + 1
        day = min(renewal_date.day, calendar.monthrange(year, renewal_date.month)[1])
        return date(year, renewal_date.month, day)

    year, month = renewal_date.year, renewal_date.month + 1
    if month == 13:
        year, month = year + 1, 1
    day = min(renewal_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

"""Billing calculations and calendar-aware cycle management."""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Final

from dateutil.relativedelta import relativedelta

TWO_PLACES: Final[Decimal] = Decimal("0.01")
WEEKS_PER_YEAR: Final[Decimal] = Decimal("52")
MONTHS_PER_YEAR: Final[Decimal] = Decimal("12")
VALID_BILLING_CYCLES: Final[frozenset[str]] = frozenset({"daily", "weekly", "monthly", "yearly"})


def validate_billing_cycle(billing_cycle: str) -> str:
    """Return a normalized billing cycle or raise ValueError."""
    if not isinstance(billing_cycle, str):
        raise ValueError("Billing cycle must be daily, weekly, monthly, or yearly")
    normalized = billing_cycle.strip().lower()
    if normalized not in VALID_BILLING_CYCLES:
        raise ValueError(
            f"Unsupported billing cycle: '{billing_cycle}'. Must be one of: {', '.join(sorted(VALID_BILLING_CYCLES))}"
        )
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
    """Return a calendar date, extracting date from datetime if needed."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raise ValueError(f"{field_name} must be a date or datetime")


def calculate_monthly_equivalent(amount: Decimal, billing_cycle: str) -> Decimal:
    """Calculate the monthly equivalent of a recurring charge, rounded to 2 decimal places.

    Rules:
      - weekly:  (amount * 52) / 12
      - monthly: amount
      - yearly:  amount / 12

    Rounds to 2 decimal places using ROUND_HALF_UP.
    """
    value = to_decimal_amount(amount)
    cycle = validate_billing_cycle(billing_cycle)

    if cycle == "weekly":
        monthly = (value * WEEKS_PER_YEAR) / MONTHS_PER_YEAR
    elif cycle == "yearly":
        monthly = value / MONTHS_PER_YEAR
    elif cycle == "monthly":
        monthly = value
    elif cycle == "daily":
        monthly = (value * Decimal("365")) / MONTHS_PER_YEAR
    else:
        raise ValueError(f"Cannot calculate monthly equivalent for cycle: {cycle}")

    return monthly.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_annualized_cost(
    monthly_equivalent: Decimal,
    billing_cycle: str | None = None,
) -> Decimal:
    """Calculate the yearly cost from monthly equivalent, or directly from amount and cycle.

    Rules:
      - calculate_annualized_cost(monthly_equivalent): monthly_equivalent * 12
      - calculate_annualized_cost(amount, billing_cycle): converts directly by cycle
    """
    if billing_cycle is not None:
        value = to_decimal_amount(monthly_equivalent)
        cycle = validate_billing_cycle(billing_cycle)
        if cycle == "daily":
            return value * Decimal("365")
        if cycle == "weekly":
            return value * WEEKS_PER_YEAR
        if cycle == "monthly":
            return value * MONTHS_PER_YEAR
        if cycle == "yearly":
            return value

    value = to_decimal_amount(monthly_equivalent)
    return value * MONTHS_PER_YEAR


def calculate_next_billing_date(current_date: date, billing_cycle: str) -> date:
    """Calculate the next billing date using python-dateutil's relativedelta.

    Rules:
      - daily:   +1 day
      - weekly:  +1 week
      - monthly: +1 month (snaps day to end of month if target month is shorter)
      - yearly:  +1 year  (Feb 29 rolls safely to Feb 28 in non-leap years)
    """
    normalized_date = as_date(current_date, "current_date")
    cycle = validate_billing_cycle(billing_cycle)

    if cycle == "daily":
        return normalized_date + relativedelta(days=1)
    if cycle == "weekly":
        return normalized_date + relativedelta(weeks=1)
    if cycle == "monthly":
        return normalized_date + relativedelta(months=1)
    if cycle == "yearly":
        return normalized_date + relativedelta(years=1)

    raise ValueError(f"Unsupported billing cycle: {billing_cycle}")


# Compatibility aliases for existing services and tests
calculate_next_renewal = calculate_next_billing_date


def calculate_monthly_cost(amount: object, billing_cycle: str) -> Decimal:
    """Calculate raw monthly cost without 2-place quantization (for existing test suite)."""
    value = to_decimal_amount(amount)
    cycle = validate_billing_cycle(billing_cycle)
    if cycle == "weekly":
        return value * WEEKS_PER_YEAR / MONTHS_PER_YEAR
    if cycle == "yearly":
        return value / MONTHS_PER_YEAR
    return value

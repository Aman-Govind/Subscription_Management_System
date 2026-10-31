"""Validation and state-transition rules for subscription payloads."""

from typing import Mapping

from .billing_service import (
    as_date,
    calculate_next_renewal,
    to_decimal_amount,
    validate_billing_cycle,
)

VALID_CYCLES = ("weekly", "monthly", "yearly")


def validate_subscription(data: Mapping[str, object]) -> bool:
    """Validate the minimum subscription contract; raise ValueError if invalid."""
    if not isinstance(data, Mapping):
        raise ValueError("Subscription data must be a mapping")
    service_name = data.get("service_name")
    if not isinstance(service_name, str) or not service_name.strip():
        raise ValueError("Service name is required")
    if "amount" not in data:
        raise ValueError("Amount is required")
    to_decimal_amount(data["amount"])
    if "billing_cycle" not in data:
        raise ValueError("Billing cycle is required")
    validate_billing_cycle(data["billing_cycle"])
    if "start_date" not in data:
        raise ValueError("Start date is required")
    start_date = as_date(data["start_date"], "start_date")
    if data.get("end_date") is not None and as_date(data["end_date"], "end_date") < start_date:
        raise ValueError("End date cannot be before start date")
    return True


def prepare_subscription(data: Mapping[str, object]) -> dict[str, object]:
    """Return normalized subscription data ready for a persistence layer."""
    validate_subscription(data)
    prepared = dict(data)
    prepared["service_name"] = str(data["service_name"]).strip()
    prepared["amount"] = to_decimal_amount(data["amount"])
    prepared["billing_cycle"] = validate_billing_cycle(data["billing_cycle"])
    prepared["start_date"] = as_date(data["start_date"], "start_date")
    if data.get("end_date") is not None:
        prepared["end_date"] = as_date(data["end_date"], "end_date")
    prepared["next_billing_date"] = calculate_next_renewal(
        prepared["start_date"], prepared["billing_cycle"]
    )
    prepared["status"] = "active"
    return prepared


def cancel_subscription(subscription: Mapping[str, object]) -> dict[str, object]:
    """Return a cancelled copy; cancellation is invalid for cancelled or expired items."""
    status = str(subscription.get("status", "active")).strip().lower()
    if status == "cancelled":
        raise ValueError("Subscription is already cancelled")
    if status == "expired":
        raise ValueError("Expired subscriptions cannot be cancelled")
    cancelled = dict(subscription)
    cancelled["status"] = "cancelled"
    return cancelled

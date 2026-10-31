"""Renewal classification and reminder-window calculations."""

from datetime import date, datetime
from typing import Iterable, Mapping

from .billing_service import as_date

Subscription = Mapping[str, object]


def _today(value: date | datetime | None) -> date:
    return as_date(value, "today") if value is not None else date.today()


def get_days_until_renewal(
    next_billing_date: date | datetime, today: date | datetime | None = None
) -> int:
    """Return signed calendar days from today to the renewal date."""
    return (as_date(next_billing_date, "next_billing_date") - _today(today)).days


def is_expired(
    subscription: Subscription, today: date | datetime | None = None
) -> bool:
    """Return whether the subscription is explicitly or date-wise expired."""
    current_day = _today(today)
    if str(subscription.get("status", "active")).strip().lower() == "expired":
        return True
    end_date = subscription.get("end_date")
    return end_date is not None and as_date(end_date, "end_date") < current_day


def get_renewal_status(
    subscription: Subscription, today: date | datetime | None = None
) -> str:
    """Classify a subscription without persisting any status changes."""
    current_day = _today(today)
    status = str(subscription.get("status", "active")).strip().lower()
    if status == "cancelled":
        return status
    if is_expired(subscription, current_day):
        return "expired"
    if status != "active":
        return status
    days_left = get_days_until_renewal(subscription["next_billing_date"], current_day)
    if days_left < 0:
        return "overdue"
    if days_left == 0:
        return "due_today"
    if days_left <= 7:
        return "expiring_soon"
    return "active"


def get_upcoming_renewals(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[dict[str, object]]:
    """Return active subscriptions renewing in the next seven calendar days."""
    current_day = _today(today)
    upcoming: list[dict[str, object]] = []
    for subscription in subscriptions:
        if get_renewal_status(subscription, current_day) not in {
            "due_today",
            "expiring_soon",
        }:
            continue
        item = dict(subscription)
        item["days_left"] = get_days_until_renewal(
            subscription["next_billing_date"], current_day
        )
        upcoming.append(item)
    return upcoming


def get_due_today(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[Subscription]:
    """Return active subscriptions whose renewal is today."""
    current_day = _today(today)
    return [sub for sub in subscriptions if get_renewal_status(sub, current_day) == "due_today"]


def get_overdue_subscriptions(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[Subscription]:
    """Return active subscriptions with a past-due renewal."""
    current_day = _today(today)
    return [sub for sub in subscriptions if get_renewal_status(sub, current_day) == "overdue"]


def get_expired_subscriptions(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[Subscription]:
    """Return subscriptions explicitly expired or past their end date."""
    current_day = _today(today)
    return [sub for sub in subscriptions if get_renewal_status(sub, current_day) == "expired"]

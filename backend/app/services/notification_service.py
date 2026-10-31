"""Renewal reminder data generation; delivery is intentionally out of scope."""

from datetime import date, datetime
from typing import Iterable, Mapping

from .renewal_service import get_upcoming_renewals

Subscription = Mapping[str, object]


def get_notification_candidates(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[dict[str, object]]:
    """Return subscriptions eligible for a renewal notification."""
    return get_upcoming_renewals(subscriptions, today)


def generate_renewal_notifications(
    subscriptions: Iterable[Subscription], today: date | datetime | None = None
) -> list[dict[str, object]]:
    """Build delivery-agnostic renewal reminder payloads for eligible subscriptions."""
    notifications: list[dict[str, object]] = []
    for subscription in get_notification_candidates(subscriptions, today):
        days_left = int(subscription["days_left"])
        service_name = str(subscription.get("service_name", "This subscription"))
        notification = {
            "service_name": service_name,
            "message": f"{service_name} renews in {days_left} days",
            "renewal_date": subscription["next_billing_date"],
            "days_left": days_left,
        }
        if "id" in subscription:
            notification["subscription_id"] = subscription["id"]
        notifications.append(notification)
    return notifications

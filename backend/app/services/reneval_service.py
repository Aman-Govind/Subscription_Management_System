
from datetime import date
from .billing_service import calculate_next_renewal


def get_days_until_renewal(next_billing_date, today=None):

    today = today or date.today()

    return (next_billing_date - today).days


def get_upcoming_renewals(subscriptions, today=None):
    """
    Return subscriptions renewing within 7 days.
    """

    today = today or date.today()

    upcoming = []

    for subscription in subscriptions:

        if subscription["status"] != "active":
            continue

        days_left = get_days_until_renewal(
            subscription["next_billing_date"],
            today
        )

        if 0 <= days_left <= 7:

            upcoming.append({
                **subscription,
                "days_left": days_left
            })

    return upcoming


def get_renewal_status(subscription, today=None):

    today = today or date.today()

    if subscription["status"] != "active":
        return subscription["status"]

    if subscription.get("end_date"):
        if subscription["end_date"] < today:
            return "expired"

    days_left = get_days_until_renewal(
        subscription["next_billing_date"],
        today
    )

    if days_left < 0:
        return "overdue"

    if days_left == 0:
        return "due_today"

    if days_left <= 7:
        return "expiring_soon"

    return "active"

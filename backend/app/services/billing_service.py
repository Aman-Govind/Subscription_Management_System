
from datetime import date, timedelta
import calendar
from decimal import Decimal


def calculate_monthly_cost(amount, billing_cycle):
    """
    Convert subscription price into monthly equivalent.
    """

    amount = Decimal(str(amount))

    if amount <= 0:
        raise ValueError("Amount must be greater than zero")

    if billing_cycle == "weekly":
        return amount * Decimal(52) / Decimal(12)

    elif billing_cycle == "monthly":
        return amount

    elif billing_cycle == "yearly":
        return amount / Decimal(12)

    else:
        raise ValueError("Invalid billing cycle")


def calculate_next_renewal(start_date, billing_cycle):
    """
    Calculate next renewal date.
    """

    if billing_cycle == "weekly":
        return start_date + timedelta(days=7)

    elif billing_cycle == "monthly":
        year = start_date.year
        month = start_date.month + 1

        if month > 12:
            month = 1
            year += 1

        last_day = calendar.monthrange(year, month)[1]

        day = min(start_date.day, last_day)

        return date(year, month, day)

    elif billing_cycle == "yearly":
        year = start_date.year + 1

        day = start_date.day

        if start_date.month == 2 and day == 29:
            day = 28

        return date(year, start_date.month, day)

    else:
        raise ValueError("Invalid billing cycle")

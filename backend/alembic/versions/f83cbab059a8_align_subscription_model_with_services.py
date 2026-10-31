"""align_subscription_model_with_services

Revision ID: f83cbab059a8
Revises: a1b2c3d4e5f6
Create Date: 2026-10-31 15:51:46.188760

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f83cbab059a8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add service lifecycle dates and statuses to subscriptions."""
    op.add_column(
        "subscriptions",
        sa.Column("next_billing_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column("end_date", sa.Date(), nullable=True),
    )
    op.alter_column(
        "subscriptions",
        "status",
        existing_type=sa.Enum(
            "draft",
            "quotation",
            "confirmed",
            "active",
            "closed",
            name="subscription_status",
        ),
        type_=sa.Enum(
            "draft",
            "quotation",
            "confirmed",
            "active",
            "cancelled",
            "expired",
            "closed",
            name="subscription_status",
        ),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Remove service lifecycle fields and map new statuses to closed."""
    subscriptions = sa.table(
        "subscriptions",
        sa.column("status", sa.String(length=9)),
    )
    op.get_bind().execute(
        sa.update(subscriptions)
        .where(subscriptions.c.status.in_(("cancelled", "expired")))
        .values(status="closed")
    )
    op.alter_column(
        "subscriptions",
        "status",
        existing_type=sa.Enum(
            "draft",
            "quotation",
            "confirmed",
            "active",
            "cancelled",
            "expired",
            "closed",
            name="subscription_status",
        ),
        type_=sa.Enum(
            "draft",
            "quotation",
            "confirmed",
            "active",
            "closed",
            name="subscription_status",
        ),
        existing_nullable=False,
    )
    op.drop_column("subscriptions", "end_date")
    op.drop_column("subscriptions", "next_billing_date")

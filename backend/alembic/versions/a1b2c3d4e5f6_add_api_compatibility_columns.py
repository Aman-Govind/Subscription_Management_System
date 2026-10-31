"""Add API compatibility columns

Revision ID: a1b2c3d4e5f6
Revises: 1bb07f8f7a17
Create Date: 2026-10-31

Adds all 22 columns required by the API layer but absent from the initial schema:

  users            (4): name, company, department, is_active
  products         (3): is_active, created_at, updated_at
  product_variants (3): code, is_active, created_at
  plans            (5): availability, notes, is_active, created_at, updated_at
  tax_rules        (7): tax_type, country, description, is_inclusive,
                         is_active, created_at, updated_at

All columns are additive (no existing columns dropped).
All new columns have server-side defaults so existing rows are unaffected.
The updated_at columns are managed at the ORM layer via onupdate=utc_now;
raw SQL UPDATE statements that bypass the ORM will not auto-update those timestamps.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "1bb07f8f7a17"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Timestamp server default expressed in MySQL-compatible SQL
_NOW = sa.text("CURRENT_TIMESTAMP(6)")


def upgrade() -> None:
    """Add all missing API-compatibility columns."""

    # ── users ─────────────────────────────────────────────────────────────────
    op.add_column("users", sa.Column("name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("company", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(255), nullable=True))
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )

    # ── products ──────────────────────────────────────────────────────────────
    op.add_column(
        "products",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "products",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )

    # ── product_variants ──────────────────────────────────────────────────────
    op.add_column("product_variants", sa.Column("code", sa.String(100), nullable=True))
    op.add_column(
        "product_variants",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "product_variants",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )

    # ── plans ─────────────────────────────────────────────────────────────────
    op.add_column(
        "plans",
        sa.Column("availability", sa.String(50), nullable=False, server_default="active"),
    )
    op.add_column("plans", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column(
        "plans",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "plans",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )
    op.add_column(
        "plans",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )

    # ── tax_rules ─────────────────────────────────────────────────────────────
    op.add_column(
        "tax_rules",
        sa.Column("tax_type", sa.String(50), nullable=False, server_default="percentage"),
    )
    op.add_column("tax_rules", sa.Column("country", sa.String(100), nullable=True))
    op.add_column("tax_rules", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "tax_rules",
        sa.Column(
            "is_inclusive", sa.Boolean(), nullable=False, server_default=sa.text("0")
        ),
    )
    op.add_column(
        "tax_rules",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column(
        "tax_rules",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )
    op.add_column(
        "tax_rules",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=_NOW,
        ),
    )


def downgrade() -> None:
    """Remove all columns added in this revision."""

    # ── tax_rules ─────────────────────────────────────────────────────────────
    op.drop_column("tax_rules", "updated_at")
    op.drop_column("tax_rules", "created_at")
    op.drop_column("tax_rules", "is_active")
    op.drop_column("tax_rules", "is_inclusive")
    op.drop_column("tax_rules", "description")
    op.drop_column("tax_rules", "country")
    op.drop_column("tax_rules", "tax_type")

    # ── plans ─────────────────────────────────────────────────────────────────
    op.drop_column("plans", "updated_at")
    op.drop_column("plans", "created_at")
    op.drop_column("plans", "is_active")
    op.drop_column("plans", "notes")
    op.drop_column("plans", "availability")

    # ── product_variants ──────────────────────────────────────────────────────
    op.drop_column("product_variants", "created_at")
    op.drop_column("product_variants", "is_active")
    op.drop_column("product_variants", "code")

    # ── products ──────────────────────────────────────────────────────────────
    op.drop_column("products", "updated_at")
    op.drop_column("products", "created_at")
    op.drop_column("products", "is_active")

    # ── users ─────────────────────────────────────────────────────────────────
    op.drop_column("users", "is_active")
    op.drop_column("users", "department")
    op.drop_column("users", "company")
    op.drop_column("users", "name")

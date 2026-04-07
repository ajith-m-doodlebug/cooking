"""CA profile subscription payment status + pointer to live subscription row.

Revision ID: 0002_ca_sub
Revises: 0001_initial
Create Date: 2026-04-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_ca_sub"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    subscriptionpaymentstatus = sa.Enum(
        "NONE", "PENDING", "ACTIVE", "EXPIRED", name="subscriptionpaymentstatus"
    )
    subscriptionpaymentstatus.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "ca_profiles",
        sa.Column(
            "subscription_payment_status",
            subscriptionpaymentstatus,
            nullable=False,
            server_default="NONE",
        ),
    )
    op.add_column(
        "ca_profiles",
        sa.Column("active_subscription_id", sa.String(36), nullable=True),
    )
    op.create_foreign_key(
        "fk_ca_profiles_active_subscription_id_subscriptions",
        "ca_profiles",
        "subscriptions",
        ["active_subscription_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_ca_profiles_active_subscription_id",
        "ca_profiles",
        ["active_subscription_id"],
    )

    op.execute(
        """
        UPDATE ca_profiles cp
        SET subscription_payment_status = 'ACTIVE',
            active_subscription_id = s.id
        FROM (
            SELECT DISTINCT ON (ca_id) id, ca_id
            FROM subscriptions
            WHERE is_active = true
              AND end_date IS NOT NULL
              AND end_date > NOW()
            ORDER BY ca_id, end_date DESC
        ) s
        WHERE cp.id = s.ca_id
        """
    )

    op.alter_column(
        "ca_profiles",
        "subscription_payment_status",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_ca_profiles_active_subscription_id_subscriptions",
        "ca_profiles",
        type_="foreignkey",
    )
    op.drop_index("ix_ca_profiles_active_subscription_id", table_name="ca_profiles")
    op.drop_column("ca_profiles", "active_subscription_id")
    op.drop_column("ca_profiles", "subscription_payment_status")

    subscriptionpaymentstatus = sa.Enum(
        "NONE", "PENDING", "ACTIVE", "EXPIRED", name="subscriptionpaymentstatus"
    )
    subscriptionpaymentstatus.drop(op.get_bind(), checkfirst=True)

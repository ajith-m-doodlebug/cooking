"""Initial schema — all tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── users ───────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=True, unique=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("role", sa.Enum("CA", "USER", name="userrole"), nullable=False),
        sa.Column("google_id", sa.String(255), nullable=True, unique=True),
        sa.Column("is_active", sa.Boolean, nullable=False, default=True),
        sa.Column("is_phone_verified", sa.Boolean, nullable=False, default=False),
        sa.Column("terms_accepted", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone", "users", ["phone"])

    # ─── terms_content ───────────────────────────────────────────────────────
    op.create_table(
        "terms_content",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("role", sa.Enum("CA", "USER", name="userrole"), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_terms_content_role", "terms_content", ["role"])

    # ─── terms_acceptance ────────────────────────────────────────────────────
    op.create_table(
        "terms_acceptance",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.Enum("CA", "USER", name="userrole"), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_terms_acceptance_user_id", "terms_acceptance", ["user_id"])

    # ─── ca_profiles ─────────────────────────────────────────────────────────
    op.create_table(
        "ca_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("icai_membership_number", sa.String(10), nullable=False, unique=True),
        sa.Column("cop_number", sa.String(20), nullable=True),
        sa.Column("year_of_qualification", sa.Integer, nullable=True),
        sa.Column("firm_name", sa.String(255), nullable=True),
        sa.Column("registered_office_address", sa.Text, nullable=True),
        sa.Column("verification_status", sa.Enum("PENDING", "VERIFIED", "FAILED", name="verificationstatus"), nullable=False, default="PENDING"),
        sa.Column("is_visible", sa.Boolean, nullable=False, default=False),
        sa.Column("onboarding_complete", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ca_profiles_user_id", "ca_profiles", ["user_id"])
    op.create_index("ix_ca_profiles_icai_membership_number", "ca_profiles", ["icai_membership_number"])
    op.create_index("ix_ca_profiles_verification_status", "ca_profiles", ["verification_status"])

    # ─── ca_verification_logs ────────────────────────────────────────────────
    op.create_table(
        "ca_verification_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attempt_number", sa.Integer, nullable=False, default=1),
        sa.Column("status", sa.Enum("PENDING", "VERIFIED", "FAILED", name="verificationstatus"), nullable=False),
        sa.Column("icai_number_queried", sa.String(10), nullable=False),
        sa.Column("submitted_name", sa.String(255), nullable=False),
        sa.Column("extracted_name", sa.String(255), nullable=True),
        sa.Column("match_score", sa.Float, nullable=True),
        sa.Column("raw_html", sa.Text, nullable=True),
        sa.Column("failure_reason", sa.Text, nullable=True),
        sa.Column("checked_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ca_verification_logs_ca_id", "ca_verification_logs", ["ca_id"])

    # ─── ca_service_details ──────────────────────────────────────────────────
    op.create_table(
        "ca_service_details",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("services", sa.JSON, nullable=False),
        sa.Column("consultation_mode", sa.Enum("ONLINE", "IN_PERSON", "BOTH", name="consultationmode"), nullable=False),
        sa.Column("languages", sa.JSON, nullable=False),
        sa.Column("experience_years", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ca_service_details_ca_id", "ca_service_details", ["ca_id"])

    # ─── ca_booking_details ──────────────────────────────────────────────────
    op.create_table(
        "ca_booking_details",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("slot_duration_minutes", sa.Integer, nullable=False, default=30),
        sa.Column("available_days", sa.JSON, nullable=False),
        sa.Column("time_slots", sa.JSON, nullable=False),
        sa.Column("fee_online", sa.Float, nullable=True),
        sa.Column("fee_inperson", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ca_booking_details_ca_id", "ca_booking_details", ["ca_id"])

    # ─── subscriptions ───────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("gateway_order_id", sa.String(100), nullable=True),
        sa.Column("gateway_payment_id", sa.String(100), nullable=True),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("gst_amount", sa.Float, nullable=False, default=0.0),
        sa.Column("total_amount", sa.Float, nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, default=False),
        sa.Column("invoice_id", sa.String(36), nullable=True),
        sa.Column("raw_gateway_response", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subscriptions_ca_id", "subscriptions", ["ca_id"])
    op.create_index("ix_subscriptions_is_active", "subscriptions", ["is_active"])

    # ─── bookings ────────────────────────────────────────────────────────────
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("service", sa.String(255), nullable=False),
        sa.Column("consultation_mode", sa.String(20), nullable=False),
        sa.Column("booking_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slot_start", sa.String(10), nullable=False),
        sa.Column("slot_end", sa.String(10), nullable=False),
        sa.Column("fee_ca", sa.Float, nullable=False),
        sa.Column("status", sa.Enum("SLOT_LOCKED", "PAYMENT_PENDING", "CONFIRMED", "CANCELLED_BY_USER", "CANCELLED_BY_CA", "COMPLETED", name="bookingstatus"), nullable=False),
        sa.Column("meeting_id", sa.String(255), nullable=True),
        sa.Column("meeting_join_url", sa.Text, nullable=True),
        sa.Column("cancellation_reason", sa.Text, nullable=True),
        sa.Column("is_refunded", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bookings_ca_id", "bookings", ["ca_id"])
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])

    # ─── payments ────────────────────────────────────────────────────────────
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("gateway_order_id", sa.String(100), nullable=False),
        sa.Column("gateway_payment_id", sa.String(100), nullable=True),
        sa.Column("gateway_refund_id", sa.String(100), nullable=True),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("refunded_amount", sa.Float, nullable=False, default=0.0),
        sa.Column("status", sa.Enum("PENDING", "SUCCESS", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", name="paymentstatus"), nullable=False),
        sa.Column("raw_gateway_response", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])
    op.create_index("ix_payments_gateway_order_id", "payments", ["gateway_order_id"])
    op.create_index("ix_payments_status", "payments", ["status"])

    # ─── invoices ────────────────────────────────────────────────────────────
    op.create_table(
        "invoices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("payment_id", sa.String(36), sa.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invoice_number", sa.String(50), nullable=False, unique=True),
        sa.Column("invoice_type", sa.Enum("BOOKING", "SUBSCRIPTION", name="invoicetype"), nullable=False),
        sa.Column("ca_fee", sa.Float, nullable=False, default=0.0),
        sa.Column("platform_fee", sa.Float, nullable=False, default=0.0),
        sa.Column("gst_amount", sa.Float, nullable=False, default=0.0),
        sa.Column("total_amount", sa.Float, nullable=False),
        sa.Column("pdf_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_invoices_payment_id", "invoices", ["payment_id"])

    # ─── settlements ─────────────────────────────────────────────────────────
    op.create_table(
        "settlements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("booking_id", sa.String(36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ca_amount", sa.Float, nullable=False),
        sa.Column("platform_amount", sa.Float, nullable=False),
        sa.Column("is_settled", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_settlements_booking_id", "settlements", ["booking_id"])
    op.create_index("ix_settlements_ca_id", "settlements", ["ca_id"])

    # ─── notifications ───────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("notification_type", sa.String(50), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, nullable=False, default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # ─── bank_details ─────────────────────────────────────────────────────────
    op.create_table(
        "bank_details",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("ca_id", sa.String(36), sa.ForeignKey("ca_profiles.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("account_holder_name", sa.String(255), nullable=False),
        sa.Column("account_number", sa.String(50), nullable=False),
        sa.Column("ifsc_code", sa.String(20), nullable=False),
        sa.Column("bank_name", sa.String(255), nullable=True),
        sa.Column("upi_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bank_details_ca_id", "bank_details", ["ca_id"])


def downgrade() -> None:
    op.drop_table("bank_details")
    op.drop_table("notifications")
    op.drop_table("settlements")
    op.drop_table("invoices")
    op.drop_table("payments")
    op.drop_table("bookings")
    op.drop_table("subscriptions")
    op.drop_table("ca_booking_details")
    op.drop_table("ca_service_details")
    op.drop_table("ca_verification_logs")
    op.drop_table("ca_profiles")
    op.drop_table("terms_acceptance")
    op.drop_table("terms_content")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS verificationstatus")
    op.execute("DROP TYPE IF EXISTS consultationmode")
    op.execute("DROP TYPE IF EXISTS bookingstatus")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS invoicetype")

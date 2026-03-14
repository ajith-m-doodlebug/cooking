"""
Seed initial Terms & Conditions for CA and User roles (version 1.0.0).
Idempotent: only inserts if no row exists for that role with version 1.0.0.

Run from repo root: docker compose -p cooking run --rm api python -m app.scripts.seed_terms
"""
import asyncio
import sys
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.modules.auth.models import UserRole
from app.modules.terms.models import TermsContent


TERMS_VERSION = "1.0.0"

CA_CONTENT = """1. Professional Eligibility

You confirm that you are a valid member of the Institute of Chartered Accountants of India and that all information provided during onboarding is accurate and truthful.

2. Compliance with ICAI Regulations

You agree to comply with all applicable professional regulations, including the ICAI Code of Ethics and any guidelines related to professional conduct, advertising, and solicitation.

3. Platform Role

This platform operates only as a technology facilitator that enables users to discover and book consultations with independent Chartered Accountants. The platform does not endorse, recommend, or certify any CA.

4. Accuracy of Information

You are responsible for ensuring that your profile information, service details, fees, and availability are accurate and kept up to date.

5. Professional Responsibility

All professional advice, consultation, or services provided through bookings made on this platform are the sole responsibility of the Chartered Accountant providing the service.

6. Payments and Fees

You may set your own consultation fees. The platform may charge a separate platform fee to users for facilitating the booking.

7. Verification

Your membership details may be verified periodically. If your membership status becomes inactive or invalid, your profile may be suspended or removed from the platform.

8. Platform Usage

You agree not to misuse the platform, provide misleading information, or engage in activities that violate applicable laws or professional regulations.

9. Limitation of Liability

The platform is not responsible for the outcome of professional services provided by Chartered Accountants to users.

10. Changes to Terms

These Terms may be updated from time to time. Continued use of the platform constitutes acceptance of the updated Terms."""

USER_CONTENT = """1. Platform Nature

This platform is a technology service that allows users to discover and book consultations with independent Chartered Accountants. The platform does not provide professional accounting or tax services.

2. Independent Professionals

All Chartered Accountants listed on the platform are independent professionals. The platform does not endorse or guarantee the services or advice provided by any CA.

3. Booking and Payments

When you make a booking, you agree to pay the consultation fee set by the CA along with any applicable platform fees and taxes displayed at the time of payment.

4. User Responsibility

You are responsible for providing accurate information when booking a consultation and for attending the scheduled session on time.

5. Cancellation and Rescheduling

Bookings may be cancelled or rescheduled according to the platform's cancellation policy where applicable.

6. Professional Advice

Any advice or service provided during a consultation is solely the responsibility of the Chartered Accountant providing the service.

7. Acceptable Use

You agree not to misuse the platform, harass professionals, or engage in any unlawful or inappropriate activity.

8. Limitation of Liability

The platform is not responsible for the professional advice, services, or outcomes resulting from consultations between users and Chartered Accountants.

9. Changes to Terms

These Terms may be updated from time to time. Continued use of the platform constitutes acceptance of the updated Terms."""


async def seed_terms() -> int:
    """Insert CA and User terms as version 1.0.0 if not already present. Returns number of rows inserted."""
    inserted = 0
    async with AsyncSessionLocal() as session:
        for role, content in [(UserRole.CA, CA_CONTENT), (UserRole.USER, USER_CONTENT)]:
            result = await session.execute(
                select(TermsContent).where(
                    TermsContent.role == role,
                    TermsContent.version == TERMS_VERSION,
                )
            )
            if result.scalar_one_or_none() is not None:
                continue
            row = TermsContent(
                role=role,
                version=TERMS_VERSION,
                content=content.strip(),
                is_active=True,
            )
            session.add(row)
            inserted += 1
        await session.commit()
    return inserted


def main() -> None:
    try:
        n = asyncio.run(seed_terms())
        if n:
            print(f"Seeded {n} Terms & Conditions row(s) (version {TERMS_VERSION}).")
        else:
            print(f"Terms & Conditions (version {TERMS_VERSION}) already present for both roles.")
    except Exception as e:
        print(f"seed_terms failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

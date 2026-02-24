import asyncio
import time
from datetime import datetime, timezone

from app.celery_app import celery_app
from app.modules.ca.models import VerificationStatus


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    name="app.modules.verification.tasks.verify_icai_membership",
    max_retries=3,
    default_retry_delay=2,
)
def verify_icai_membership(self, ca_id: str, icai_number: str, submitted_name: str):
    """
    Celery task: verify CA membership against ICAI LOM portal.

    Retry policy:
      - Network errors only: exponential backoff (2s → 4s → 8s), up to 3 attempts
      - Logic failures (no record, name mismatch): final — no retry
    """
    from app.database import AsyncSessionLocal
    from app.modules.verification.service import ICAIVerificationService
    from app.modules.verification.models import CAVerificationLog
    from app.modules.ca.models import CAProfile

    attempt_number = (self.request.retries or 0) + 1

    async def _execute():
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select

            # Determine current attempt count
            result = await db.execute(
                select(CAVerificationLog).where(CAVerificationLog.ca_id == ca_id)
            )
            existing_count = len(result.scalars().all())

            status = VerificationStatus.PENDING
            extracted_name = None
            match_score = None
            failure_reason = None
            raw_html = None

            try:
                scrape_result = ICAIVerificationService.scrape_lom(icai_number)
                raw_html = scrape_result["raw_html"]

                if not scrape_result["found"]:
                    status = VerificationStatus.FAILED
                    failure_reason = "No member record found in ICAI LOM for this membership number"
                else:
                    extracted_name = scrape_result["extracted_name"]
                    matched, score = ICAIVerificationService.name_matches(
                        submitted_name, extracted_name
                    )
                    match_score = score

                    if matched:
                        status = VerificationStatus.VERIFIED
                    else:
                        status = VerificationStatus.FAILED
                        failure_reason = (
                            f"Name mismatch. ICAI record: '{extracted_name}', "
                            f"Submitted: '{submitted_name}', Score: {score:.1f}/100"
                        )

            except ConnectionError as exc:
                # Network error — eligible for retry
                log_entry = CAVerificationLog(
                    ca_id=ca_id,
                    attempt_number=existing_count + 1,
                    status=VerificationStatus.PENDING,
                    icai_number_queried=icai_number,
                    submitted_name=submitted_name,
                    failure_reason=f"Network error (attempt {attempt_number}): {exc}",
                    checked_at=datetime.now(timezone.utc),
                )
                db.add(log_entry)
                await db.commit()
                raise exc

            log_entry = CAVerificationLog(
                ca_id=ca_id,
                attempt_number=existing_count + 1,
                status=status,
                icai_number_queried=icai_number,
                submitted_name=submitted_name,
                extracted_name=extracted_name,
                match_score=match_score,
                raw_html=raw_html,
                failure_reason=failure_reason,
                checked_at=datetime.now(timezone.utc),
            )
            db.add(log_entry)

            # Update CA profile status
            ca_result = await db.execute(
                select(CAProfile).where(CAProfile.id == ca_id)
            )
            profile = ca_result.scalar_one_or_none()
            if profile:
                profile.verification_status = status

            await db.commit()

            # Fire notification
            from app.modules.notifications.service import NotificationService
            notification_message = {
                VerificationStatus.VERIFIED: "Your ICAI membership has been verified. You can now activate your subscription.",
                VerificationStatus.FAILED: f"Verification failed. {failure_reason}. Please re-submit your details.",
            }.get(status, "Verification in progress.")

            await NotificationService.create(
                db=db,
                user_id=profile.user_id if profile else ca_id,
                notification_type="VERIFICATION_STATUS",
                message=notification_message,
            )

    try:
        _run_async(_execute())
    except ConnectionError as exc:
        # Exponential backoff: 2^retry_count * base_delay
        countdown = (2 ** self.request.retries) * 2
        raise self.retry(exc=exc, countdown=countdown)

import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup
from thefuzz import fuzz
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import settings
from app.core.exceptions import NotFoundError
from app.modules.ca.models import CAProfile, VerificationStatus
from .models import CAVerificationLog
from .schemas import VerificationStatusResponse, VerificationLogEntry


class ICAIVerificationService:

    @staticmethod
    def scrape_lom(membership_number: str) -> dict:
        """
        POST to ICAI LOM and parse the HTML response.
        Returns dict with keys: found (bool), extracted_name (str|None), raw_html (str).
        """
        try:
            with httpx.Client(timeout=15) as client:
                response = client.post(
                    settings.ICAI_LOM_URL,
                    data={"MemberNo": membership_number},
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "User-Agent": "Mozilla/5.0",
                    },
                    follow_redirects=True,
                )
                raw_html = response.text
        except httpx.RequestError as e:
            raise ConnectionError(f"Network error contacting ICAI LOM: {e}")

        soup = BeautifulSoup(raw_html, "lxml")
        page_text = soup.get_text(separator=" ", strip=True)

        if "No records returned" in page_text:
            return {"found": False, "extracted_name": None, "raw_html": raw_html}

        # Extract name from table — typically the first non-header table cell row
        extracted_name = None
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    candidate = cells[0].get_text(strip=True)
                    # Skip if it looks like a header or a number
                    if candidate and not candidate.isdigit() and len(candidate) > 3:
                        extracted_name = candidate
                        break
            if extracted_name:
                break

        return {
            "found": extracted_name is not None,
            "extracted_name": extracted_name,
            "raw_html": raw_html,
        }

    @staticmethod
    def name_matches(submitted: str, extracted: str) -> tuple[bool, float]:
        score = fuzz.token_sort_ratio(submitted.upper(), extracted.upper())
        return score >= settings.ICAI_VERIFICATION_FUZZY_THRESHOLD, float(score)

    @staticmethod
    async def get_status(db: AsyncSession, ca_id: str) -> VerificationStatusResponse:
        result = await db.execute(
            select(CAProfile).where(CAProfile.id == ca_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("CA Profile")

        log_result = await db.execute(
            select(CAVerificationLog)
            .where(CAVerificationLog.ca_id == ca_id)
            .order_by(CAVerificationLog.checked_at.desc())
            .limit(1)
        )
        last_log = log_result.scalar_one_or_none()

        return VerificationStatusResponse(
            ca_id=ca_id,
            verification_status=profile.verification_status,
            last_checked_at=last_log.checked_at if last_log else None,
            failure_reason=last_log.failure_reason if last_log else None,
        )

    @staticmethod
    async def get_logs(
        db: AsyncSession,
        ca_id: str,
        page: int = 1,
        size: int = 20,
    ) -> list[VerificationLogEntry]:
        result = await db.execute(
            select(CAVerificationLog)
            .where(CAVerificationLog.ca_id == ca_id)
            .order_by(CAVerificationLog.checked_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        return [VerificationLogEntry.model_validate(r) for r in result.scalars().all()]

    @staticmethod
    async def get_attempt_count(db: AsyncSession, ca_id: str) -> int:
        result = await db.execute(
            select(func.count()).where(CAVerificationLog.ca_id == ca_id)
        )
        return result.scalar_one() or 0

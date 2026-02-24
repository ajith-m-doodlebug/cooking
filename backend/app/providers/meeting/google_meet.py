import uuid
from datetime import datetime, timezone
import httpx

from app.config import settings
from app.core.exceptions import ProviderError
from .base import MeetingProvider, MeetingDetails

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"


class GoogleMeetProvider(MeetingProvider):
    """
    Creates Google Meet meetings via the Google Calendar API.
    Each event with conferenceData becomes a Meet session.
    """

    def _get_access_token(self) -> str:
        try:
            with httpx.Client(timeout=10) as client:
                response = client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": settings.GOOGLE_MEET_CLIENT_ID,
                        "client_secret": settings.GOOGLE_MEET_CLIENT_SECRET,
                        "refresh_token": settings.GOOGLE_MEET_REFRESH_TOKEN,
                        "grant_type": "refresh_token",
                    },
                )
                response.raise_for_status()
                return response.json()["access_token"]
        except Exception as e:
            raise ProviderError("GoogleMeet", f"Token refresh failed: {e}")

    def create_meeting(
        self,
        title: str,
        start_time: datetime,
        duration_min: int,
        description: str = "",
    ) -> MeetingDetails:
        try:
            from datetime import timedelta

            token = self._get_access_token()
            end_time = start_time + timedelta(minutes=duration_min)

            event_body = {
                "summary": title,
                "description": description,
                "start": {"dateTime": start_time.isoformat(), "timeZone": "Asia/Kolkata"},
                "end": {"dateTime": end_time.isoformat(), "timeZone": "Asia/Kolkata"},
                "conferenceData": {
                    "createRequest": {
                        "requestId": str(uuid.uuid4()),
                        "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    }
                },
            }

            with httpx.Client(timeout=15) as client:
                response = client.post(
                    f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
                    params={"conferenceDataVersion": 1},
                    json=event_body,
                    headers={"Authorization": f"Bearer {token}"},
                )
                response.raise_for_status()
                event = response.json()

            meet_url = ""
            for entry in event.get("conferenceData", {}).get("entryPoints", []):
                if entry.get("entryPointType") == "video":
                    meet_url = entry.get("uri", "")
                    break

            return MeetingDetails(
                meeting_id=event["id"],
                join_url=meet_url,
                host_url=meet_url,
                title=event["summary"],
                start_time=start_time,
                duration_min=duration_min,
            )
        except ProviderError:
            raise
        except Exception as e:
            raise ProviderError("GoogleMeet", str(e))

    def get_join_url(self, meeting_id: str) -> str:
        try:
            token = self._get_access_token()
            with httpx.Client(timeout=10) as client:
                response = client.get(
                    f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{meeting_id}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                response.raise_for_status()
                event = response.json()

            for entry in event.get("conferenceData", {}).get("entryPoints", []):
                if entry.get("entryPointType") == "video":
                    return entry.get("uri", "")
            return ""
        except Exception as e:
            raise ProviderError("GoogleMeet", str(e))

    def cancel_meeting(self, meeting_id: str) -> bool:
        try:
            token = self._get_access_token()
            with httpx.Client(timeout=10) as client:
                response = client.delete(
                    f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{meeting_id}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                return response.status_code in (200, 204)
        except Exception as e:
            raise ProviderError("GoogleMeet", str(e))

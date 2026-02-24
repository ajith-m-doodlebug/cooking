from functools import lru_cache

from app.config import settings
from .base import MeetingProvider


@lru_cache(maxsize=1)
def get_meeting_provider() -> MeetingProvider:
    provider = settings.MEETING_PROVIDER.lower()
    if provider == "google_meet":
        from .google_meet import GoogleMeetProvider
        return GoogleMeetProvider()
    raise ValueError(f"Unknown meeting provider: '{provider}'. Add its implementation to app/providers/meeting/")

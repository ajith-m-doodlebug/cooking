from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class MeetingDetails:
    meeting_id: str
    join_url: str
    host_url: str
    title: str
    start_time: datetime
    duration_min: int


class MeetingProvider(ABC):
    """
    Abstract contract for all online meeting providers.
    Switching providers requires only adding a new file here and updating MEETING_PROVIDER env var.
    """

    @abstractmethod
    def create_meeting(
        self,
        title: str,
        start_time: datetime,
        duration_min: int,
        description: str = "",
    ) -> MeetingDetails:
        """Create a meeting and return its details."""
        ...

    @abstractmethod
    def get_join_url(self, meeting_id: str) -> str:
        """Retrieve the join URL for an existing meeting."""
        ...

    @abstractmethod
    def cancel_meeting(self, meeting_id: str) -> bool:
        """Cancel/delete an existing meeting. Returns True on success."""
        ...

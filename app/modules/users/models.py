# User model lives in auth/models.py to avoid circular imports.
# This file re-exports it for module-level imports.
from app.modules.auth.models import User, UserRole  # noqa: F401

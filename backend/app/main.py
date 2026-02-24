from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler

from app.modules.auth.router import router as auth_router
from app.modules.terms.router import router as terms_router
from app.modules.users.router import router as users_router
from app.modules.ca.router import router as ca_router
from app.modules.verification.router import router as verification_router
from app.modules.search.router import router as search_router
from app.modules.bookings.router import router as bookings_router
from app.modules.payments.router import router as payments_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.notifications.router import router as notifications_router
from app.modules.settings.router import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(terms_router, prefix="/terms", tags=["Terms & Conditions"])
    app.include_router(users_router, prefix="/users", tags=["Users"])
    app.include_router(ca_router, prefix="/ca", tags=["Chartered Accountants"])
    app.include_router(verification_router, prefix="/verification", tags=["ICAI Verification"])
    app.include_router(search_router, prefix="/search", tags=["Search"])
    app.include_router(bookings_router, prefix="/bookings", tags=["Bookings"])
    app.include_router(payments_router, prefix="/payments", tags=["Payments"])
    app.include_router(subscriptions_router, prefix="/subscriptions", tags=["Subscriptions"])
    app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
    app.include_router(settings_router, prefix="/settings", tags=["Settings"])

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()

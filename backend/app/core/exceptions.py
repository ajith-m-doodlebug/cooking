import logging

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str | None = None):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code or f"ERR_{status_code}"


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found",
            code="NOT_FOUND",
        )


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code="UNAUTHORIZED",
        )


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code="FORBIDDEN",
        )


class ConflictError(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code="CONFLICT",
        )


class ValidationError(AppException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            code="VALIDATION_ERROR",
        )


class PaymentError(AppException):
    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=detail,
            code="PAYMENT_ERROR",
        )


class ProviderError(AppException):
    def __init__(self, provider: str, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{provider} error: {detail}",
            code="PROVIDER_ERROR",
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.detail}},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if settings.APP_ENV == "development":
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(exc) or "An unexpected error occurred",
                    "exception_type": type(exc).__name__,
                }
            },
        )
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )

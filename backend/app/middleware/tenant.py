import time
import uuid
import logging
import jwt
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.context import (
    set_request_context,
    request_id_ctx,
    correlation_id_ctx,
    org_id_ctx,
    user_id_ctx,
    route_ctx,
    status_code_ctx,
    start_time_ctx,
)

logger = logging.getLogger("app.middleware.tenant")


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Track Request Lifecycle Start
        start_time = time.perf_counter()
        
        # 2. Extract or Generate Request ID & Correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # 3. Extract JWT Token claims if present to resolve tenant context
        org_id = ""
        user_id = ""
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(
                    token, 
                    settings.JWT_SECRET, 
                    algorithms=[settings.JWT_ALGORITHM],
                    options={"verify_signature": True, "verify_exp": False}
                )
                org_id = payload.get("org_id", "")
                user_id = payload.get("sub", "")
            except Exception:
                pass

        # 4. Bind variables to ContextVars
        set_request_context(
            request_id=request_id,
            correlation_id=correlation_id,
            org_id=org_id,
            user_id=user_id,
            route=request.url.path,
            start_time=start_time
        )
        status_code_ctx.set(200)

        try:
            response = await call_next(request)
            status_code_ctx.set(response.status_code)
            
            # 5. Inject Tracing and Security Headers
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
            
            if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; "
                    "img-src 'self' data: https://fastapi.tiangolo.com; "
                    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                    "frame-ancestors 'none';"
                )
            else:
                response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
            
            duration = (time.perf_counter() - start_time) * 1000
            logger.info(
                f"HTTP {request.method} {request.url.path} responded {response.status_code}",
                extra={
                    "status_code": response.status_code,
                    "duration_ms": round(duration, 2)
                }
            )
            return response
            
        except Exception as exc:
            status_code_ctx.set(500)
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Uncaught exception handling HTTP {request.method} {request.url.path}",
                exc_info=True,
                extra={
                    "status_code": 500,
                    "duration_ms": round(duration, 2)
                }
            )
            raise exc

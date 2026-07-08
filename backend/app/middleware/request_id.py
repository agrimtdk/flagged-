import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import correlation_id_ctx, org_id_ctx, user_id_ctx

logger = logging.getLogger("app.middleware.request_id")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID")
        if not correlation_id:
            correlation_id = str(uuid.uuid4())

        # Set correlation ID context
        correlation_token = correlation_id_ctx.set(correlation_id)
        
        # Reset org/user contexts
        org_token = org_id_ctx.set("")
        user_token = user_id_ctx.set("")

        # Track response duration
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
            process_time = (time.perf_counter() - start_time) * 1000
            
            # Add correlation header to response
            response.headers["X-Correlation-ID"] = correlation_id
            
            # Log successful requests
            logger.info(
                "Request processed",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "duration_ms": round(process_time, 2)
                }
            )
            return response
            
        except Exception as exc:
            process_time = (time.perf_counter() - start_time) * 1000
            # Log uncaught errors
            logger.error(
                "Request failed",
                exc_info=True,
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": 500,
                    "duration_ms": round(process_time, 2)
                }
            )
            raise exc
            
        finally:
            # Clean up context variables
            correlation_id_ctx.reset(correlation_token)
            org_id_ctx.reset(org_token)
            user_id_ctx.reset(user_token)

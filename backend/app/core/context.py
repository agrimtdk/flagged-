from contextvars import ContextVar
from typing import Optional

# Request-scoped context variables for structured observability
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")
org_id_ctx: ContextVar[str] = ContextVar("org_id", default="")
user_id_ctx: ContextVar[str] = ContextVar("user_id", default="")
route_ctx: ContextVar[str] = ContextVar("route", default="")
status_code_ctx: ContextVar[int] = ContextVar("status_code", default=200)
start_time_ctx: ContextVar[float] = ContextVar("start_time", default=0.0)


def set_request_context(
    request_id: str,
    correlation_id: Optional[str] = "",
    org_id: Optional[str] = "",
    user_id: Optional[str] = "",
    route: Optional[str] = "",
    start_time: Optional[float] = 0.0
):
    request_id_ctx.set(request_id)
    correlation_id_ctx.set(correlation_id or request_id)
    org_id_ctx.set(org_id or "")
    user_id_ctx.set(user_id or "")
    route_ctx.set(route or "")
    if start_time:
        start_time_ctx.set(start_time)

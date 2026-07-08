import logging
import sys
import time
from pythonjsonlogger import jsonlogger
from app.core.context import (
    request_id_ctx,
    correlation_id_ctx,
    org_id_ctx,
    user_id_ctx,
    route_ctx,
    status_code_ctx,
    start_time_ctx,
)


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        # Inject unified request observability context variables
        log_record["request_id"] = request_id_ctx.get()
        log_record["correlation_id"] = correlation_id_ctx.get() or request_id_ctx.get()
        log_record["organization_id"] = org_id_ctx.get()
        log_record["user_id"] = user_id_ctx.get()
        log_record["route"] = route_ctx.get()
        log_record["status_code"] = record.__dict__.get("status_code", status_code_ctx.get())
        
        # Calculate active execution duration
        start = start_time_ctx.get()
        if start > 0:
            log_record["execution_time_ms"] = round((time.perf_counter() - start) * 1000, 2)
        else:
            log_record["execution_time_ms"] = 0.0

        # Standard logs configuration
        log_record["level"] = record.levelname
        log_record["timestamp"] = self.formatTime(record, self.datefmt)
        if "asctime" in log_record:
            del log_record["asctime"]


def setup_logging():
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    log_handler = logging.StreamHandler(sys.stdout)
    
    formatter = CustomJsonFormatter(
        "%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(correlation_id)s %(organization_id)s %(user_id)s %(route)s %(status_code)s",
        datefmt="%Y-%m-%dT%H:%M:%S.000Z"
    )
    log_handler.setFormatter(formatter)
    
    root_logger.addHandler(log_handler)
    root_logger.setLevel(logging.INFO)

    # Propagate uvicorn access logs cleanly to console with structured JSON
    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.handlers = []
    uvicorn_access.propagate = True

# Stage 1: Build dependency wheels and install packages
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production runtime image
FROM python:3.11-slim AS production

LABEL maintainer="FLAGGED! DevOps <devops@flagged.io>"
LABEL description="Production runtime for FLAGGED! Fraud Detection Engine"
LABEL version="1.0.0"

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV ML_ARTIFACT_DIR=/app/ml/artifacts
ENV ENV=production

# Install essential runtime tools (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled python packages from builder stage
COPY --from=builder /install /usr/local

# Create non-root system user and group for security
RUN groupadd -g 10001 flaggedgroup && \
    useradd -u 10001 -g flaggedgroup -s /bin/bash -m flaggeduser

# Copy application code and ML model artifacts
COPY --chown=flaggeduser:flaggedgroup backend/ /app/
COPY --chown=flaggeduser:flaggedgroup ml/ /app/ml/

USER flaggeduser

EXPOSE 8000

# Container healthcheck against backend liveness endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--no-access-log"]

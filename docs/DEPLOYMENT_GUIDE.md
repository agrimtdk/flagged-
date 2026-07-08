# FLAGGED! Production Deployment Guide

This guide details the procedures for deploying the FLAGGED! B2B SaaS Fraud Detection Platform into a production environment using Docker Compose, Nginx reverse proxying, and secure network configurations.

---

## 1. System Requirements

### Minimum Production Hardware
- **CPU:** 4 Cores (x86_64 or ARM64)
- **Memory:** 8 GB RAM (recommended 16 GB for heavy in-memory Redis caching and CatBoost ML inference)
- **Storage:** 50 GB SSD (for database growth and ML model artifacts)
- **Operating System:** Ubuntu 22.04 LTS / Debian 12 / RHEL 9 / Windows Server w/ Docker Desktop

---

## 2. Pre-Deployment Configuration

### Step 1: Clone Repository & Prepare Environment
```bash
git clone https://github.com/flagged-saas/flagged.git
cd flagged!
cp .env.example .env
```

### Step 2: Configure Production Secrets
Edit `.env` and configure strong, production-grade credentials:
```ini
ENV=production
DEBUG=false
PROJECT_NAME="FLAGGED! Enterprise"
VERSION=1.0.0

# Database Credentials (Must be strong alphanumeric strings)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=flagged_prod_admin
POSTGRES_PASSWORD=YourStrongRandomPasswordHere!2026
POSTGRES_DB=flagged_production_db

# Redis Connection
REDIS_URL=redis://redis:6379/0

# Security (MUST CHANGE IN PRODUCTION)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c9213198a2e105e1a49870425a4d1f2e3
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Allowed Origins for CORS
ALLOWED_ORIGINS=https://app.flagged.io,https://api.flagged.io
```

> [!CAUTION]
> If `JWT_SECRET` is left as the default example string, the backend container will trigger a fail-fast security check and terminate immediately upon boot.

---

## 3. Docker Compose Production Deployment

### Step 1: Launch Stack
To start the production containers without development overrides:
```bash
docker compose -f docker-compose.yml up -d --build
```

### Step 2: Verify Container Readiness
Check that all containers transition to `healthy`:
```bash
docker compose ps
```
Expected output:
```
NAME               STATUS                     PORTS
flagged_postgres   Up 2 minutes (healthy)     0.0.0.0:5432->5432/tcp
flagged_redis      Up 2 minutes (healthy)     0.0.0.0:6379->6379/tcp
flagged_backend    Up 2 minutes (healthy)     0.0.0.0:8000->8000/tcp
flagged_frontend   Up 2 minutes (healthy)     0.0.0.0:80->80/tcp
```

---

## 4. SSL/TLS & Domain Configuration (Nginx / Cloudflare / Let's Encrypt)

In production, terminate SSL/TLS at an upstream load balancer (e.g., Cloudflare, AWS ALB, or Let's Encrypt w/ Certbot).

### Example Nginx SSL Configuration snippet (`/etc/nginx/conf.d/default.conf`):
```nginx
server {
    listen 443 ssl http2;
    server_name app.flagged.io;

    ssl_certificate /etc/letsencrypt/live/app.flagged.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flagged.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Scaling & Performance Tuning

### Horizontal Scaling (Backend API)
To scale the stateless backend inference engines across multiple containers:
```bash
docker compose up -d --scale backend=3
```
*Note: Ensure your load balancer (e.g., Nginx upstream block) is configured to round-robin requests across scaled containers.*

### Database Connection Pooling
The backend utilizes an async connection pool (`pool_size=20, max_overflow=10`). For deployments exceeding 50 concurrent backend containers, deploy **PgBouncer** in front of PostgreSQL.

---

## 6. Troubleshooting Guide

### Issue: Backend Container Restarts Continuously
- **Diagnosis:** Run `docker logs flagged_backend`.
- **Cause:** Likely a failed fail-fast security check (default `JWT_SECRET`) or inability to reach PostgreSQL/Redis within timeout.
- **Resolution:** Check `.env` credentials and ensure `postgres` and `redis` containers are marked `healthy`.

### Issue: 503 Service Unavailable on `/health/ready`
- **Diagnosis:** Run `curl http://localhost:8000/health/dependencies`.
- **Cause:** One of the core dependencies (Database, Redis, or ML Engine) is unresponsive.
- **Resolution:** If `ml_engine` reports `not_loaded`, verify that model files exist in `/app/ml/artifacts/` inside the container.

### Issue: CSV Upload Returns 413 Payload Too Large
- **Diagnosis:** Upload file exceeds default client body limit.
- **Resolution:** Ensure `client_max_body_size 20M;` is properly set in `nginx/conf.d/default.conf` and restart Nginx: `docker restart flagged_frontend`.

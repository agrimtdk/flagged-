# FLAGGED! — Real-Time B2B SaaS Fraud Detection Platform

[![FLAGGED! CI/CD](https://github.com/flagged-saas/flagged/actions/workflows/ci.yml/badge.svg)](https://github.com/flagged-saas/flagged/actions/workflows/ci.yml)
[![Docker Support](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![React 18 + Vite](https://img.shields.io/badge/frontend-React%2018%20%7C%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**FLAGGED!** is a high-performance, enterprise-grade real-time B2B SaaS fraud detection and risk scoring platform. It empowers high-volume merchants, payment processors, and financial institutions to score transactions in milliseconds using machine learning, explainable AI, and granular role-based access control (RBAC).

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    Client[Web Clients / POS / API SDKs] -->|HTTPS / REST| Nginx[NGINX Reverse Proxy / CDN]
    Nginx -->|Static Assets| SPA[React 18 / Vite SPA]
    Nginx -->|Proxy /api/v1| FastAPI[FastAPI Async Backend (8000)]
    
    subgraph Core Backend Services
        FastAPI --> RBAC[Tenant & RBAC Middleware]
        RBAC --> Cache[Redis Cache Pool (6379)]
        RBAC --> DB[(PostgreSQL 15 + RLS (5432))]
        RBAC --> MLEngine[ML Engine / CatBoost Model]
    end
    
    subgraph Observability
        FastAPI --> JSONLogs[Structured JSON Observability]
        FastAPI --> Probes[/health Diagnostics Probes]
    end
```

### Key Capabilities
1. **Real-Time Inference (`< 20ms` latency):** CatBoost-powered machine learning scoring with SHAP feature importance explanations.
2. **Multi-Tenant Isolation:** PostgreSQL Row-Level Security (RLS) ensuring strict mathematical tenant separation at the database layer.
3. **High-Throughput Batch Ingestion:** Streaming CSV ingestion processing up to 50,000 transactions per batch with automated error tracking.
4. **Enterprise RBAC:** Granular role matrix supporting **Owner**, **Admin**, **Analyst**, and **Developer** roles with secure API Key management.
5. **Dynamic Design System:** Vibrant, theme-aware glassmorphism UI built with Vanilla CSS variables and React 18.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) v2.20+
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Run via Docker Compose (Recommended)
To spin up the full production-ready stack (PostgreSQL, Redis, FastAPI Backend, and Nginx/React Frontend):

```bash
# Clone repository
git clone https://github.com/flagged-saas/flagged.git
cd flagged!

# Start all containers in background
docker compose up -d

# Check container health status
docker compose ps
```

Access the application:
- **Frontend Dashboard:** [http://localhost](http://localhost)
- **Backend API Docs (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Aggregated Health Probe:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Run Local Development Environment (Hot-Reload)
To develop locally with live reload enabled for both frontend and backend:

```bash
# Start Docker with development overrides
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

---

## ⚙️ Environment Variables Documentation

Configure your environment variables in `.env` (or via CI/CD secrets manager). See `.env.example` for defaults.

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `ENV` | Yes | `production` | Runtime environment (`development`, `testing`, `production`). |
| `DEBUG` | Yes | `false` | Enable SQL query echo and debug traceback logging. |
| `PROJECT_NAME` | No | `flagged!` | Application identifier string. |
| `VERSION` | No | `1.0.0` | API version string reported in diagnostics. |
| `POSTGRES_HOST` | Yes | `postgres` | Database hostname or container name. |
| `POSTGRES_PORT` | Yes | `5432` | PostgreSQL TCP port. |
| `POSTGRES_USER` | Yes | `postgres` | Database admin user. |
| `POSTGRES_PASSWORD` | Yes | `postgres` | Database password (URL-encoded automatically). |
| `POSTGRES_DB` | Yes | `flagged_db` | Target database name. |
| `REDIS_URL` | Yes | `redis://redis:6379/0` | Connection string for Redis caching and rate limiting. |
| `JWT_SECRET` | Yes | `...` | 64-character secret key used for HMAC-SHA256 JWT signing. |
| `JWT_ALGORITHM` | No | `HS256` | Cryptographic signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Lifespan of short-lived JWT access tokens. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Lifespan of rotating refresh tokens. |
| `ALLOWED_ORIGINS` | Yes | `http://localhost,...` | Comma-separated list of CORS origins allowed. |
| `ML_ARTIFACT_DIR` | Yes | `/app/ml/artifacts` | Path to compiled `.cbm` models and feature encoders. |

> [!WARNING]
> In `production` mode (`ENV=production`), the backend enforces fail-fast validation and will refuse to boot if default/placeholder secrets are detected for `JWT_SECRET` or OAuth credentials.

---

## 📚 API Documentation

Once the backend is running, comprehensive OpenAPI / Swagger documentation is automatically generated:

- **Swagger UI Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Technical Specs:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON Schema:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Core Endpoints
- `POST /api/v1/auth/login` — Authenticate merchant and issue JWT + Refresh Token.
- `POST /api/v1/predict` — Real-time transaction scoring (< 20ms).
- `POST /api/v1/predict/batch/csv` — High-speed streaming CSV ingestion.
- `GET /api/v1/analytics/summary` — Full 11-metric dashboard analytics summary.
- `GET /health/dependencies` — Granular status latency probes for DB, Redis, and ML Engine.

---

## 🛠️ Project Quality & Testing

FLAGGED! adheres to strict automated code quality and test coverage standards.

### Running Automated Tests
```bash
# Run unit & API test suite (28 tests)
cd backend
venv\Scripts\python.exe -m pytest -v -o pythonpath=.
```

### Linter & Type Verification
```bash
# Backend linter & formatters
ruff check backend/
black --check backend/
mypy backend/app/

# Frontend type verification & linting
cd frontend
npm run lint
npm run build
```

---

## 📖 Additional Documentation
- [Production Deployment Guide](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/docs/DEPLOYMENT_GUIDE.md)
- [Release Checklist & Incident Response](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/docs/RELEASE_CHECKLIST.md)
- [Software Design Document (SDD)](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/software_design_document.md)

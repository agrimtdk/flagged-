# FLAGGED! -- Real-Time B2B SaaS Fraud Detection Platform

FLAGGED! is a high-performance, enterprise-grade real-time B2B SaaS fraud detection and risk scoring platform. It empowers high-volume merchants, payment processors, and financial institutions to score transactions in milliseconds using gradient-boosted decision trees, explainable AI, and granular role-based access control (RBAC).

---

## Problem Statement

Modern financial institutions and high-volume e-commerce merchants face an escalating trade-off between transaction security and friction. Rule-based fraud detection systems suffer from high false-positive rates, locking out legitimate customers and depressing realized utility, while basic machine learning classifiers lack the explainability and latency requirements necessary for real-time payment gateways.

FLAGGED! solves this challenge by decoupling low-latency scoring from heavy data persistence. By combining a CatBoost gradient boosting inference engine with explainable feature attribution (SHAP indicators) inside an asynchronous API pipeline, the platform delivers sub-20ms fraud evaluations while maintaining mathematical multi-tenant data isolation via PostgreSQL Row-Level Security (RLS).

---

## System Architecture

```mermaid
graph TD
    Client[Web Clients / POS / API SDKs] -->|HTTPS / REST| Nginx[NGINX Reverse Proxy / CDN]
    Nginx -->|Static Assets| SPA[React 18 / Vite Single-Page App]
    Nginx -->|Proxy /api/v1| FastAPI[FastAPI Async Backend]
    
    subgraph Core Backend Services
        FastAPI --> RBAC[Tenant & RBAC Middleware]
        RBAC --> Cache[Redis Cache Pool]
        RBAC --> DB[(PostgreSQL + Row-Level Security)]
        RBAC --> MLEngine[ML Engine / CatBoost Inference Pipeline]
    end
    
    subgraph Observability & Diagnostics
        FastAPI --> JSONLogs[Structured JSON Observability]
        FastAPI --> Probes[/health Diagnostics Probes]
    end
```

---

## Core Platform Capabilities

1. **Sub-20ms Real-Time Inference Pipeline:** High-speed transaction evaluation leveraging compiled CatBoost models (`.cbm`) and engineered behavioral feature vectors, producing calibrated fraud probabilities and confidence ratings (`Low`, `Medium`, `High`).
2. **Explainable AI (XAI) Diagnostics:** Automated generation of high-risk and low-risk indicator attributions per transaction, providing fraud analysts with human-readable rationale for flagged events.
3. **Strict Multi-Tenant Isolation:** PostgreSQL Row-Level Security (RLS) policies enforcing tenant-scoped data access across organizations, collections, and API keys.
4. **Real-Time Velocity Pulse & Telemetry:** Minute-by-minute streaming velocity pulse tracking incoming live REST API traffic alongside historical batch datasets.
5. **Realized Utility Valuation:** Dynamic financial modeling evaluating gross fraud savings minus false-positive operational costs across selected datasets.
6. **High-Throughput Batch Processing:** Asynchronous CSV ingestion engine supporting large dataset uploads up to 50,000 records per batch with granular row-level validation.

---

## Security & Role-Based Access Control (RBAC)

FLAGGED! enforces least-privilege access control across four distinct enterprise tiers:

| Role | Access Scope | Permissions & Capabilities |
| :--- | :--- | :--- |
| **Owner** | Full Tenant Control | Complete administrative access, billing management, organization settings, and audit logs. |
| **Admin** | Operations & Security | User management, API key rotation, system governance actions, and full dataset operations. |
| **Analyst** | Intelligence & Reports | Read-only access to transaction streams, fraud explainability informatics, and CSV data ingestion. |
| **Developer** | Integration & API | API key creation, REST endpoint integration testing, live stream diagnostics, and webhook debugging. |

---

## Environment Configuration Specification

All operational parameters and service endpoints are driven by environment variables. Refer to `.env.example` for reference templates.

| Variable | Required | Description |
| :--- | :---: | :--- |
| `ENV` | Yes | Target deployment environment (`development`, `testing`, `production`). |
| `PROJECT_NAME` | No | System application identifier string. |
| `POSTGRES_HOST` | Yes | PostgreSQL database host address. |
| `POSTGRES_PORT` | Yes | PostgreSQL listening TCP port. |
| `POSTGRES_USER` | Yes | Database authentication user account. |
| `POSTGRES_PASSWORD` | Yes | Database authentication password. |
| `POSTGRES_DB` | Yes | Target database schema name. |
| `REDIS_URL` | Yes | Connection string for Redis caching layer and rate limiter. |
| `JWT_SECRET` | Yes | Secret HMAC key for JSON Web Token signing. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Lifespan duration for short-lived access tokens. |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of permitted CORS web origins. |
| `ML_ARTIFACT_DIR` | Yes | Absolute directory path pointing to compiled ML model artifacts. |

---

## API Endpoints Overview

The platform provides a comprehensive OpenAPI REST interface:

- `POST /api/v1/auth/login` -- Authenticate merchant account and obtain scoped JWT tokens.
- `POST /api/v1/predict` -- Execute low-latency transaction scoring and feature attribution.
- `POST /api/v1/predict/batch/csv` -- Ingest and score multi-record CSV transaction datasets.
- `GET /api/v1/analytics/summary` -- Retrieve aggregated dashboard telemetry, velocity pulse, and realized utility.
- `GET /api/v1/analytics/timeline` -- Retrieve minute-level or daily transaction volume and fraud velocity series.
- `GET /health/dependencies` -- Deep dependency health verification across PostgreSQL, Redis, and ML Engine.

---

## License

This software is licensed under the MIT License. See the `LICENSE` file for details.

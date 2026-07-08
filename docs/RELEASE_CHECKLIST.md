# FLAGGED! Production Release Checklist & Incident Response Guide

This document defines the formal engineering protocols for releasing FLAGGED! into production, verifying system health, executing emergency rollbacks, and handling security/service incidents.

---

## ✅ 1. Production Release Checklist

Before tagging a release or merging into `production` branch, verify all items:

### Code Quality & Testing
- [x] **Automated Test Suite:** 100% pass rate across all 28 backend unit & integration tests (`pytest`).
- [x] **Static Type Checking:** Zero unresolved type errors reported by `mypy` and TypeScript (`tsc`).
- [x] **Code Formatting & Linting:** Codebase passes `black`, `ruff`, `isort`, and `eslint` inspections.
- [x] **Pre-commit Hooks:** All commit validation checks pass without warnings or secrets leaks.

### Security & Compliance
- [x] **Secrets Management:** No hardcoded JWT secrets, API keys, or OAuth credentials exist in source code.
- [x] **Fail-Fast Validation:** Production configuration rejects placeholder values upon boot.
- [x] **RBAC & Rate Limiting:** Real-time prediction endpoints enforce 600 req/min limits per organization.
- [x] **Tenant Isolation:** PostgreSQL Row-Level Security (RLS) policies verified active via integration tests.
- [x] **Security Headers:** Nginx configured with CSP, HSTS, X-Frame-Options, and X-Content-Type-Options.

### Infrastructure & DevOps
- [x] **Docker Multi-Stage Builds:** Frontend image optimized with Nginx alpine; backend image minimized.
- [x] **Health Probes:** Liveness (`/health/live`), Readiness (`/health/ready`), and Dependency (`/health/dependencies`) probes responding.
- [x] **Database Migrations:** All SQLAlchemy models and tables synchronized cleanly.

---

## 🔍 2. Production Readiness Verification Protocol

Immediately following a production deployment, execute the following smoke test sequence:

### Step 1: Check System Health
```bash
curl -f http://localhost:8000/health/dependencies
```
*Expected Response:*
```json
{
  "status": "healthy",
  "environment": "production",
  "dependencies": {
    "database": {"status": "up", "latency_ms": 1.25},
    "redis": {"status": "up", "latency_ms": 0.45},
    "ml_engine": {"status": "up", "details": {"status": "loaded_and_verified"}}
  }
}
```

### Step 2: Verify Real-Time Inference Latency
Execute a sample prediction request using an active merchant API Key or JWT:
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VALID_JWT_OR_API_KEY>" \
  -d '{
    "transaction_external_id": "smoke_test_001",
    "amount": 100.0,
    "card_brand": "VISA",
    "billing_country": "USA",
    "ip_address": "8.8.8.8",
    "device_type": "desktop",
    "email_domain": "gmail.com",
    "card_country": "USA"
  }'
```
*Verification:* Ensure HTTP status is `200 OK`, `is_fraud` is evaluated, and `prediction_latency_ms` is under `20.0ms`.

---

## ⏪ 3. Emergency Rollback Procedure

If a critical defect, memory leak, or security vulnerability is identified post-deployment:

### Scenario A: Rollback via Docker Compose Tag
1. Identify the previous stable image tag (e.g., `v0.9.8`).
2. Update `.env` or compose overrides to point to the stable tag.
3. Execute zero-downtime rolling restart:
```bash
docker compose up -d --no-deps --build backend frontend
```
4. Verify readiness:
```bash
docker compose ps
```

### Scenario B: Database Rollback / Restoration
If a schema change corrupted tenant data:
1. Stop backend container to halt write traffic:
```bash
docker stop flagged_backend
```
2. Restore latest automated PostgreSQL dump from volume backup:
```bash
docker exec -i flagged_postgres pg_restore -U postgres -d flagged_production_db < /backups/latest_dump.sql
```
3. Restart backend and verify `/health/ready`.

---

## 🚨 4. Incident Response Guide

### Severity Levels
- **SEV-1 (Critical):** Full platform outage, ML engine scoring failure, or tenant data cross-bleed.
- **SEV-2 (Major):** CSV batch upload ingestion degraded, Redis offline (fallback mode triggered).
- **SEV-3 (Minor):** Dashboard UI glitch, non-critical latency spike (> 50ms).

### SEV-1 Protocol: Redis Offline / Fallback Mode Triggered
If Redis crashes in production, FLAGGED! is engineered to **gracefully fall back** to direct PostgreSQL execution for analytics and bypass rate limiting to keep transaction scoring alive.
1. **Alerting:** Watch for structured logs: `"Redis GET failed (falling back to database)"`.
2. **Action:** Check Redis container logs: `docker logs flagged_redis`.
3. **Recovery:** Restart Redis pool: `docker restart flagged_redis`.

### SEV-1 Protocol: Rate Limiting Denial of Service (DoS)
If an organization generates excessive traffic (> 600 req/min):
1. The backend automatically emits HTTP `429 TOO_MANY_REQUESTS`.
2. To temporarily block a compromised API Key, revoke it via the merchant dashboard or SQL:
```sql
UPDATE api_keys SET is_active = false WHERE id = '<COMPROMISED_KEY_ID>';
```

---

## 📞 5. Enterprise Support Documentation
- **Engineering Escalation:** `devops@flagged.io`
- **Security Vulnerability Disclosure:** `security@flagged.io`
- **System Status Dashboard:** [https://status.flagged.io](https://status.flagged.io)

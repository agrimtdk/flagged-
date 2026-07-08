# Implementation Plan - Phase 2: Identity, Authentication & Multi-Tenant Foundation

This plan establishes the security and tenant core of **flagged!**. In this phase, we will integrate PostgreSQL (using async pg and SQLAlchemy 2.0), Alembic migrations, Redis caching, Google OAuth authentication, JWT access/refresh session management with Refresh Token Rotation (RTR), Role-Based Access Control (RBAC), and multi-tenant Row-Level Security (RLS) isolation.

## User Review Required

> [!IMPORTANT]
> - **Multi-Tenant Isolation**: Row-Level Security (RLS) is used. Database queries will automatically set `app.current_org_id` on the database session context via the authentication middleware. Unauthenticated database sessions will default to empty access scopes to prevent leaks.
> - **Google OAuth Flow**: The system uses Authorization Code Flow. The backend exchanges the code for user info. First-time loggers trigger Organization creation and are registered as `Owner` users. Subsequent loggers reuse the existing organization.
> - **Token Rotation**: Raw refresh tokens are never stored. Only their SHA-256 hashes are persisted in the database. When a refresh token is reused (replay attack), all sessions for that user are immediately revoked.
> - **Redis Usage**: Utilized for caching active API keys and tracking revoked JWT tokens.

> [!WARNING]
> - **No Password Logins**: Password logins will not exist. Only Google OAuth is permitted.
> - **Mock Google OAuth for Local Testing**: For offline testing (where valid Google credentials might not be configured), a local mock override will be implemented (triggered if a specific request header or parameter is passed) to allow development to proceed smoothly.

---

## Proposed Changes

We will split Phase 2 into six major sections:
1. **Database & Migrations Configuration**
2. **Multi-Tenancy (Row-Level Security) & Models**
3. **Identity Layer (Google OAuth & JWT RTR)**
4. **RBAC & Redis Token Caching**
5. **Backend Routers, Repositories, & Services**
6. **Frontend Auth Context & Page Assembly**

---

### 1. Database & Migrations Configuration
- Introduce asyncpg database connectivity.
- Scaffold Alembic migration pipelines.

#### [NEW] [backend/app/core/database.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/database.py)
- Establish the async engine, connection pool, and async session factory.
- Implement an event listener or middleware scope executing `SET LOCAL app.current_org_id = :org_id` inside SQLAlchemy transactions.

#### [NEW] [backend/alembic.ini](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/alembic.ini)
- Configure the Alembic environment.

#### [NEW] [backend/alembic/env.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/alembic/env.py)
- Setup async migration runner importing models' target metadata.

---

### 2. Multi-Tenancy (Row-Level Security) & Models
- Implement SQLAlchemy 2.0 declarative models for `Organization`, `User`, `RefreshToken`, and `ApiKey` matching the SDD schemas.
- Enable PostgreSQL RLS migrations.

#### [NEW] [backend/app/models/base.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/base.py)
- Declarative Base class mapping default columns (`id`, `created_at`, `updated_at`).

#### [NEW] [backend/app/models/organization.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/organization.py)
- Organization model.

#### [NEW] [backend/app/models/user.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/user.py)
- User model including roles (Owner, Admin, Analyst, Developer).

#### [NEW] [backend/app/models/refresh_token.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/refresh_token.py)
- Refresh token hash model.

#### [NEW] [backend/app/models/api_key.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/api_key.py)
- ApiKey prefix & hash model.

#### [NEW] [backend/app/middleware/tenant.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/middleware/tenant.py)
- Extracts Tenant Context from authenticated JWT claims, binds to SQLAlchemy session parameters, and configures contextvars.

---

### 3. Identity Layer (Google OAuth & JWT RTR)
- Implement Token generation utilities and Google code exchangers.

#### [NEW] [backend/app/core/security.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/security.py)
- JWT encoder/decoder, secure cookie options, and token hashing.

#### [NEW] [backend/app/services/google_oauth.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/google_oauth.py)
- Google OAuth token exchange API wrappers with fallback mocks.

#### [NEW] [backend/app/services/token_service.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/token_service.py)
- Implements Access Token and Refresh Token lifecycle management, including Refresh Token Rotation (RTR) and replay attack detection.

---

### 4. RBAC & Redis Token Caching
- Connect Redis pools and define permissions checkpoints.

#### [NEW] [backend/app/core/redis.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/redis.py)
- Redis connection pools, set/get helper wrappers, and status checks.

#### [NEW] [backend/app/core/rbac.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/rbac.py)
- Defines role-permission structures and dependencies (`requires_permission`).

---

### 5. Backend Routers, Repositories, & Services
- Build database repositories and auth routing controllers.

#### [NEW] [backend/app/repositories/](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/repositories/)
- Create isolated database handlers: `organization_repo.py`, `user_repo.py`, `refresh_token_repo.py`, `api_key_repo.py`.

#### [NEW] [backend/app/services/](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/)
- Build service coordinators: `auth_service.py`, `organization_service.py`, `user_service.py`.

#### [NEW] [backend/app/routers/auth.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/auth.py)
- Endpoints: `POST /api/v1/auth/google`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.

#### [NEW] [backend/app/routers/organizations.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/organizations.py)
- Endpoint: `GET /api/v1/organizations/current`.

---

### 6. Frontend Auth Context & Page Assembly
- Implement state managers and protect dashboard views.

#### [NEW] [frontend/src/contexts/AuthContext.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/contexts/AuthContext.tsx)
- Manages auth states, login methods, and Axios cookie configurations.

#### [NEW] [frontend/src/router/ProtectedRoute.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/router/ProtectedRoute.tsx)
- Restricts pages to authenticated sessions.

#### [NEW] [frontend/src/pages/OAuthCallback.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/OAuthCallback.tsx)
- Callback handler exchanging authorization codes for credentials.

#### [NEW] [frontend/src/pages/error/Unauthorized.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/error/Unauthorized.tsx)
- Unauthorized access panel.

---

## Verification Plan

### Database & Tenant Checks
- **Migrations Check**: Run `alembic upgrade head` to ensure all schemas mount cleanly.
- **Tenant Isolation Check**: Verify query statements executed without `app.current_org_id` throw database/RLS exceptions.
- **Token Rotation Test**: Trigger a refresh query using an already spent refresh token, verifying all active keys for that user are immediately invalidated.

### API Scenarios
- Mock Google OAuth callbacks to check:
  - Account creation on initial login.
  - Sign-in on subsequent calls.
  - Cookie validation structures.

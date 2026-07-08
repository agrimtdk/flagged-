# Phase 5: Business Dashboard, Analytics & Platform Experience

This phase transforms FLAGGED! from a functional ML backend into an enterprise-ready, polished SaaS product. We will elevate the user experience, professionalize all dashboards, implement real backend API connections for API Key management and upload history, and add global platform features (cmd/ctrl+K search, toast notifications, loading skeletons, empty states, and responsive accessibility).

## User Review Required

> [!IMPORTANT]
> **Strict Architectural Adherence**: As requested, we will make **zero database schema changes** or Alembic migrations. All features will be built on top of our existing PostgreSQL/SQLite tables (`transactions`, `organizations`, `users`, `api_keys`).

> [!NOTE]
> **Real API Key Management**: Currently, `ApiKeys.tsx` uses mock in-memory array data. We will create a real backend API router (`/api/v1/api-keys`) interfacing with the existing `api_keys` table in the database so generating, renaming, deactivating, and revoking API keys persists in real time.

> [!TIP]
> **Global Search & Notifications**: We will add a keyboard-accessible search modal triggered by `Cmd+K` / `Ctrl+K` (or clicking the search bar in the navbar/sidebar) allowing instant navigation across Transactions, Analytics, API Keys, Uploads, and Settings. We will also implement a React notification context for auto-dismissing success/error/warning alerts.

## Open Questions

None. The scope, exclusions (no Kafka, no Celery, no billing, no team management), and constraints (final SDD, no ML/auth/DB changes) are clear.

## Proposed Changes

We group our incremental implementation into logical layers: Backend API support, Global Frontend Platform Experience, Page Applications, and Verification.

---

### Backend API Enhancements

#### [MODIFY] [api_key.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/repositories/api_key.py)
- Add `get_all_by_org(org_id)` to fetch all API keys for an organization ordered by creation date.
- Add `get_by_id(key_id, org_id)` to locate a specific key for status toggling or revocation.

#### [NEW] [api_keys.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/api_keys.py)
- `GET /api/v1/api-keys`: List all active and revoked API keys for the current user's organization (hiding the secret hash, displaying prefix, name, status, created_at, last_used_at).
- `POST /api/v1/api-keys`: Generate a new secure API key (`fl_live_<32_hex>`), hash with SHA-256 for database storage, and return the raw secret key once to the client.
- `PATCH /api/v1/api-keys/{id}/rename`: Rename an API key identifier.
- `PATCH /api/v1/api-keys/{id}/status`: Toggle `is_active` between true (Reactivate) and false (Deactivate).
- `DELETE /api/v1/api-keys/{id}`: Revoke and delete the key permanently.

#### [MODIFY] [main.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/main.py)
- Mount `api_keys.router` under `/api/v1`.

---

### Global Platform Experience (Frontend Contexts & UI)

#### [NEW] [NotificationContext.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/contexts/NotificationContext.tsx)
- Application-wide toast notification manager with `addNotification(type, title, message, timeout)` supporting `success`, `warning`, `error`, and `info`.
- Auto-dismisses after 4 seconds with manual close buttons and animated slide-in styling.

#### [NEW] [GlobalSearchModal.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/ui/GlobalSearchModal.tsx)
- Global search dialog listening for `Ctrl+K` or `Cmd+K`.
- Allows searching and instant jumping to specific dashboard sections, recent transactions, analytics reports, and settings.

#### [MODIFY] [Navbar.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/layout/Navbar.tsx) & [Sidebar.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/layout/Sidebar.tsx)
- Integrate Global Search search bar trigger.
- Add **CSV Center** (`/dashboard/uploads`) navigation link with spreadsheet icon.
- Add visual notification bell with status badge.

#### [MODIFY] [EmptyState.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/ui/EmptyState.tsx), [Skeleton.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/ui/Skeleton.tsx), [LoadingOverlay.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/ui/LoadingOverlay.tsx)
- Refine enterprise styling for consistent empty states across tables, charts, and API key lists.
- Add shimmer skeleton loading cards for chart widgets and table rows.

---

### Phase 5 Dashboard Pages & Workspaces

#### [MODIFY] [DashboardHome.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/DashboardHome.tsx)
- **Overview Cards**: Total Transactions, Fraud Detected, Fraud Rate, Avg Risk Score, Today's Predictions, API vs CSV queries.
- **Activity & Health**: System Status ("Healthy"), Model Status ("Active - CatBoost v1.0.0"), Recent High Risk Transactions table.
- **Quick Actions**: Upload CSV modal trigger, Generate API Key shortcut, View Analytics link.
- **Trends & Charts**: Prediction Volume Trend, Fraud Trend, Risk Score Distribution, Top Countries bar chart, Top Device Types donut chart.

#### [MODIFY] [Transactions.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Transactions.tsx) (Transaction Center)
- Production-grade transaction explorer with server-side pagination, search by transaction ID, and column visibility selector.
- **Filters Bar**: Date range selector, Fraud Only toggle, Risk Range sliders, Source dropdown (API/CSV), Country, Card Brand, and Device Type.
- **Export**: Export current filtered results to CSV.
- **Details Drawer**: Slide-out modal displaying SHAP explanation reasons, IP match indicators, latency, and full transaction JSON metadata.

#### [MODIFY] [Analytics.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Analytics.tsx) (Analytics Center)
- Complete analytics workspace consuming `/api/v1/analytics/summary` and `/timeline`.
- Recharts visualizations: Fraud Trends over time, Risk Score distribution histograms, Hourly/Daily/Weekly activity volume breakdowns, Country & Device distribution pies, Card Brand bar charts, and Prediction Confidence intervals.

#### [NEW] [CsvCenter.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/CsvCenter.tsx) (CSV Center)
- Mounted at `/dashboard/uploads`.
- Dedicated upload experience featuring drag & drop dropzone, browse button, file validation (10MB limit check), live upload and processing progress bars.
- **Results Summary**: Shows processed rows, fraud count, clean count, and downloadable validation error reports.
- **Upload History**: Displays chronological list of past CSV batch uploads retrieved from the transactions API.

#### [MODIFY] [ApiKeys.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/ApiKeys.tsx) (API Key Management)
- Replace mock data with calls to `/api/v1/api-keys`.
- Implement key generation modal with copy-to-clipboard button and one-time security warning alert.
- Support key renaming, deactivation/reactivation toggles, and revocation via danger confirmation dialogs.
- Display creation timestamps and exact `last_used_at` telemetry.

#### [MODIFY] [Profile.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Profile.tsx) & [Settings.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Settings.tsx)
- **Profile**: Displays user avatar, name, email, role badge ("Owner"/"Admin"), bound organization name, subscription tier ("Enterprise SaaS"), joined date, last login, and current browser session info.
- **Settings**: Organization configuration, theme switcher (Light/Dark mode with immediate DOM class toggling), notification preferences switches, security overview, active sessions list, and future V2 features (Billing, Team Invitations, Kafka Webhooks) clearly disabled with `V2` badges.

#### [MODIFY] [router/index.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/router/index.tsx) & [router/constants.ts](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/router/constants.ts)
- Register `ROUTES.UPLOADS` (`/dashboard/uploads`) pointing to `<CsvCenter />`.

---

## Verification Plan

### Automated Tests
1. **Backend API Key CRUD Suite**:
   - Create `backend/tests/test_api_keys.py` to test generating an API key, verifying SHA-256 hash persistence, listing keys, renaming, toggling status, and revocation.
   - Run: `venv\Scripts\python -m pytest tests\ -v`
   - Ensure all backend tests pass (expecting ~22+ passing tests).

2. **Frontend Production Build**:
   - Run: `npm run build` in `frontend/` directory.
   - Verify zero TypeScript compiler errors, clean Recharts bundling, and proper chunk optimization.

### Manual Verification
- Verify search shortcut (`Cmd/Ctrl + K`) opens global search and navigates cleanly.
- Verify toast notifications appear on API key generation or CSV upload completion.
- Check light/dark mode toggling in Settings and confirm all table/chart contrast ratios are readable.

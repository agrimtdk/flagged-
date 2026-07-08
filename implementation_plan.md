# Implementation Plan - Phase 1: Project Foundation

This plan establishes the core structure and foundation of **flagged!**, a multi-tenant AI-powered fraud detection SaaS platform. This phase is dedicated strictly to scaffolding the monorepo, creating the reusable UI components, routing, theme styling, and setting up the API skeleton with standard backend tracing.

## User Review Required

> [!IMPORTANT]
> The theme and styling guidelines must strictly follow the finalized Software Design Document:
> - **Typography**: Google Font **Solway** loaded without fallback flashes.
> - **Light Theme**: Mint Green accent (#10B981) + Off-White background (#FAF8F6).
> - **Dark Theme**: Pastel Yellow accent (#FEF08A) + Dark Night Gray background (#111827).
> - **Aesthetics**: Minimal and professional enterprise dashboard. No gradients, glassmorphism, or flashy animations.

> [!WARNING]
> This phase does NOT implement PostgreSQL, Redis connection logic, Google OAuth, or ML inference. However, all routers, configuration structures, and logging pipelines will be established to allow for seamless integration in Phase 2.

## Proposed Changes

We will organize the repository as a monorepo with the following layout:
- `backend/`: FastAPI Python application.
- `frontend/`: React + TypeScript + Vite + TailwindCSS application.
- `docker-compose.yml`: Local multi-container development configuration.

---

### Backend Foundation

We will initialize a FastAPI application featuring Uvicorn, structured JSON logging, configuration management, and request-id tracing.

#### [NEW] [backend/requirements.txt](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/requirements.txt)
- List project dependencies: `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`, `python-json-logger`.

#### [NEW] [backend/.env.example](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/.env.example)
- Define standard environment variables: `ENV`, `LOG_LEVEL`, `ALLOWED_ORIGINS`.

#### [NEW] [backend/app/config.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/config.py)
- Configuration class using `pydantic-settings` to load environments with type safety.

#### [NEW] [backend/app/logging_config.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/logging_config.py)
- Setup python-json-logger to serialize stdout/stderr logs into JSON.

#### [NEW] [backend/app/exceptions.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/exceptions.py)
- Define global exception handlers to standardize error responses to the JSON format defined in the SDD.

#### [NEW] [backend/app/middleware/request_id.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/middleware/request_id.py)
- Middleware extracting or generating UUID request IDs and appending them to context logging and response headers.

#### [NEW] [backend/app/routers/health.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/health.py)
- Endpoint `/health` returning service availability status (mocking DB/Redis checks for now).

#### [NEW] [backend/app/routers/version.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/version.py)
- Endpoint `/version` returning active software versioning tags.

#### [NEW] [backend/main.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/main.py)
- Application factory script initializing CORS, middleware, router mounts, and exception interceptors.

#### [NEW] [backend/Dockerfile](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/Dockerfile)
- Docker configuration exposing FastAPI on port `8000`.

---

### Frontend Foundation

We will initialize a React single page application with TypeScript, Vite, and TailwindCSS, including the Solway font and a dark/light mode toggle with no initial styling flashes.

#### [NEW] [frontend/package.json](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/package.json)
- React dependencies, routing (`react-router-dom`), icons (`lucide-react`), and dev dependencies.

#### [NEW] [frontend/vite.config.ts](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/vite.config.ts)
- Vite build configuration mapping ports and proxy targets.

#### [NEW] [frontend/tailwind.config.js](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/tailwind.config.js)
- Extend color palette with designated mint green/off-white (light) and pastel yellow/dark gray (dark) color profiles, and bind font family to **Solway**.

#### [NEW] [frontend/index.html](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/index.html)
- Load Solway typography from Google Fonts. Include blocking inline script resolving `theme` class from `localStorage` to prevent styling flash.

#### [NEW] [frontend/src/index.css](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/index.css)
- Imports for Tailwind layers and custom styling utility classes.

#### [NEW] [frontend/src/context/ThemeContext.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/context/ThemeContext.tsx)
- React context managing theme transitions and localStorage sync.

#### [NEW] [frontend/src/components/ui/](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/ui/)
Scaffold reusable components matching the visual specifications:
- `Button.tsx`
- `Input.tsx`
- `Card.tsx`
- `Badge.tsx`
- `Table.tsx`
- `Modal.tsx`
- `Dropdown.tsx`
- `Alert.tsx`
- `Spinner.tsx`
- `EmptyState.tsx`
- `Skeleton.tsx`
- `LoadingOverlay.tsx`

#### [NEW] [frontend/src/components/Navbar.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/Navbar.tsx)
- Public marketing layout header with navigation links and theme toggle.

#### [NEW] [frontend/src/components/Footer.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/Footer.tsx)
- Unified footer for marketing routes.

#### [NEW] [frontend/src/components/Sidebar.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/components/Sidebar.tsx)
- Responsive dashboard sidebar layout mapping admin links.

#### [NEW] [frontend/src/layouts/MarketingLayout.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/layouts/MarketingLayout.tsx)
- High-level layout binding Navbar, main content, and Footer.

#### [NEW] [frontend/src/layouts/DashboardLayout.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/layouts/DashboardLayout.tsx)
- Dashboard layout binding responsive Sidebar, dashboard header, and inner routing outlets.

#### [NEW] [frontend/src/pages/](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/)
Scaffold clean static UI pages:
- `Landing.tsx`
- `About.tsx`
- `Pricing.tsx`
- `Documentation.tsx`
- `Login.tsx`
- `dashboard/DashboardHome.tsx`
- `dashboard/Transactions.tsx`
- `dashboard/Analytics.tsx`
- `dashboard/ApiKeys.tsx`
- `dashboard/Profile.tsx`
- `dashboard/Settings.tsx`
- `error/NotFound.tsx` (404 Page)
- `error/ServerError.tsx` (500 Page)

#### [NEW] [frontend/src/App.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/App.tsx)
- Set up routes using `react-router-dom` inside `ThemeProvider`.

#### [NEW] [frontend/Dockerfile](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/Dockerfile)
- Multi-stage Docker config build and Nginx static server serving files.

---

### Monorepo Coordination

#### [NEW] [docker-compose.yml](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/docker-compose.yml)
- Docker Compose config tying backend (port 8000) and frontend (port 80) together under shared networks.

---

## Verification Plan

### Automated Verification
We will run type checks and compilation verifications:
- **Backend Lint/Start**: Run `uvicorn main:app --port 8000` to confirm success. Verify `/health` and `/version` endpoints return expected JSON.
- **Frontend Build**: Run `npm run build` or `vite build` inside the frontend directory to ensure TypeScript compilation passes.

### Manual Verification
- Launch both containers via `docker-compose up --build`.
- Access `http://localhost` and toggle themes. Inspect local storage to ensure theme persists.
- Inspect document rendering to confirm the **Solway** font is applied.
- Resize viewport to confirm sidebar responsive transitions.
- Verify 404 router redirects when loading unknown routes.

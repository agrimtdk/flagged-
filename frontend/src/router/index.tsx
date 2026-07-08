import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ROUTES } from "./constants";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";

// Layouts
import { MarketingLayout } from "../layouts/MarketingLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AuthLayout } from "../layouts/AuthLayout";

// Lazy-loaded Pages
const Landing = lazy(() => import("../pages/Landing").then(module => ({ default: module.Landing })));
const About = lazy(() => import("../pages/About").then(module => ({ default: module.About })));
const Pricing = lazy(() => import("../pages/Pricing").then(module => ({ default: module.Pricing })));
const Documentation = lazy(() => import("../pages/Documentation").then(module => ({ default: module.Documentation })));
const Login = lazy(() => import("../pages/Login").then(module => ({ default: module.Login })));

// Callback & Unauthorized
const OAuthCallback = lazy(() => import("../pages/OAuthCallback").then(module => ({ default: module.OAuthCallback })));
const Unauthorized = lazy(() => import("../pages/error/Unauthorized").then(module => ({ default: module.Unauthorized })));

// Dashboard Pages
const DashboardHome = lazy(() => import("../pages/dashboard/DashboardHome").then(module => ({ default: module.DashboardHome })));
const Transactions = lazy(() => import("../pages/dashboard/Transactions").then(module => ({ default: module.Transactions })));
const Analytics = lazy(() => import("../pages/dashboard/Analytics").then(module => ({ default: module.Analytics })));
const CsvCenter = lazy(() => import("../pages/dashboard/CsvCenter").then(module => ({ default: module.CsvCenter })));
const ApiKeys = lazy(() => import("../pages/dashboard/ApiKeys").then(module => ({ default: module.ApiKeys })));
const ModelInformatics = lazy(() => import("../pages/dashboard/ModelInformatics").then(module => ({ default: module.ModelInformatics })));
const Profile = lazy(() => import("../pages/dashboard/Profile").then(module => ({ default: module.Profile })));
const Settings = lazy(() => import("../pages/dashboard/Settings").then(module => ({ default: module.Settings })));

// Error Pages
const NotFound = lazy(() => import("../pages/error/NotFound").then(module => ({ default: module.NotFound })));
const ServerError = lazy(() => import("../pages/error/ServerError").then(module => ({ default: module.ServerError })));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingOverlay isVisible={true} message="Loading Page..." />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public Marketing Routes
  {
    path: "/",
    element: <MarketingLayout />,
    children: [
      {
        path: ROUTES.LANDING,
        element: <SuspenseWrapper><Landing /></SuspenseWrapper>,
      },
      {
        path: ROUTES.ABOUT,
        element: <SuspenseWrapper><About /></SuspenseWrapper>,
      },
      {
        path: ROUTES.PRICING,
        element: <SuspenseWrapper><Pricing /></SuspenseWrapper>,
      },
      {
        path: ROUTES.DOCS,
        element: <SuspenseWrapper><Documentation /></SuspenseWrapper>,
      },
    ],
  },
  // Auth Routes
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: (
          <ProtectedRoute requiresAuth={false} guestOnly={true}>
            <SuspenseWrapper><Login /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: "/auth/callback",
        element: <SuspenseWrapper><OAuthCallback /></SuspenseWrapper>,
      },
    ],
  },
  // Dashboard Console (Strict RBAC Metadata mapping)
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute requiresAuth={true}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuspenseWrapper><DashboardHome /></SuspenseWrapper>,
      },
      {
        path: ROUTES.TRANSACTIONS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin", "Analyst"]}>
            <SuspenseWrapper><Transactions /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ANALYTICS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin", "Analyst", "Developer"]}>
            <SuspenseWrapper><Analytics /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.UPLOADS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin", "Analyst", "Developer"]}>
            <SuspenseWrapper><CsvCenter /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.API_KEYS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin", "Developer"]}>
            <SuspenseWrapper><ApiKeys /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.MODEL_INFORMATICS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin", "Analyst", "Developer"]}>
            <SuspenseWrapper><ModelInformatics /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.PROFILE,
        element: <SuspenseWrapper><Profile /></SuspenseWrapper>,
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <ProtectedRoute requiresAuth={true} allowedRoles={["Owner", "Admin"]}>
            <SuspenseWrapper><Settings /></SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Error fallback routing
  {
    path: "/unauthorized",
    element: <SuspenseWrapper><Unauthorized /></SuspenseWrapper>,
  },
  {
    path: "*",
    element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
  },
  {
    path: "/500",
    element: <SuspenseWrapper><ServerError /></SuspenseWrapper>,
  }
]);

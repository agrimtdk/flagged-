import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  guestOnly?: boolean;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
  guestOnly = false,
  allowedRoles,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Syncing secure authentication session..." />;
  }

  // 1. Guest Only routes (e.g., Login page)
  if (guestOnly) {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // 2. Requires Authentication
  if (requiresAuth) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    // 3. Check Role boundaries (RBAC)
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <>{children}</>;
  }

  return <>{children}</>;
};

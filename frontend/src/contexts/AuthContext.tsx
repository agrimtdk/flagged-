import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, UserProfile } from "../services/auth";
import { organizationService, OrganizationProfile } from "../services/organization";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: UserProfile | null;
  org: OrganizationProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  const clearSession = () => {
    setUser(null);
    setOrg(null);
    setIsAuthenticated(false);
    localStorage.removeItem("access_token");
  };

  const refreshUserProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      
      const currentOrg = await organizationService.getCurrentOrganization();
      setOrg(currentOrg);
      
      setIsAuthenticated(true);
    } catch (e) {
      clearSession();
      throw e;
    }
  };

  const login = async (code: string) => {
    setLoading(true);
    try {
      const data = await authService.loginWithGoogle(code);
      localStorage.setItem("access_token", data.access_token);
      setUser(data.user);
      
      // Fetch org context
      const currentOrg = await organizationService.getCurrentOrganization();
      setOrg(currentOrg);
      
      setIsAuthenticated(true);
      addToast("Signed in successfully!", "success");
    } catch (e: any) {
      clearSession();
      addToast(e.response?.data?.error?.message || "Google authentication failed.", "error");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      // Bypass failure to clear local state regardless
    } finally {
      clearSession();
      addToast("Logged out successfully.", "info");
      setLoading(false);
    }
  };

  // On mount session check (Silent Refresh Fallback)
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          await refreshUserProfile();
        } catch (e) {
          // Token invalid or expired, retry via silent refresh
          try {
            const data = await authService.refreshSession();
            localStorage.setItem("access_token", data.access_token);
            await refreshUserProfile();
          } catch (refreshErr) {
            clearSession();
          }
        }
      } else {
        // Attempt silent refresh using HTTP-only cookie if no token in memory
        try {
          const data = await authService.refreshSession();
          localStorage.setItem("access_token", data.access_token);
          await refreshUserProfile();
        } catch (e) {
          clearSession();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Axios event integrations
    const handleSessionExpired = () => {
      clearSession();
      addToast("Your session has expired. Please log in again.", "error");
    };

    const handleLogoutEvent = () => {
      clearSession();
    };

    const handleForbidden = (e: Event) => {
      const err = (e as CustomEvent).detail;
      addToast(err.response?.data?.error?.message || "Access forbidden. Insufficient permissions.", "error");
    };

    const handleRateLimited = () => {
      addToast("Too many requests. Please slow down and try again.", "error");
    };

    const handleServerError = () => {
      addToast("An unexpected server error occurred. Please try again later.", "error");
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    window.addEventListener("auth-logout", handleLogoutEvent);
    window.addEventListener("api-forbidden", handleForbidden);
    window.addEventListener("api-rate-limited", handleRateLimited);
    window.addEventListener("api-server-error", handleServerError);

    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
      window.removeEventListener("auth-logout", handleLogoutEvent);
      window.removeEventListener("api-forbidden", handleForbidden);
      window.removeEventListener("api-rate-limited", handleRateLimited);
      window.removeEventListener("api-server-error", handleServerError);
    };
  }, [addToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export { AuthContext };

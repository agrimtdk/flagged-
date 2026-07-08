import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";
import { useToast } from "../contexts/ToastContext";

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasTriggered.current) return;
    
    const code = searchParams.get("code");
    
    if (code) {
      hasTriggered.current = true;
      const executeLogin = async () => {
        try {
          await login(code);
          navigate("/dashboard");
        } catch (err) {
          navigate("/login");
        }
      };
      executeLogin();
    } else {
      addToast("OAuth code was not found. Please try logging in again.", "error");
      navigate("/login");
    }
  }, [searchParams, login, navigate, addToast]);

  return (
    <LoadingOverlay
      isVisible={true}
      message="Verifying OAuth credentials with Google security layers..."
    />
  );
};

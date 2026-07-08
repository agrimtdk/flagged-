import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../contexts/ToastContext";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "placeholder-google-client-id";
const REDIRECT_URI = window.location.origin + "/auth/callback";

export const Login: React.FC = () => {
  const [sandboxEmail, setSandboxEmail] = useState("sjenkins@acme.com");
  const [showSandbox, setShowSandbox] = useState(import.meta.env.DEV);
  const { addToast } = useToast();

  const handleGoogleSignIn = () => {
    if (GOOGLE_CLIENT_ID === "placeholder-google-client-id" || !GOOGLE_CLIENT_ID) {
      addToast("Enter your Google email below to sign in (Developer Sandbox).", "info");
      setShowSandbox(true);
      return;
    }

    // Standard Google OAuth 2.0 Authorization Code Flow Redirect
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=openid%20profile%20email` +
      `&access_type=offline` +
      `&prompt=select_account`;
      
    window.location.href = oauthUrl;
  };

  const handleSandboxLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxEmail.includes("@")) {
      addToast("Please enter a valid email address for organization resolution.", "error");
      return;
    }
    // Redirect to callback page with mock code token
    window.location.href = `/auth/callback?code=mock_code_${encodeURIComponent(sandboxEmail.toLowerCase())}`;
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold font-solway">Welcome to flagged!</CardTitle>
        <p className="text-sm text-text-secondary mt-1">
          Access your real-time risk intelligence console.
        </p>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4 flex flex-col gap-6">
        <Button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 border border-border bg-card text-text-primary hover:bg-border/30 transition-colors font-medium rounded cursor-pointer"
          variant="secondary"
        >
          {/* Custom SVG Google Logo */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path
                d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3C20.57,17.7 21.6,14.6 21.35,11.1z"
                fill="#4285F4"
              />
              <path
                d="M12,20.4c2.54,0 4.67,-0.84 6.22,-2.3l-3.3,-2.57c-0.91,0.61 -2.08,0.97 -2.92,0.97 -2.25,0 -4.15,-1.52 -4.83,-3.57H3.84v2.66C5.4,18.2 8.47,20.4 12,20.4z"
                fill="#34A853"
              />
              <path
                d="M7.17,13c-0.18,-0.52 -0.27,-1.08 -0.27,-1.65c0,-0.57 0.1,-1.13 0.27,-1.65V7.04H3.84C3.26,8.2 3,9.5 3,11c0,1.5 0.26,2.8 0.84,3.96L7.17,13z"
                fill="#FBBC05"
              />
              <path
                d="M12,6.2c1.38,0 2.62,0.47 3.6,1.4l2.7,-2.7C16.67,3.34 14.54,2.6 12,2.6C8.47,2.6 5.4,4.8 3.84,7.04l3.33,2.66c0.68,-2.05 2.58,-3.5 4.83,-3.5z"
                fill="#EA4335"
              />
            </g>
          </svg>
          <span>Sign In with Google</span>
        </Button>

        {showSandbox && (
          <form onSubmit={handleSandboxLogin} className="flex flex-col gap-4 border-t border-border pt-4 mt-2">
            <div className="text-xs font-semibold text-text-primary uppercase text-center mb-1">
              Sign In with Email / Sandbox Mode
            </div>
            <Input
              label="Email Address"
              placeholder="e.g. yourname@gmail.com"
              type="email"
              value={sandboxEmail}
              onChange={(e) => setSandboxEmail(e.target.value)}
              required
              helperText="Logging in will create/resolve your domain's organization."
            />
            <Button type="submit" variant="outline" className="w-full font-bold">
              Sign In with Email
            </Button>
          </form>
        )}

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs text-text-secondary uppercase">Enterprise Auth</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <p className="text-center text-xs text-text-secondary leading-relaxed">
          By signing in, you agree to our terms of service and acknowledge that data is isolated under Row-Level Security.
        </p>
      </CardContent>
    </Card>
  );
};

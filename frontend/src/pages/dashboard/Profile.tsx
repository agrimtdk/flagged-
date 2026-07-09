import React, { useState, useEffect } from "react";
import { User as UserIcon, Building, ShieldCheck, Laptop, Shield } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { authService } from "../../services/auth";

export const Profile: React.FC = () => {
  const { user, org, updateUser } = useAuth();
  const [name, setName] = useState(user?.full_name || "Agrim Sharma");
  const [email, setEmail] = useState(user?.email || "agrim@acme-corp.com");
  const [submitting, setSubmitting] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      setName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Full Name cannot be empty.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updatedUser = await authService.updateProfile(name.trim());
      updateUser(updatedUser);
      addToast("Full Name updated successfully!", "success");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      addToast(err.response?.data?.error?.message || "Failed to update profile.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    const roles: Record<string, string> = {
      Owner: "Organization Owner",
      Admin: "System Administrator",
      Analyst: "Senior Risk Analyst",
      Developer: "Platform Engineer",
    };
    return roles[role || "Owner"] || role || "Owner";
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in duration-300">
      <SectionHeader
        title="Account & Security Profile"
        subtitle="Manage your personal identity credentials, organization membership, and active session governance."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar & Role Display (1 Col) */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-lg text-center p-6 space-y-5">
            <div className="relative inline-block mx-auto">
              <Avatar name={name} src={user?.avatar_url || undefined} size="lg" className="h-24 w-24 text-3xl border-2 border-accent shadow-md" />
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-accent border-2 border-card" title="Online & Active" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">{name}</h3>
              <p className="text-xs font-mono text-text-secondary">{email}</p>
            </div>
            <div className="pt-2 border-t border-border flex flex-col gap-2 items-center">
              <Badge variant="success" className="px-3 py-1 text-xs font-bold bg-accent text-accent-foreground">
                {getRoleBadge(user?.role)}
              </Badge>
              <span className="text-[11px] text-text-secondary font-mono">
                Member since July 2026
              </span>
            </div>
          </Card>

          {/* Organization Tenant Card */}
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-accent" />
                <span>Tenant Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Organization:</span>
                <span className="font-bold text-text-primary">{org?.name || "Acme Corporation"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">License Plan:</span>
                <span className="font-bold text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/30">
                  Enterprise Suite
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Throughput SLA:</span>
                <span className="font-mono font-bold text-text-primary">50,000 req / min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Data Isolation:</span>
                <span className="font-mono text-xs text-text-secondary">Dedicated RLS</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details & Security Sessions (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-5 w-5 text-accent" />
                <span>Identity & Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Corporate Email Address"
                    value={email}
                    disabled
                    helperText="Managed via Google Workspace Single Sign-On (SSO)."
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-text-secondary">
                    Your changes will synchronize across all active dashboard nodes.
                  </span>
                  <Button type="submit" variant="primary" disabled={submitting} className="bg-accent text-accent-foreground font-bold px-6">
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Scope & Permissions Matrix */}
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-accent" />
                <span>Assigned Role Permissions & API Scopes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                As an organization administrator, your token is bound to strict role-based access control (RBAC) rules. You have direct authorization for the following administrative actions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>org:write</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>apikey:write</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>predict:realtime</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>csv:batch_upload</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>analytics:read</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border flex items-center gap-2 text-text-primary font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                  <span>user:invite</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Session Audit */}
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Laptop className="h-5 w-5 text-accent" />
                <span>Active Login Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded bg-accent/15 text-accent">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
                      <span>Windows NT 10.0 • Chrome Browser</span>
                      <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.2 rounded font-mono">Current Session</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">
                      Auth Method: <span className="font-mono text-text-primary">Google OAuth 2.0 (JWT)</span> • IP: <span className="font-mono text-text-primary">192.168.1.100</span>
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1 justify-end text-accent font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Active Now
                  </span>
                  <span>July 6, 2026</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

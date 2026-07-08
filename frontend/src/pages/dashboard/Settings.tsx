import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Sliders, ShieldAlert, Bell, Save } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { Badge } from "../../components/ui/Badge";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

export const Settings: React.FC = () => {
  const { org } = useAuth();
  const [orgName, setOrgName] = useState(org?.name || "Acme Corporation");
  const [threshold, setThreshold] = useState(0.50);
  const [allowSmsAlerts, setAllowSmsAlerts] = useState(true);
  const [allowEmailDigests, setAllowEmailDigests] = useState(true);
  const [allowWebhookCallbacks, setAllowWebhookCallbacks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (org) {
      setOrgName(org.name);
    }
  }, [org]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      addToast("Organization workspace properties and ML decision thresholds updated.", "success");
    }, 600);
  };

  const handleConfirmPurge = () => {
    setPurgeOpen(false);
    addToast("Historical audit logs older than 90 days scheduled for asynchronous pruning.", "warning");
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      <SectionHeader
        title="Workspace & Governance Settings"
        subtitle="Configure organization identity properties, ML model decision boundaries, and security notification integrations."
        action={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-2 bg-accent text-accent-foreground font-bold hover:bg-accent/90 px-5"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? "Applying..." : "Save Workspace"}</span>
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Organization Name Card */}
        <Card className="border border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border bg-background/40">
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-5 w-5 text-accent" />
              <span>General Tenant Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Organization Display Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5">Tenant UUID</label>
                <div className="p-2.5 rounded bg-background border border-border font-mono text-xs text-text-secondary truncate">
                  {org?.id || "org_acme_live_uuid_8849"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Threshold Tuning Card */}
        <Card className="border border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border bg-background/40">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sliders className="h-5 w-5 text-accent" />
                <span>Risk Scoring Rule Engine & Decision Boundary</span>
              </CardTitle>
              <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-accent/15 text-accent font-bold">
                Active Threshold: {threshold.toFixed(2)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                <span>More Permissive (Fewer Blocks)</span>
                <span>Balanced Default (0.50)</span>
                <span>More Aggressive (Fewer Fraud Leaks)</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-accent bg-background h-2.5 rounded-lg appearance-none cursor-pointer border border-border"
              />
              <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
                <div className={`p-3 rounded border ${threshold < 0.35 ? "bg-accent/10 border-accent/40" : "bg-background border-border"}`}>
                  <p className="font-bold text-text-primary">Low Threshold (&lt; 0.35)</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">High false-positive rate. Blocks suspicious and edge-case items.</p>
                </div>
                <div className={`p-3 rounded border ${threshold >= 0.35 && threshold <= 0.65 ? "bg-accent/10 border-accent/40" : "bg-background border-border"}`}>
                  <p className="font-bold text-text-primary">Optimal Utility (0.35 - 0.65)</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Max financial utility. Balanced tradeoff between friction and loss.</p>
                </div>
                <div className={`p-3 rounded border ${threshold > 0.65 ? "bg-accent/10 border-accent/40" : "bg-background border-border"}`}>
                  <p className="font-bold text-text-primary">High Threshold (&gt; 0.65)</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Minimal checkout friction. Only extreme anomaly scores are blocked.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Integrations Switches */}
        <Card className="border border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border bg-background/40">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-accent" />
              <span>Real-Time Notifications & Webhook Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <span>SMS Emergency Alerts for Extreme Risk Spikes (&gt;0.85 score)</span>
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  </p>
                  <p className="text-xs text-text-secondary">
                    Dispatches instant SMS text messages to organization administrators when a critical fraud attack pattern is detected.
                  </p>
                </div>
                <Switch
                  checked={allowSmsAlerts}
                  onChange={(e) => setAllowSmsAlerts(e.target.checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-4 border-t border-border pt-6">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-text-primary">
                    Daily Executive Analytics & Audit Email Digests
                  </p>
                  <p className="text-xs text-text-secondary">
                    Sends an automated 00:00 UTC summary email containing daily fraud throughput, latency SLAs, and utility savings.
                  </p>
                </div>
                <Switch
                  checked={allowEmailDigests}
                  onChange={(e) => setAllowEmailDigests(e.target.checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-4 border-t border-border pt-6">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-text-primary flex items-center gap-2">
                    <span>Automated HTTP Webhook Callbacks for Flagged Transactions</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-border/60 text-text-secondary">V2 Roadmap</span>
                  </p>
                  <p className="text-xs text-text-secondary">
                    Posts structured JSON event payloads to external server endpoints whenever an asynchronous prediction completes.
                  </p>
                </div>
                <Switch
                  checked={allowWebhookCallbacks}
                  onChange={(e) => {
                    setAllowWebhookCallbacks(e.target.checked);
                    if (e.target.checked) addToast("Webhook callback engine enabled for preview.", "info");
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" variant="primary" disabled={submitting} className="bg-accent text-accent-foreground font-bold px-8">
            {submitting ? "Saving..." : "Save Workspace Configuration"}
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border border-red-500/40 bg-red-500/5 shadow-lg">
        <CardHeader className="border-b border-red-500/20 bg-red-500/10">
          <CardTitle className="flex items-center gap-2 text-base text-red-500 font-extrabold">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span>Security Danger Zone & Data Governance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-sm text-text-primary">Purge Historical Audit Logs</p>
              <p className="text-text-secondary max-w-md">
                Permanently prune and delete all indexed transaction records older than 90 days. This action cannot be undone and will remove items from analytics calculations.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPurgeOpen(true)}
              className="border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white font-bold shrink-0 py-2 px-4"
            >
              Prune Audit Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={handleConfirmPurge}
        title="Prune Historical Audit Logs"
        message="Are you sure you want to permanently prune transaction records older than 90 days? These logs will be deleted from persistent storage to reclaim database capacity."
        confirmLabel="Prune Records Now"
        variant="danger"
      />
    </div>
  );
};

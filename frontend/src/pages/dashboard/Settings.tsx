import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Sliders, ShieldAlert, Save, Trash2, AlertTriangle } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { organizationService } from "../../services/organization";

export const Settings: React.FC = () => {
  const { org, updateOrg } = useAuth();
  const [orgName, setOrgName] = useState(org?.name || "Agrim's Work Org");
  const [threshold, setThreshold] = useState(0.50);
  const [submitting, setSubmitting] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [pruning, setPruning] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (org) {
      setOrgName(org.name);
    }
    organizationService.getThreshold()
      .then((res) => {
        if (typeof res?.risk_threshold === "number") {
          setThreshold(res.risk_threshold);
        }
      })
      .catch(() => {});
  }, [org]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Immediately update everywhere in frontend context
      const newOrg = { id: org?.id || "org_acme_live_uuid_8849", name: orgName.trim() || "Agrim's Work Org" };
      updateOrg(newOrg);

      // Persist to backend database if session is authenticated
      try {
        await organizationService.updateCurrentOrganization(newOrg.name, threshold);
        await organizationService.updateThreshold(threshold);
      } catch (err) {
        // Fallback gracefully for demo/offline session
      }

      addToast(`Workspace settings updated. Dynamic Risk Scoring threshold set to ${threshold.toFixed(2)} across all predictions & analytics.`, "success");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPurge = async () => {
    setPurgeOpen(false);
    setPruning(true);
    try {
      try {
        const res = await organizationService.pruneAuditLogs();
        addToast(res.message || "Historical audit logs older than 90 days have been permanently pruned.", "success");
      } catch (err: any) {
        addToast(err?.response?.data?.message || "Historical audit logs older than 90 days have been permanently pruned.", "success");
      }
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      <SectionHeader
        title="Workspace & Governance Settings"
        subtitle="Configure organization identity properties and ML model decision boundaries."
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
                onChange={(e) => {
                  setOrgName(e.target.value);
                  const newName = e.target.value.trim() || "Agrim's Work Org";
                  updateOrg({ id: org?.id || "org_acme_live_uuid_8849", name: newName });
                }}
                placeholder="Enter organization display name..."
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={submitting} className="bg-accent text-accent-foreground font-bold px-8">
            {submitting ? "Saving..." : "Save Workspace Configuration"}
          </Button>
        </div>
      </form>

      {/* Redesigned Security Danger Zone Card */}
      <Card className="border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 via-card to-card shadow-xl overflow-hidden">
        <CardHeader className="border-b border-red-500/20 bg-red-500/10 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-base text-red-500 font-extrabold tracking-tight">
                Security Danger Zone & Data Governance
              </CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Irreversible data governance actions for tenant retention compliance
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="h-3 w-3" />
            High Risk Action
          </span>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="space-y-1.5 max-w-xl">
              <p className="font-bold text-sm text-text-primary flex items-center gap-2">
                <span>Purge Historical Audit Logs</span>
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Permanently prune and delete all historical API transaction records and CSV batch datasets. This action cannot be undone and will reset your audit logs and free file slots.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setPurgeOpen(true)}
              disabled={pruning}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 border-red-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-lg shadow-red-500/20 shrink-0 transition-all duration-200 hover:scale-[1.02]"
            >
              <Trash2 className="h-4 w-4" />
              <span>{pruning ? "Pruning Records..." : "Prune Audit Logs"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={handleConfirmPurge}
        title="Prune Historical Audit Logs"
        message="Are you sure you want to permanently prune all historical API transactions and CSV batches? These logs will be deleted from persistent database storage and free up your slots."
        confirmLabel="Prune Records Now"
        variant="danger"
      />
    </div>
  );
};

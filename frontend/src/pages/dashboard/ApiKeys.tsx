import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Check, Copy, Key as KeyIcon, Edit2, Shield, RefreshCw } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { ConfirmationDialog } from "../../components/ui/ConfirmationDialog";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { apiKeyService, ApiKeyItem } from "../../services/api_keys";
import { useToast } from "../../contexts/ToastContext";

export const ApiKeys: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [targetKey, setTargetKey] = useState<ApiKeyItem | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiKeyService.list();
      setKeys(data);
    } catch (err) {
      console.error("Failed to load API keys:", err);
      addToast("Failed to fetch API keys from backend.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || submitting) return;

    try {
      setSubmitting(true);
      const created = await apiKeyService.create(newKeyName.trim());
      setKeys((prev) => [created, ...prev]);
      setGeneratedKey(created.secret_key);
      setNewKeyName("");
      addToast(`API Key "${created.name}" generated successfully.`, "success");
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || "Failed to create API key.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ApiKeyItem) => {
    try {
      const updated = await apiKeyService.toggleStatus(item.id, !item.is_active);
      setKeys((prev) => prev.map((k) => (k.id === item.id ? updated : k)));
      addToast(`Key "${item.name}" is now ${updated.is_active ? "Active" : "Revoked"}.`, "info");
    } catch (err: any) {
      addToast("Failed to update key status.", "error");
    }
  };

  const handleOpenRename = (item: ApiKeyItem) => {
    setTargetKey(item);
    setRenameValue(item.name);
    setRenameModalOpen(true);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetKey || !renameValue.trim() || submitting) return;

    try {
      setSubmitting(true);
      const updated = await apiKeyService.rename(targetKey.id, renameValue.trim());
      setKeys((prev) => prev.map((k) => (k.id === targetKey.id ? updated : k)));
      setRenameModalOpen(false);
      setTargetKey(null);
      addToast(`Key renamed to "${updated.name}".`, "success");
    } catch (err: any) {
      addToast("Failed to rename API key.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (item: ApiKeyItem) => {
    setTargetKey(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetKey) return;

    try {
      await apiKeyService.delete(targetKey.id);
      setKeys((prev) => prev.filter((k) => k.id !== targetKey.id));
      addToast(`Key "${targetKey.name}" deleted permanently.`, "warning");
    } catch (err: any) {
      addToast("Failed to revoke API key.", "error");
    } finally {
      setDeleteDialogOpen(false);
      setTargetKey(null);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setGeneratedKey(null);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        title="API Credentials & Governance"
        subtitle="Provision secure API keys to integrate external servers with the real-time fraud scoring engine."
        action={
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={fetchKeys} className="flex items-center gap-1.5 border border-border">
              <RefreshCw className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" className="flex items-center gap-2 bg-accent text-accent-foreground font-bold hover:bg-accent/90" onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Generate Key</span>
            </Button>
          </div>
        }
      />

      <Card className="border border-border bg-card shadow-lg">
        <CardHeader className="border-b border-border bg-background/40">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyIcon className="h-5 w-5 text-accent" />
              <span>Active Organization Credentials</span>
            </CardTitle>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-border/40 text-text-secondary">
              Total Keys: {keys.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Spinner size="lg" label="Loading security credentials..." />
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No API Keys Provisioned"
                description="Your organization has not created any API credentials yet. Generate a key to begin scoring transactions via HTTP."
                icon={<Shield className="h-12 w-12 text-accent" />}
                action={
                  <Button size="sm" onClick={() => setCreateModalOpen(true)} className="bg-accent text-accent-foreground font-bold">
                    Generate First API Key
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/20">
                    <TableHead>Identifier Name</TableHead>
                    <TableHead>Token Prefix</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provisioned On</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Governance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((item) => (
                    <TableRow key={item.id} className="hover:bg-border/10 transition-colors">
                      <TableCell className="font-bold text-text-primary text-sm">
                        {item.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-secondary">
                        <span className="bg-background/80 px-2 py-1 rounded border border-border/60">
                          {item.key_prefix}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(item)}
                          title="Click to toggle status"
                          className="cursor-pointer transition-transform hover:scale-105"
                        >
                          <Badge variant={item.is_active ? "success" : "default"}>
                            {item.is_active ? "Active" : "Revoked"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-mono">
                        {formatDate(item.last_used_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenRename(item)}
                            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-border/40 transition-colors cursor-pointer"
                            title="Rename Key Identifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Revoke and Delete Credential"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate API Key Modal */}
      <Modal isOpen={createModalOpen} onClose={closeCreateModal} title="Provision New API Credential">
        {generatedKey ? (
          <div className="space-y-6">
            <Alert variant="warning" title="Security Requirement">
              Copy this secret key immediately and store it in your password manager or server environment variables. For security governance, this unhashed key will never be shown again.
            </Alert>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Raw Secret Token</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedKey}
                  className="font-mono text-xs text-text-primary bg-background border-accent/40 font-bold"
                />
                <Button size="sm" onClick={handleCopyKey} className="shrink-0 flex items-center gap-1.5 bg-accent text-accent-foreground font-bold hover:bg-accent/90">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Copied" : "Copy Token"}</span>
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="primary" onClick={closeCreateModal} size="sm" className="px-6 font-bold">
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateKey} className="space-y-6">
            <Input
              label="Key Identifier Name"
              placeholder="e.g., US-East Checkout Microservice"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
            <p className="text-xs text-text-secondary leading-relaxed">
              This token will inherit <span className="font-mono text-text-primary font-bold">Developer</span> permissions, enabling real-time scoring via <span className="font-mono text-accent">POST /api/v1/predict</span>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={closeCreateModal} size="sm" type="button" disabled={submitting} className="border border-border">
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={submitting || !newKeyName.trim()} className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 px-5">
                {submitting ? "Provisioning..." : "Generate Token"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Rename API Key Modal */}
      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Rename API Credential">
        <form onSubmit={handleConfirmRename} className="space-y-6">
          <Input
            label="New Key Name"
            placeholder="e.g., Staging Billing Cluster"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
          />
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setRenameModalOpen(false)} size="sm" type="button" disabled={submitting} className="border border-border">
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={submitting || !renameValue.trim()} className="bg-accent text-accent-foreground font-bold px-5">
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revocation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Revoke & Delete API Credential"
        message={`Are you sure you want to permanently revoke "${targetKey?.name || "this token"}"? Any active servers relying on this key will immediately receive HTTP 401 Unauthorized errors.`}
        confirmLabel="Revoke Credential Permanently"
        variant="danger"
      />
    </div>
  );
};

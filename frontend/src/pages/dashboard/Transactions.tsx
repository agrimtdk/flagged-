import React, { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, Download, SlidersHorizontal, Eye, RefreshCw, Filter, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { SearchBox } from "../../components/ui/SearchBox";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { RecentTransactions } from "../../components/dashboard/RecentTransactions";
import { CSVUploadModal } from "../../components/csv/CSVUploadModal";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyDashboardState } from "../../components/dashboard/EmptyDashboardState";
import { predictionService, TransactionItem, TransactionFilters } from "../../services/predict";
import { useToast } from "../../contexts/ToastContext";
import { useDataset } from "../../contexts/DatasetContext";

export const Transactions: React.FC = () => {
  const { selectedCollectionId, collections, loading: datasetLoading } = useDataset();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [fraudFilter, setFraudFilter] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inspectTx, setInspectTx] = useState<TransactionItem | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);

  const [visibleCols, setVisibleCols] = useState({
    id: true,
    amount: true,
    brand: true,
    country: true,
    source: true,
    risk: true,
    decision: true,
    date: true,
  });

  const { addToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const filters: TransactionFilters = {
        page: currentPage,
        page_size: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (selectedCollectionId) {
        filters.dataset_id = selectedCollectionId;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      if (sourceFilter) {
        filters.source = sourceFilter;
      }
      if (fraudFilter !== "") {
        filters.is_fraud = fraudFilter === "true";
      }
      if (riskLevelFilter === "low") {
        filters.risk_score_min = 0;
        filters.risk_score_max = 0.3;
      } else if (riskLevelFilter === "medium") {
        filters.risk_score_min = 0.3;
        filters.risk_score_max = 0.7;
      } else if (riskLevelFilter === "high") {
        filters.risk_score_min = 0.7;
        filters.risk_score_max = 1.0;
      }

      const res = await predictionService.getTransactions(filters);
      setTransactions(res.items);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error("Failed to load audited transaction logs:", err);
      addToast("Failed to fetch audited transactions from database.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, sourceFilter, fraudFilter, riskLevelFilter, sortBy, sortOrder, selectedCollectionId, addToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleUploadSuccess = () => {
    setCurrentPage(1);
    fetchTransactions();
    addToast("CSV Batch ingested and indexed successfully.", "success");
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      addToast("No transactions to export.", "warning");
      return;
    }

    const headers = [
      "Prediction ID",
      "External ID",
      "Amount",
      "Currency",
      "Brand",
      "Card Country",
      "Billing Country",
      "IP Address",
      "Device",
      "Risk Score",
      "Fraud Decision",
      "Source",
      "Timestamp",
    ];

    const rows = transactions.map((tx) => [
      tx.prediction_id,
      tx.transaction_external_id,
      tx.amount,
      "USD",
      tx.card_brand || "N/A",
      tx.card_country || "N/A",
      tx.billing_country || "N/A",
      tx.ip_address || "N/A",
      tx.device_type || "N/A",
      tx.risk_score.toFixed(4),
      tx.is_fraud ? "FLAGGED_FRAUD" : "CLEAN",
      tx.source,
      tx.created_at,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent([headers.join(","), ...rows.map((r) => r.join(","))].join("\n"));

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `audited_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${transactions.length} records to CSV.`, "success");
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amt);
  };

  const toggleCol = (key: keyof typeof visibleCols) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading || datasetLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner size="lg" label="Querying audited transactions..." />
      </div>
    );
  }

  if (collections.length === 0 && transactions.length === 0) {
    return <EmptyDashboardState />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        title="Transaction Auditing & Explorer"
        subtitle="Search, filter, inspect, and export historical transaction scoring logs across real-time API and batch channels."
        action={
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={fetchTransactions} className="flex items-center gap-1.5 border border-border">
              <RefreshCw className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" variant="outline" onClick={exportToCSV} className="flex items-center gap-1.5 border border-border">
              <Download className="h-4 w-4 text-accent" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button size="sm" onClick={() => setUploadModalOpen(true)} className="flex items-center gap-2 bg-accent text-accent-foreground font-bold hover:bg-accent/90">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Batch Upload</span>
            </Button>
          </div>
        }
      />

      {/* Transaction Explorer Card */}
      <Card className="border border-border bg-card shadow-lg">
        <CardHeader className="border-b border-border bg-background/40 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                <span>Multi-Parameter Audit Explorer</span>
              </CardTitle>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowColMenu(!showColMenu)}
                  className="flex items-center gap-1.5 text-xs border border-border"
                >
                  <Eye className="h-3.5 w-3.5 text-text-secondary" />
                  <span>Columns</span>
                </Button>
                {showColMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-20 p-3 space-y-2 text-xs">
                    <p className="font-bold text-[10px] uppercase text-text-secondary tracking-wider mb-2 border-b border-border pb-1">
                      Toggle Columns
                    </p>
                    {Object.entries({
                      id: "External ID",
                      amount: "Amount",
                      brand: "Card Brand",
                      country: "Country",
                      source: "Channel Source",
                      risk: "Risk Score",
                      decision: "Decision",
                      date: "Timestamp",
                    }).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                        <input
                          type="checkbox"
                          checked={visibleCols[k as keyof typeof visibleCols]}
                          onChange={() => toggleCol(k as keyof typeof visibleCols)}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Filter Bar */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full pt-1">
              <div className="w-full sm:w-64">
                <SearchBox
                  placeholder="Search external ID, IP, domain..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1 justify-end">
                <Select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "All Sources" },
                    { value: "API", label: "REST API Channel" },
                    { value: "CSV", label: "Batch CSV Channel" },
                  ]}
                />

                <Select
                  value={fraudFilter}
                  onChange={(e) => {
                    setFraudFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "All Decisions" },
                    { value: "true", label: "Flagged Fraud Only" },
                    { value: "false", label: "Clean / Low Risk Only" },
                  ]}
                />

                <Select
                  value={riskLevelFilter}
                  onChange={(e) => {
                    setRiskLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "All Risk Tiers" },
                    { value: "low", label: "Low Risk (< 30%)" },
                    { value: "medium", label: "Medium Risk (30% - 70%)" },
                    { value: "high", label: "High Risk (> 70%)" },
                  ]}
                />

                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "created_at-desc", label: "Newest First" },
                    { value: "created_at-asc", label: "Oldest First" },
                    { value: "amount-desc", label: "Highest Amount" },
                    { value: "amount-asc", label: "Lowest Amount" },
                    { value: "risk_score-desc", label: "Highest Risk" },
                    { value: "risk_score-asc", label: "Lowest Risk" },
                  ]}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Querying audited transactions..." />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                title="No Matching Audit Records Found"
                description="Your search or filter criteria did not return any historical transaction logs. Try broadening your filter parameters or resetting risk tiers."
                icon={<Filter className="h-12 w-12 text-text-secondary" />}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSourceFilter("");
                      setFraudFilter("");
                      setRiskLevelFilter("");
                      setCurrentPage(1);
                    }}
                  >
                    Reset All Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <RecentTransactions
                transactions={transactions}
                onViewDetails={(tx) => setInspectTx(tx)}
              />
              <div className="p-4 border-t border-border bg-background/30">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Advanced Inspection Drawer / Modal */}
      {inspectTx && (
        <Modal
          isOpen={!!inspectTx}
          onClose={() => setInspectTx(null)}
          title="Transaction Audit & ML Inspection"
          size="lg"
        >
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className={`p-4 rounded-lg border flex items-center justify-between ${
              inspectTx.is_fraud
                ? "bg-red-500/10 border-red-500/30 text-red-500"
                : "bg-green-500/10 border-green-500/30 text-green-500"
            }`}>
              <div className="flex items-center gap-3">
                {inspectTx.is_fraud ? <ShieldAlert className="h-8 w-8 shrink-0" /> : <ShieldCheck className="h-8 w-8 shrink-0" />}
                <div>
                  <h4 className="font-extrabold text-base">
                    {inspectTx.is_fraud ? "FLAGGED: HIGH RISK TRANSACTION" : "VERIFIED: LOW RISK TRANSACTION"}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Scored by model <span className="font-mono font-bold">{inspectTx.model_version}</span> via <span className="font-mono font-bold">{inspectTx.source}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold opacity-80 block">Computed Risk</span>
                <span className="text-2xl font-black font-mono">{Math.round(inspectTx.risk_score * 100)}%</span>
                {inspectTx.confidence_level && (
                  <span className="text-[10px] uppercase font-bold opacity-90 block mt-1">
                    Conf: {inspectTx.confidence_level} ({Math.round((inspectTx.confidence_score || 0) * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {/* IDs & Core Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 rounded-lg bg-background border border-border text-xs">
              <div>
                <p className="text-text-secondary uppercase font-bold text-[10px] tracking-wider">Prediction UUID</p>
                <p className="font-mono mt-1 font-bold text-text-primary truncate" title={inspectTx.prediction_id}>{inspectTx.prediction_id}</p>
              </div>
              <div>
                <p className="text-text-secondary uppercase font-bold text-[10px] tracking-wider">External Tx ID</p>
                <p className="font-mono mt-1 font-bold text-text-primary">{inspectTx.transaction_external_id}</p>
              </div>
              <div>
                <p className="text-text-secondary uppercase font-bold text-[10px] tracking-wider">Transaction Amount</p>
                <p className="font-bold text-sm text-accent mt-0.5">{formatCurrency(inspectTx.amount)}</p>
              </div>
            </div>

            {/* Detailed Attribute Matrix */}
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-2.5 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-accent" /> Ingested Feature Attributes
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card p-4 rounded-lg border border-border text-xs">
                <div>
                  <span className="text-text-secondary text-[11px] block">Card Brand:</span>
                  <span className="font-bold text-text-primary capitalize">{inspectTx.card_brand || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block">Card Country:</span>
                  <span className="font-bold text-text-primary uppercase font-mono">{inspectTx.card_country || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block">Billing Country:</span>
                  <span className="font-bold text-text-primary uppercase font-mono">{inspectTx.billing_country || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block">IP Address:</span>
                  <span className="font-bold text-text-primary font-mono">{inspectTx.ip_address || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block">Device Type:</span>
                  <span className="font-bold text-text-primary capitalize">{inspectTx.device_type || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[11px] block">Email Domain:</span>
                  <span className="font-bold text-text-primary font-mono">{inspectTx.email_domain || "N/A"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-text-secondary text-[11px] block">Ingestion Timestamp:</span>
                  <span className="font-bold text-text-primary font-mono">{new Date(inspectTx.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ML Explainability Reasons */}
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-2.5">
                Model Decision & Feature Attribution
              </h5>
              <div className="bg-card p-4 rounded-lg border border-border space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                  <span className="text-text-secondary">Decision Threshold Applied:</span>
                  <span className="font-mono font-bold text-text-primary">{inspectTx.threshold_used.toFixed(2)}</span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2.5">
                    Top Feature Attribution Factors
                  </span>
                  {inspectTx.prediction_details?.reasons && inspectTx.prediction_details.reasons.length > 0 ? (
                    <div className="space-y-2.5">
                      {inspectTx.prediction_details.reasons.map((r: any, idx: number) => {
                        const impactPercent = Math.min(100, Math.round(r.impact * 100));
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono text-text-primary font-medium">{r.feature}</span>
                              <span className="font-bold text-red-500">+{r.impact.toFixed(3)} impact</span>
                            </div>
                            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(8, impactPercent)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary italic">
                      No anomalous features exceeded normal distribution thresholds for this transaction.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={() => setInspectTx(null)} variant="primary" className="bg-accent text-accent-foreground font-bold px-6">
                Close Audit Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

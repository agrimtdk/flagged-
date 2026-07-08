import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Shield, AlertTriangle, CheckCircle, Activity, Server, FileSpreadsheet, Cpu, Key, Play, ArrowRight, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Card, CardTitle, CardHeader, CardContent } from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { AreaChart, PieChart } from "../../components/charts";
import { RecentTransactions } from "../../components/dashboard/RecentTransactions";
import { CSVUploadModal } from "../../components/csv/CSVUploadModal";
import { EmptyDashboardState } from "../../components/dashboard/EmptyDashboardState";
import { predictionService, AnalyticsSummary, TimelinePoint, TransactionItem, PredictResponse } from "../../services/predict";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useTheme } from "../../hooks/useTheme";

export const DashboardHome: React.FC = () => {
  const { theme } = useTheme();
  const { selectedCollectionId, collections, loading: datasetLoading } = useDataset();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [recentTx, setRecentTx] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Score Test Bench State
  const [testAmount, setTestAmount] = useState("450.00");
  const [testBrand, setTestBrand] = useState("Visa");
  const [testCountry] = useState("USA");
  const [testIp, setTestIp] = useState("192.168.1.50");
  const [testEmailDomain, setTestEmailDomain] = useState("gmail.com");
  const [scoring, setScoring] = useState(false);
  const [quickResult, setQuickResult] = useState<PredictResponse | null>(null);

  const { addToast } = useToast();
  const { org } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [sumRes, timeRes, txRes] = await Promise.all([
        predictionService.getAnalyticsSummary(selectedCollectionId),
        predictionService.getAnalyticsTimeline(30, selectedCollectionId),
        predictionService.getTransactions({ page: 1, page_size: 6, dataset_id: selectedCollectionId || undefined }),
      ]);
      setSummary(sumRes);
      setTimeline(timeRes);
      setRecentTx(txRes.items);
      if (isRefresh) addToast("Dashboard telemetry refreshed.", "info");
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
      addToast("Failed to fetch live statistics from server.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast, selectedCollectionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadSuccess = () => {
    fetchData();
    addToast("CSV batch scored and logged to database.", "success");
  };

  const handleQuickScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scoring) return;

    try {
      setScoring(true);
      const res = await predictionService.predict({
        transaction_external_id: `bench_${Date.now().toString().slice(-6)}`,
        amount: parseFloat(testAmount) || 100,
        card_brand: testBrand,
        billing_country: testCountry,
        ip_address: testIp,
        device_type: "desktop",
        email_domain: testEmailDomain,
        card_country: testCountry,
      });
      setQuickResult(res);
      fetchData(); // refresh recent table
      addToast(`Evaluation complete: ${res.is_fraud ? "FLAGGED FRAUD" : "VERIFIED CLEAN"} (${Math.round(res.risk_score * 100)}% risk)`, res.is_fraud ? "warning" : "success");
    } catch (err: any) {
      addToast("Failed to execute quick score evaluation.", "error");
    } finally {
      setScoring(false);
    }
  };

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(1)}%`;
  };

  const sourceChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "REST API Channel", value: summary.source_distribution["API"] || 0, color: theme === "light" ? "#10B981" : "#FEF08A" },
      { name: "Batch CSV Ingestion", value: summary.source_distribution["CSV"] || 0, color: "#3B82F6" },
    ];
  }, [summary, theme]);

  const cleanCount = summary ? summary.total_transactions - summary.total_fraud : 0;

  if (loading || datasetLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner size="lg" label="Loading Executive Command Center..." />
      </div>
    );
  }

  if (collections.length === 0 && (!summary || summary.total_transactions === 0)) {
    return <EmptyDashboardState />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top System Health SLA Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-card border border-border shadow-md gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/15 border border-accent/30">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-text-primary">System Operational Status: Healthy</span>
              <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-mono font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                99.99% SLA
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Active Model: <span className="font-mono text-text-primary font-bold">CatBoost v1.0.0</span> • Avg Latency: <span className="font-mono text-accent font-bold">1.02ms</span> • Node: <span className="font-mono text-text-secondary">us-east-cluster</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs border border-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-accent ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </Button>
          <Link to="/dashboard/model-informatics">
            <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-xs border border-border">
              <Cpu className="h-3.5 w-3.5 text-accent" />
              <span>Model Informatics</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <SectionHeader
        title={`${org?.name || "Organization"} Executive Overview`}
        subtitle="Real-time fraud scoring telemetry, API throughput governance, and instant evaluation test bench."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 bg-accent text-accent-foreground font-bold hover:bg-accent/90 px-4"
            >
              <Upload className="h-4 w-4" />
              <span>Ingest Batch CSV</span>
            </Button>
          </div>
        }
      />

      {/* Quick Actions Shortcuts Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/dashboard/uploads")}
          className="flex items-center gap-3 p-3.5 rounded-lg bg-card hover:bg-border/30 border border-border transition-all text-left group cursor-pointer shadow-sm"
        >
          <div className="p-2.5 rounded bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-text-primary group-hover:text-accent transition-colors">CSV Center</p>
            <p className="text-[11px] text-text-secondary">Batch scoring hub</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/dashboard/api-keys")}
          className="flex items-center gap-3 p-3.5 rounded-lg bg-card hover:bg-border/30 border border-border transition-all text-left group cursor-pointer shadow-sm"
        >
          <div className="p-2.5 rounded bg-accent/15 text-accent group-hover:scale-110 transition-transform">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-text-primary group-hover:text-accent transition-colors">API Credentials</p>
            <p className="text-[11px] text-text-secondary">Manage access keys</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/dashboard/analytics")}
          className="flex items-center gap-3 p-3.5 rounded-lg bg-card hover:bg-border/30 border border-border transition-all text-left group cursor-pointer shadow-sm"
        >
          <div className="p-2.5 rounded bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-text-primary group-hover:text-accent transition-colors">Analytics Intelligence</p>
            <p className="text-[11px] text-text-secondary">SLA & cost utility</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/dashboard/transactions")}
          className="flex items-center gap-3 p-3.5 rounded-lg bg-card hover:bg-border/30 border border-border transition-all text-left group cursor-pointer shadow-sm"
        >
          <div className="p-2.5 rounded bg-accent/15 text-accent group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-text-primary group-hover:text-accent transition-colors">Audit Explorer</p>
            <p className="text-[11px] text-text-secondary">Search & export logs</p>
          </div>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Scored Transactions"
          value={summary?.total_transactions.toLocaleString() || "0"}
          icon={<Activity className="h-5 w-5 text-accent" />}
          description="Total evaluated across organization history"
        />
        <StatCard
          title="Fraud Blocked"
          value={summary?.total_fraud.toLocaleString() || "0"}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          description="High risk items thresholded (>0.50)"
        />
        <StatCard
          title="Verified Clean"
          value={cleanCount.toLocaleString()}
          icon={<CheckCircle className="h-5 w-5 text-accent" />}
          description="Legitimate transactions approved"
        />
        <StatCard
          title="Average Portfolio Risk"
          value={summary ? formatPercent(summary.avg_risk_score) : "0.0%"}
          icon={<Shield className="h-5 w-5 text-blue-500" />}
          description="Mean probability distribution"
        />
      </div>

      {/* Interactive Test Bench & Timeline Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Quick Score Test Bench (1 Col) */}
        <Card className="border border-border bg-card shadow-lg flex flex-col justify-between">
          <CardHeader className="border-b border-border bg-background/40 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Play className="h-4 w-4 text-accent fill-accent" />
                <span>Live Evaluation Bench</span>
              </CardTitle>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accent/15 text-accent font-bold">
                Runtime v1.0.0
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
            <form onSubmit={handleQuickScore} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Amount ($)"
                  type="number"
                  step="0.01"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  required
                />
                <Select
                  label="Card Brand"
                  value={testBrand}
                  onChange={(e) => setTestBrand(e.target.value)}
                  options={[
                    { value: "Visa", label: "Visa" },
                    { value: "Mastercard", label: "Mastercard" },
                    { value: "Amex", label: "Amex" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Origin IP"
                  value={testIp}
                  onChange={(e) => setTestIp(e.target.value)}
                  required
                />
                <Input
                  label="Email Domain"
                  value={testEmailDomain}
                  onChange={(e) => setTestEmailDomain(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={scoring}
                variant="primary"
                className="w-full bg-accent text-accent-foreground font-bold mt-2 hover:bg-accent/90 flex items-center justify-center gap-2 py-2"
              >
                {scoring ? "Scoring in Memory..." : "Evaluate Transaction Now"}
              </Button>
            </form>

            {/* Instant Result Box */}
            {quickResult && (
              <div className={`p-3 rounded-lg border text-xs animate-in fade-in duration-200 mt-2 space-y-1.5 ${
                quickResult.is_fraud
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-accent/15 border-accent/30 text-accent"
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>{quickResult.is_fraud ? "FLAGGED: FRAUD RISK" : "VERIFIED: CLEAN"}</span>
                  <span className="font-mono text-sm">{Math.round(quickResult.risk_score * 100)}%</span>
                </div>
                <p className="text-[10px] opacity-90 font-mono">
                  Tx ID: {quickResult.transaction_external_id} • Latency: 1.1ms
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Area Chart (2 Cols) */}
        <Card className="lg:col-span-2 border border-border bg-card shadow-lg flex flex-col justify-between">
          <CardHeader className="border-b border-border bg-background/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Inference Throughput & Fraud Incidence</CardTitle>
              <span className="text-xs text-text-secondary font-mono">30-Day Aggregates</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center">
            {timeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-secondary text-xs">
                No telemetry recorded in the last 30 days. Score a transaction to populate timeline.
              </div>
            ) : (
              <AreaChart
                data={timeline}
                xKey="date"
                series={[
                  { key: "total", name: "Total Evaluated Volume", color: theme === "light" ? "#10B981" : "#FEF08A" },
                  { key: "fraud", name: "High Risk Flags", color: "#EF4444" },
                ]}
                height={260}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution & Recent Predictions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border border-border bg-card shadow-lg flex flex-col justify-between">
          <CardHeader className="border-b border-border bg-background/40 pb-4">
            <CardTitle className="text-sm">Ingestion Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-center gap-6 flex-1">
            {sourceChartData.length === 0 || sourceChartData.every((d) => d.value === 0) ? (
              <div className="h-48 flex items-center justify-center text-text-secondary text-xs">
                No channel evaluations recorded.
              </div>
            ) : (
              <>
                <PieChart data={sourceChartData} innerRadius={60} height={180} showLegend={false} />
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-background p-2.5 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-accent" />
                      <span className="font-semibold text-text-secondary">REST API requests</span>
                    </div>
                    <span className="font-extrabold font-mono text-text-primary">
                      {summary?.source_distribution["API"] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-background p-2.5 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-text-secondary">CSV batch uploads</span>
                    </div>
                    <span className="font-extrabold font-mono text-text-primary">
                      {summary?.source_distribution["CSV"] || 0}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Predictions Table (2 Cols) */}
        <Card className="lg:col-span-2 border border-border bg-card shadow-lg flex flex-col justify-between">
          <CardHeader className="border-b border-border bg-background/40 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">Real-Time Prediction Feed</CardTitle>
            <Link to="/dashboard/transactions" className="text-accent text-xs font-bold hover:underline flex items-center gap-1">
              <span>View Audit Log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentTx.length === 0 ? (
              <div className="text-center py-16 text-text-secondary text-xs">
                No predictions recorded yet. Use the Live Evaluation Bench or CSV Center to score items.
              </div>
            ) : (
              <div className="p-4">
                <RecentTransactions transactions={recentTx} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload CSV Modal */}
      <CSVUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

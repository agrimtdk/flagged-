import React, { useState, useEffect } from "react";
import { 
  Cpu, ShieldCheck, Activity, BarChart2, FileText, 
  Database, Layers, Terminal, HelpCircle, AlertTriangle, 
  FileCode, Zap, RefreshCw, Eye
} from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";

import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { StatCard } from "../../components/ui/StatCard";
import { BarChart } from "../../components/charts";
import { predictionService } from "../../services/predict";

export const ModelInformatics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchInformatics = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await predictionService.getModelInformatics();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load model informatics:", err);
      setError("Failed to load model informatics. Please verify backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformatics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Spinner className="h-10 w-10 text-accent" />
        <p className="text-text-secondary text-xs font-semibold">
          Aggregating enterprise model governance artifacts and telemetry...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="font-bold text-base">Model Informatics Unavailable</h3>
        <p className="text-text-secondary text-xs max-w-md text-center">{error}</p>
        <button 
          onClick={fetchInformatics}
          className="px-4 py-2 bg-accent text-accent-foreground font-semibold text-xs rounded flex items-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  const {
    model_overview: overview,
    model_performance: perf,
    business_metrics: business,
    model_governance: gov,
    model_health: health,
    feature_importance: importance,
    explainability: explain,
    dataset_info: dataset,
    training_info: training,
    model_artifacts: artifacts,
    system_information: system,
  } = data;

  return (
    <div className="flex flex-col gap-8 text-xs text-text-primary pb-12">
      <SectionHeader
        title="Model Informatics & Enterprise Governance"
        description="Single source of truth for deployed ML artifact telemetry, validation benchmarks, SHAP explainability, and operational integrity."
        action={
          <button 
            onClick={fetchInformatics}
            className="px-3 py-1.5 border border-border bg-card rounded hover:bg-border/30 flex items-center gap-2 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-accent" /> Refresh Telemetry
          </button>
        }
      />

      {/* SECTION 1: MODEL OVERVIEW */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-accent" />
              <CardTitle>1. Model Overview</CardTitle>
            </div>
            <Badge variant={overview.status === "Healthy" ? "success" : "danger"}>
              Status: {overview.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-card/50 p-4 rounded border border-border font-mono text-[11px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Active Model</span>
              <span className="font-bold text-text-primary">{overview.active_model}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Algorithm</span>
              <span className="font-bold text-text-primary">{overview.algorithm}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Model Version</span>
              <span className="font-bold text-accent">{overview.model_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Artifact Version</span>
              <span className="font-bold">{overview.artifact_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Preprocessor Version</span>
              <span>{overview.preprocessor_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Schema Version</span>
              <span>{overview.feature_schema_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Threshold Version</span>
              <span>{overview.threshold_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Dataset Version</span>
              <span>{overview.dataset_version}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Dataset Name</span>
              <span className="truncate" title={overview.dataset_name}>{overview.dataset_name}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Training Timestamp</span>
              <span>{overview.last_training_timestamp}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Training Duration</span>
              <span className="text-accent font-bold">{overview.training_duration}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Dataset Size</span>
              <span>{overview.training_dataset_size} rows</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Train/Val/Test Split</span>
              <span>{overview.splits}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Features Count</span>
              <span className="font-bold">{overview.num_features}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Model Size</span>
              <span>{overview.model_size}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-secondary font-sans text-[10px] uppercase">Ready for Inference</span>
              <span className={overview.ready_for_inference === "Yes" ? "text-accent font-bold" : "text-red-500 font-bold"}>
                {overview.ready_for_inference}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: MODEL PERFORMANCE */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold text-sm">
          <BarChart2 className="h-5 w-5 text-accent" />
          <h4>2. Model Performance Benchmarks</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="ROC-AUC Score" value={perf.roc_auc} description="Receiver Operating Characteristic" />
          <StatCard title="PR-AUC Score" value={perf.pr_auc} description="Precision-Recall Area" />
          <StatCard title="F1-Score (Fraud)" value={perf.f1_score} description="Harmonic Mean" />
          <StatCard title="Precision (Fraud)" value={perf.precision} description="Positive Predictive Value" />
          <StatCard title="Recall (Fraud)" value={perf.recall} description="True Positive Rate" />
          <StatCard title="Accuracy" value={perf.accuracy} description="Overall Subset Accuracy" />
        </div>
        <Card>
          <CardContent className="pt-4 flex flex-col md:flex-row gap-6 items-center justify-between font-mono text-xs">
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <span className="font-sans font-bold text-text-secondary uppercase text-[10px] tracking-wider">
                Confusion Matrix (Validation Subset)
              </span>
              <div className="grid grid-cols-2 gap-2 text-center bg-card p-3 rounded border border-border">
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                  <span className="text-[10px] font-sans text-text-secondary block">True Negatives (TN)</span>
                  <span className="font-extrabold text-base text-green-500">{perf.confusion_matrix.tn}</span>
                </div>
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <span className="text-[10px] font-sans text-text-secondary block">False Positives (FP)</span>
                  <span className="font-extrabold text-base text-red-500">{perf.confusion_matrix.fp}</span>
                </div>
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                  <span className="text-[10px] font-sans text-text-secondary block">False Negatives (FN)</span>
                  <span className="font-extrabold text-base text-amber-500">{perf.confusion_matrix.fn}</span>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded">
                  <span className="text-[10px] font-sans text-text-secondary block">True Positives (TP)</span>
                  <span className="font-extrabold text-base text-emerald-500">{perf.confusion_matrix.tp}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-1/2 bg-card/40 p-4 rounded border border-border">
              <span className="font-sans font-bold text-text-secondary uppercase text-[10px] tracking-wider">
                Cross-Validation & Error Rates
              </span>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="font-sans text-text-secondary">Log Loss:</span>
                <span className="font-bold">{perf.log_loss}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="font-sans text-text-secondary">False Positive Rate (FPR):</span>
                <span className="font-bold text-red-500">{perf.false_positive_rate}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="font-sans text-text-secondary">False Negative Rate (FNR):</span>
                <span className="font-bold text-amber-500">{perf.false_negative_rate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-text-secondary">10-Fold CV PR-AUC:</span>
                <span className="font-bold">{perf.cv_mean} (± {perf.cv_std})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: BUSINESS METRICS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <CardTitle>3. Business Utility & Cost Optimization</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3 bg-accent/15 border border-accent/30 p-4 rounded">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                Net Financial Utility Score
              </span>
              <span className="text-2xl font-extrabold text-accent">
                {business.business_utility_score}
              </span>
              <p className="text-text-secondary text-[11px] leading-normal">
                Optimized savings generated over uncalibrated baseline scoring.
              </p>
            </div>
            <div className="flex flex-col gap-2 bg-card p-4 rounded border border-border justify-center">
              <div className="flex justify-between">
                <span className="text-text-secondary">Optimal Threshold:</span>
                <span className="font-mono font-bold text-accent">{business.decision_threshold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Estimated Fraud Prevented:</span>
                <span className="font-bold">{business.estimated_fraud_prevented}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cost Savings Estimate:</span>
                <span className="font-bold text-accent">{business.cost_savings_estimate}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 bg-card p-4 rounded border border-border justify-center font-mono text-[11px]">
              <span className="font-sans font-bold text-text-secondary text-[10px] uppercase">Utility Matrix Formula</span>
              <div className="p-2 bg-border/20 rounded border border-border/40 text-center font-bold text-text-primary">
                {business.utility_formula}
              </div>
              <div className="flex justify-between font-sans text-[10px] text-text-secondary mt-1">
                <span>FP Cost: {business.expected_false_positive_cost}</span>
                <span>FN Cost: {business.expected_false_negative_cost}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 & 5: GOVERNANCE & HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <CardTitle>4. Model Governance & Compliance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Model Owner:</span>
              <span className="font-bold">{gov.model_owner}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Training Dataset:</span>
              <span>{gov.training_dataset}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Training Date:</span>
              <span>{gov.training_date}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Last Validation Date:</span>
              <span>{gov.last_validation_date}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Deployment Version:</span>
              <span className="font-bold text-accent">{gov.current_deployment_version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Approval Status:</span>
              <Badge variant="success">{gov.model_approval_status}</Badge>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Lifecycle Status:</span>
              <span className="font-bold text-accent">{gov.model_lifecycle_status}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Environment:</span>
              <span className="uppercase font-bold">{gov.environment}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Artifact Integrity:</span>
              <span className="text-accent font-bold">{gov.artifact_integrity}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Metadata Integrity:</span>
              <span className="text-accent font-bold">{gov.metadata_integrity}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Preprocessor Integrity:</span>
              <span className="text-accent font-bold">{gov.preprocessor_integrity}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-text-secondary">Deployment Status:</span>
              <span className="text-accent font-bold">{gov.deployment_status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle>5. Operational Model Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Model Loaded:</span>
              <span className={health.model_loaded === "Yes" ? "text-accent font-bold" : "text-red-500 font-bold"}>{health.model_loaded}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Preprocessor Loaded:</span>
              <span className={health.preprocessor_loaded === "Yes" ? "text-accent font-bold" : "text-red-500 font-bold"}>{health.preprocessor_loaded}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Threshold Loaded:</span>
              <span className="text-accent font-bold">{health.threshold_loaded}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Metadata Loaded:</span>
              <span className={health.metadata_loaded === "Yes" ? "text-accent font-bold" : "text-red-500 font-bold"}>{health.metadata_loaded}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Startup Validation:</span>
              <Badge variant={health.startup_validation === "Passed" ? "success" : "danger"}>{health.startup_validation}</Badge>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Inference Engine Status:</span>
              <span className="text-accent font-bold">{health.inference_engine_status}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Average Latency:</span>
              <span className="font-bold text-accent">{health.avg_inference_latency}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">p95 Latency:</span>
              <span className="font-bold text-accent">{health.p95_latency}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Total Predictions:</span>
              <span>{health.total_predictions}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Failed Predictions:</span>
              <span className="text-accent font-bold">{health.failed_predictions}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-text-secondary">Cache Status:</span>
              <span className="text-accent font-bold">{health.cache_status}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6 & 7: FEATURE IMPORTANCE & EXPLAINABILITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-accent" />
              <CardTitle>6. Global Feature Importance (Top 10)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <BarChart
              data={importance.top_features || []}
              xKey="feature"
              series={[{ key: "importance", name: "SHAP Relative Weight", color: "var(--accent)" }]}
              height={260}
            />
            <p className="text-[10px] text-text-secondary text-center mt-2 font-mono">
              Global ranking of contribution weights derived from tree-based decision splits.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
              <CardTitle>7. Explainability Engine & Indicators</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                <span className="font-bold text-[10px] text-red-500 uppercase block mb-1">Highest Risk Indicators</span>
                <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                  {explain.highest_risk_indicators.map((i: string, idx: number) => (
                    <li key={idx} className="truncate">{i}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                <span className="font-bold text-[10px] text-green-500 uppercase block mb-1">Low Risk Indicators</span>
                <ul className="list-disc list-inside text-text-secondary space-y-0.5">
                  {explain.low_risk_indicators.map((i: string, idx: number) => (
                    <li key={idx} className="truncate">{i}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-card p-3 rounded border border-border font-mono text-[11px]">
              <span className="font-sans font-bold text-[10px] text-text-secondary uppercase">Example Prediction Explanation</span>
              <p className="text-text-primary font-semibold">{explain.example_prediction}</p>
              <span className="text-text-secondary text-[10px]">{explain.feature_contributions}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px] bg-card/40 p-3 rounded border border-border">
              <div>
                <span className="font-sans text-text-secondary text-[10px] block">Methodology</span>
                <span className="font-bold">{explain.explainability_method}</span>
              </div>
              <div>
                <span className="font-sans text-text-secondary text-[10px] block">Local / Global Support</span>
                <span className="font-bold text-accent">Active / Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 8 & 9: DATASET & TRAINING INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              <CardTitle>8. Dataset Characteristics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Dataset Name:</span>
              <span className="font-bold">{dataset.dataset_name}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Dataset Version:</span>
              <span>{dataset.dataset_version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Total Samples:</span>
              <span className="font-bold">{dataset.number_of_samples}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Fraud / Legitimate Samples:</span>
              <span className="text-amber-500 font-bold">{dataset.fraud_samples} / {dataset.legitimate_samples}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Fraud Imbalance Ratio:</span>
              <span className="font-bold text-red-500">{dataset.fraud_percentage}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Missing Value Ratio:</span>
              <span className="truncate max-w-[200px]" title={dataset.missing_value_percentage}>{dataset.missing_value_percentage}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Duplicate Records Removed:</span>
              <span>{dataset.duplicate_records}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Engineered Features Count:</span>
              <span className="font-bold">{dataset.number_of_engineered_features}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Categorical Features:</span>
              <span>{dataset.categorical_features}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-text-secondary">Numerical Features:</span>
              <span>{dataset.numerical_features}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <CardTitle>9. Training & Optimization Methodology</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Winning Algorithm:</span>
              <span className="font-bold text-accent">{training.winning_algorithm}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Compared Models:</span>
              <span className="truncate max-w-[220px]" title={training.compared_models}>{training.compared_models}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Search Strategy:</span>
              <span>{training.hyperparameter_search_method}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Training / Validation Time:</span>
              <span className="text-accent font-bold">{training.training_time} / {training.validation_time}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Threshold Optimization:</span>
              <span className="truncate max-w-[200px]" title={training.threshold_optimization_method}>{training.threshold_optimization_method}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Class Imbalance Strategy:</span>
              <span>{training.class_imbalance_strategy}</span>
            </div>
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <span className="font-sans text-[10px] text-text-secondary uppercase font-bold">Winning Best Parameters</span>
              <div className="grid grid-cols-3 gap-2 bg-card p-2 rounded text-center border border-border">
                {Object.entries(training.winning_parameters || {}).map(([k, v]) => (
                  <div key={k} className="p-1">
                    <span className="text-[9px] font-sans text-text-secondary block truncate">{k}</span>
                    <span className="font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <span className="font-sans text-[10px] text-text-secondary uppercase font-bold">Feature Processing Pipeline Summary</span>
              <p className="font-sans text-[11px] text-text-secondary leading-normal">{training.feature_engineering_pipeline_summary}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 10: MODEL ARTIFACTS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-amber-500" />
            <CardTitle>10. Serialized Production Artifacts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-border text-text-secondary font-sans text-[10px] uppercase">
                  <th className="py-2 px-3">Artifact Filename</th>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">File Size</th>
                  <th className="py-2 px-3">MD5 Checksum Prefix</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {artifacts.map((a: any, idx: number) => (
                  <tr key={idx} className="hover:bg-card/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-text-primary flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-accent" />
                      {a.name}
                    </td>
                    <td className="py-2.5 px-3">{a.version}</td>
                    <td className="py-2.5 px-3">{a.size}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{a.checksum}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={a.status === "Active" ? "success" : "danger"}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 11 & 12: VISUALIZATIONS & SYSTEM INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent" />
              <CardTitle>11. Available Visualizations & Diagnostic Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              {Object.entries(data.visualizations || {}).map(([k]) => (
                <div key={k} className="flex items-center justify-between p-2.5 bg-card rounded border border-border">

                  <span className="font-sans font-semibold capitalize truncate max-w-[150px]">
                    {k.replace("_path", "").replace(/_/g, " ")}
                  </span>
                  <Badge variant="success">Generated</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between p-2.5 bg-card rounded border border-border">
                <span className="font-sans font-semibold">SHAP Summary</span>
                <Badge variant="success">Generated</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-card rounded border border-border">
                <span className="font-sans font-semibold">Class Distribution</span>
                <Badge variant="success">Generated</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-card rounded border border-border">
                <span className="font-sans font-semibold">Data Quality Summary</span>
                <Badge variant="success">Generated</Badge>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary text-center mt-3">
              Diagnostic PNG plots and markdown reports are stored in <code className="text-accent">ml/reports/</code>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-text-secondary" />
              <CardTitle>12. Runtime System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-2.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Backend API Version:</span>
              <span className="font-bold text-accent">{system.backend_version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">ML Inference Package:</span>
              <span className="font-bold">{system.ml_package_version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Python Engine:</span>
              <span>Python {system.python_version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Web Framework:</span>
              <span>{system.framework}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Inference Server:</span>
              <span>{system.inference_engine}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1.5">
              <span className="font-sans text-text-secondary">Active Environment:</span>
              <span className="uppercase font-bold">{system.active_environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-text-secondary">Container Status:</span>
              <Badge variant="success">{system.container_status}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

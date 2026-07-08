import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Key, ShieldCheck, ArrowRight, Terminal } from "lucide-react";

export const EmptyDashboardState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Header section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-accent/10 text-accent mb-4 ring-1 ring-accent/20 shadow-lg shadow-accent/5">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          No Data Collection Active
        </h2>
        <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
          Your organization workspace is clean and isolated. To initialize real-time fraud monitoring and analytics, generate your first data collection using one of the methods below.
        </p>
      </div>

      {/* Onboarding Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: CSV Upload */}
        <div className="relative group bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-accent/40 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
                <Upload className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-border/40 text-text-secondary">
                Batch Analysis
              </span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
              Upload CSV Collection
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
              Upload historical transaction datasets in CSV format. Our automated ML pipeline will parse, score, and categorize transactions in seconds.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-text-secondary/80">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Supports up to 50,000 rows per batch
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Automatic schema mapping and data validation
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Generates instant analytics and fraud insights
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate("/dashboard/uploads")}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/10 cursor-pointer"
          >
            <span>Go to CSV Center</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Card 2: API Integration */}
        <div className="relative group bg-card border border-border rounded-2xl p-6 transition-all duration-200 hover:border-blue-500/40 hover:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
                <Key className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-border/40 text-text-secondary">
                Real-Time Scoring
              </span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-blue-400 transition-colors">
              Connect Prediction API
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
              Integrate FLAGGED! directly into your payment gateway or checkout flow using REST API endpoints and secure API Keys.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-text-secondary/80">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Sub-15ms inference latency
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Role-based API Key management
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Continuous streaming analytics sessions
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate("/dashboard/api-keys")}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border font-medium text-sm text-text-primary hover:border-blue-500/50 hover:bg-card transition-all cursor-pointer"
          >
            <Terminal className="h-4 w-4 text-blue-400" />
            <span>Manage API Keys & Docs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

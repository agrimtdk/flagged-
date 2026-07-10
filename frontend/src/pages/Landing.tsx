import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Activity, Key, FileSpreadsheet } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export const Landing: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col">
      {/* Hero Section */}
      <section className="py-20 bg-card border-b border-border text-center px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight leading-tight font-solway">
            AI-Powered Fraud Detection Platform for Businesses
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
            Integrate enterprise-grade transaction scoring into your billing stack in minutes. 
            Identify high-risk cards, prevent chargeback penalties, and audit retroactively with ease.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link to="/pricing">
              <Button size="lg" className="font-bold">Get Started</Button>
            </Link>
            <Link to="/docs">
              <Button variant="outline" size="lg">Read Docs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-solway">Engineered for Technical Integrity</h2>
          <p className="text-text-secondary mt-2">Everything you need to safeguard organization transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded flex items-center justify-center text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Advanced AI Scoring Engine</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Uses customized machine learning ensembles optimized for class imbalance to yield precision scores &gt; 95%.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded flex items-center justify-center text-accent">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Developer-First APIs</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Generate secure API keys to fetch low-latency predictions under 50ms inside billing endpoints.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded flex items-center justify-center text-accent">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">CSV Bulk Uploads</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Upload historical billing logs in CSV formats and retrieve immediate scoring reports for audit lines.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex flex-col gap-4">
              <div className="h-10 w-10 bg-accent/10 border border-accent/20 rounded flex items-center justify-center text-accent">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Real-time Analytics</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Unified operations dashboard featuring aggregate counts, false positive trackers, and timeline timelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

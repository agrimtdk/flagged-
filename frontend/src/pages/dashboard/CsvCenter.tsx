import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle2, XCircle, Download, RefreshCw, AlertCircle, HelpCircle, FileSpreadsheet, ShieldAlert, Trash2, Eye, Database, Calendar, Clock } from "lucide-react";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { CSVProgressBar } from "../../components/csv/CSVProgressBar";
import { CSVValidationErrors } from "../../components/csv/CSVValidationErrors";
import { predictionService, CSVUploadResponse } from "../../services/predict";
import { collectionService } from "../../services/dataset";
import { useToast } from "../../contexts/ToastContext";
import { useDataset } from "../../contexts/DatasetContext";

export const CsvCenter: React.FC = () => {
  const navigate = useNavigate();
  const { collections, refreshCollections, selectCollection, selectedCollectionId } = useDataset();
  const csvCollections = collections.filter((c) => c.source === "CSV");
  const csvCount = csvCollections.length;
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "failure">("idle");
  const [progress, setProgress] = useState(0);
  const [response, setResponse] = useState<CSVUploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setResponse(null);
    setErrorMessage("");
  };

  const confirmDeleteClick = (id: string, name: string) => {
    setCollectionToDelete({ id, name });
  };

  const executeDeleteCollection = async () => {
    if (!collectionToDelete) return;
    setIsDeleting(true);
    try {
      await collectionService.deleteCollection(collectionToDelete.id);
      if (selectedCollectionId === collectionToDelete.id) {
        selectCollection(null);
      }
      await refreshCollections();
      addToast(`Collection "${collectionToDelete.name}" and its transactions deleted. Freed 1 file slot.`, "success");
      setCollectionToDelete(null);
    } catch (err: any) {
      addToast("Failed to delete collection. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        addToast(`File "${droppedFile.name}" selected.`, "info");
      } else {
        setErrorMessage("Invalid format. Please upload a structured .csv file.");
        addToast("Please upload a .csv file only.", "error");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      addToast(`File "${e.target.files[0].name}" selected.`, "info");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    try {
      const res = await predictionService.uploadCSV(file, (progressEvent) => {
        const total = progressEvent.total ?? 0;
        if (total > 0) {
          setProgress(Math.round((progressEvent.loaded * 100) / total));
        }
      });

      setResponse(res);
      setStatus("success");
      await refreshCollections();
      addToast(`Batch scored successfully: ${res.processed_rows} rows processed.`, "success");
    } catch (err: any) {
      setStatus("failure");
      const errorObj = err.response?.data?.error;
      let errDetail = errorObj?.message || err.message || "Failed to process the CSV batch upload.";
      if (errorObj?.details && Array.isArray(errorObj.details) && errorObj.details.length > 0) {
        const detailsStr = errorObj.details.map((d: any) => `${d.field || "field"}: ${d.issue || d.message}`).join(" | ");
        errDetail = `${errDetail} -> ${detailsStr}`;
      }
      setErrorMessage(errDetail);
      addToast("CSV batch upload failed. Check schema formatting.", "error");
    }
  };

  const downloadSampleTemplate = () => {
    const headers = "transaction_external_id,amount,card_brand,billing_country,ip_address,device_type,email_domain,card_country\n";
    const row1 = "tx_1001,124.50,VISA,USA,192.168.1.100,mobile,gmail.com,USA\n";
    const row2 = "tx_1002,8999.00,MASTERCARD,GBR,45.33.22.11,desktop,yahoo.com,GBR\n";
    const row3 = "tx_1003,12.99,AMEX,DEU,82.102.21.5,tablet,company.org,DEU\n";
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "flagged_sample_schema.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Sample CSV schema template downloaded.", "info");
  };

  const downloadCSVReport = () => {
    if (!response || response.validation_errors.length === 0) return;

    const csvRows = [
      "Row,Field,Error",
      ...response.validation_errors.map(
        (e) => `${e.row_number},${e.field},"${e.error.replace(/"/g, '""')}"`
      ),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `validation_report_${response.batch_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SectionHeader
        title="CSV Batch Scoring Center"
        subtitle="Upload bulk transaction datasets for high-throughput asynchronous fraud detection and auditing."
        action={
          <Button onClick={downloadSampleTemplate} variant="outline" className="flex items-center gap-2 border border-border bg-card hover:bg-border/30">
            <Download className="h-4 w-4 text-accent" /> Download Sample Template (.csv)
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Upload / Results Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  <span>Interactive Batch Ingestion Hub</span>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${
                    csvCount >= 10
                      ? "bg-red-500/15 text-red-500 border-red-500/30"
                      : "bg-accent/15 text-accent border-accent/30"
                  }`}>
                    {csvCount} / 10 Files Uploaded
                  </span>
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-border/40 text-text-secondary">
                    Max: 100,000 Rows | 10 MB | 10 Files / User
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {status === "idle" && (
                <div className="space-y-6">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-accent bg-accent/10 scale-[1.01]"
                        : "border-border hover:border-accent/50 bg-background/30 hover:bg-background/60"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                      className="hidden"
                    />
                    <div className="p-4 rounded-full bg-card border border-border shadow-md mb-4">
                      <Upload className="h-8 w-8 text-accent" />
                    </div>
                    <p className="font-bold text-base text-text-primary">Drag & drop your CSV transaction batch</p>
                    <p className="text-text-secondary text-xs mt-1">or click anywhere inside this box to browse files</p>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg flex items-center gap-3 text-xs font-semibold">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {file && (
                    <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg shadow-inner">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-accent" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-text-primary truncate max-w-sm">{file.name}</p>
                          <p className="text-text-secondary text-[11px]">
                            {(file.size / 1024).toFixed(1)} KB • Ready for scoring
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setFile(null)} variant="outline" className="text-xs py-1.5 px-3">
                          Remove
                        </Button>
                        <Button onClick={handleUpload} variant="primary" className="text-xs py-1.5 px-4 font-bold bg-accent text-accent-foreground hover:bg-accent/90">
                          Execute Batch Scoring
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {status === "uploading" && (
                <div className="py-16 px-4 flex flex-col items-center justify-center gap-6 text-center">
                  <div className="w-full max-w-md">
                    <CSVProgressBar progress={progress} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-text-primary">Evaluating Transactions via v1.0.0 Fraud Detection Pipeline...</h4>
                    <p className="text-xs text-text-secondary">Computing risk scores, assigning categories, and archiving to audited storage.</p>
                  </div>
                </div>
              )}

              {status === "success" && response && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-accent shrink-0" />
                      <div>
                        <h4 className="font-bold text-base text-text-primary">Batch Scoring Completed Successfully</h4>
                        <p className="text-text-secondary text-xs mt-0.5">Batch ID: <span className="font-mono text-text-primary">{response.batch_id}</span></p>
                      </div>
                    </div>
                    <Button onClick={resetState} variant="outline" className="flex items-center gap-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Score New File
                    </Button>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-background p-4 rounded-lg border border-border">
                    <div className="p-3 rounded bg-card/60 border border-border/60 text-center">
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Total Rows</p>
                      <p className="text-xl font-extrabold text-text-primary mt-1">{response.total_rows}</p>
                    </div>
                    <div className="p-3 rounded bg-card/60 border border-border/60 text-center">
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Processed</p>
                      <p className="text-xl font-extrabold text-accent mt-1">{response.processed_rows}</p>
                    </div>
                    <div className="p-3 rounded bg-card/60 border border-border/60 text-center">
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Failed Rows</p>
                      <p className={`text-xl font-extrabold mt-1 ${response.failed_rows > 0 ? "text-red-500" : "text-text-secondary"}`}>
                        {response.failed_rows}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-card/60 border border-border/60 text-center">
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Fraud Flagged</p>
                      <p className="text-xl font-extrabold text-amber-500 mt-1">{response.fraud_detected}</p>
                    </div>
                  </div>

                  {response.failed_rows > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4" /> Row-Level Validation Discrepancies
                        </h5>
                        <Button onClick={downloadCSVReport} variant="outline" className="text-xs py-1 px-3 border border-border flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5" /> Export Report (.csv)
                        </Button>
                      </div>
                      <CSVValidationErrors errors={response.validation_errors} />
                    </div>
                  )}
                </div>
              )}

              {status === "failure" && (
                <div className="py-8 space-y-6 text-center animate-in fade-in duration-200">
                  <div className="flex flex-col items-center gap-2">
                    <XCircle className="h-12 w-12 text-red-500" />
                    <h4 className="font-bold text-base text-text-primary">Batch Processing Exception</h4>
                    <p className="text-xs text-text-secondary max-w-md">
                      We encountered a fatal error while parsing or validating your CSV file. Please verify schema column formatting.
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono break-all text-left max-w-lg mx-auto">
                    {errorMessage}
                  </div>
                  <Button onClick={resetState} variant="primary" className="text-xs px-6">
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Schema Specification Table */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border bg-background/40">
              <CardTitle className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4 text-accent" />
                <span>Required Schema Dictionary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Your uploaded CSV must include headers matching our data dictionary. All timestamps must follow ISO-8601 formatting.
              </p>

              {/* User Quota & Limits Card */}
              <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/30 text-xs space-y-2">
                <div className="font-bold text-accent uppercase tracking-wider text-[11px]">User Upload Quotas</div>
                <ul className="space-y-1 text-text-primary font-mono text-[11px]">
                  <li>• Maximum files: <strong>10 files per user</strong></li>
                  <li>• Maximum file size: <strong>10 MB</strong></li>
                  <li>• Accepted format: <strong>CSV (.csv)</strong></li>
                  <li>• Maximum rows: <strong>100,000 rows</strong></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded bg-background border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-text-primary mb-1">
                    <span>amount</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/15 text-accent">Required • Decimal</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">Transaction value in local currency (e.g., 149.99).</p>
                </div>

                <div className="p-3 rounded bg-background border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-text-primary mb-1">
                    <span>timestamp</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/15 text-accent">Required • ISO-8601</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">UTC timestamp (e.g., 2026-07-06T14:30:00Z).</p>
                </div>

                <div className="p-3 rounded bg-background border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-text-primary mb-1">
                    <span>device_id</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/15 text-accent">Required • String</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">Unique fingerprint or identifier of customer device.</p>
                </div>

                <div className="p-3 rounded bg-background border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-text-primary mb-1">
                    <span>ip_address</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-border/60 text-text-secondary">Optional • IPv4/v6</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">Originating IP address for geolocation scoring.</p>
                </div>

                <div className="p-3 rounded bg-background border border-border/80 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-text-primary mb-1">
                    <span>country, brand, currency</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-border/60 text-text-secondary">Optional • Strings</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">Card network (Visa/Mastercard) and 2-letter ISO country code.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Uploaded CSV Batches & Audit History */}
      <Card className="border border-border/80 bg-card/95 shadow-xl backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-border bg-gradient-to-r from-background/80 via-background/40 to-background/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">Uploaded CSV Batches & Audit History</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage your active batch datasets ({csvCollections.length} / 10 slots used)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {csvCollections.length === 0 ? (
            <div className="p-16 text-center text-text-secondary flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-border/20 border border-border/50 text-text-secondary">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <p className="font-semibold text-sm text-text-primary">No CSV batches uploaded yet</p>
              <p className="text-xs max-w-sm">Upload a structured transaction .csv file above to inspect high-throughput fraud audit reports.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-text-secondary uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">S.No.</th>
                    <th className="py-3.5 px-4">File Name</th>
                    <th className="py-3.5 px-4">Date & Time Uploaded</th>
                    <th className="py-3.5 px-4">Total Rows</th>
                    <th className="py-3.5 px-4">Fraud Flagged</th>
                    <th className="py-3.5 px-4">Avg Risk</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {csvCollections.map((c, index) => {
                    const uploadDate = new Date(c.created_at);
                    const dateStr = uploadDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    });
                    const timeStr = uploadDate.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={c.id} className="group hover:bg-accent/[0.04] transition-all duration-150">
                        {/* Serial Number */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-md bg-background border border-border font-mono font-bold text-accent text-[11px] group-hover:border-accent/40 transition-colors">
                            #{index + 1}
                          </span>
                        </td>

                        {/* File Name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded bg-accent/10 text-accent">
                              <FileSpreadsheet className="h-4 w-4 shrink-0" />
                            </div>
                            <div>
                              <p className="font-bold text-text-primary group-hover:text-accent transition-colors">
                                {c.original_filename || c.name}
                              </p>
                              <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                                ID: {c.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Aesthetic Formatted Date & Time */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-semibold text-text-primary text-xs">
                              <Calendar className="h-3.5 w-3.5 text-accent/80 shrink-0" />
                              <span>{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-mono">
                              <Clock className="h-3 w-3 text-text-secondary/70 shrink-0" />
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </td>

                        {/* Total Rows */}
                        <td className="py-4 px-4 font-mono font-bold text-text-primary">
                          {c.total_rows.toLocaleString()}
                          <span className="text-[10px] font-normal text-text-secondary ml-1">rows</span>
                        </td>

                        {/* Fraud Flagged */}
                        <td className="py-4 px-4 font-mono">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                            c.fraud_count > 0
                              ? "bg-red-500/15 text-red-500 border border-red-500/30"
                              : "bg-background border border-border text-text-secondary"
                          }`}>
                            {c.fraud_count.toLocaleString()}
                          </span>
                        </td>

                        {/* Avg Risk */}
                        <td className="py-4 px-4 font-mono font-semibold text-text-primary">
                          {(c.avg_risk_score * 100).toFixed(1)}%
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider border ${
                            c.status === "Completed"
                              ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                              : c.status === "Processing"
                              ? "bg-yellow-500/15 text-yellow-500 border-yellow-500/30 animate-pulse"
                              : "bg-red-500/15 text-red-500 border-red-500/30"
                          }`}>
                            {c.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => {
                                selectCollection(c.id);
                                navigate("/dashboard/transactions");
                              }}
                              variant="outline"
                              className="text-xs py-1.5 px-3 flex items-center gap-1.5 border-accent/40 text-accent hover:bg-accent/15 transition-colors font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" /> Analyze
                            </Button>
                            <Button
                              onClick={() => confirmDeleteClick(c.id, c.original_filename || c.name)}
                              variant="outline"
                              className="text-xs py-1.5 px-2.5 text-red-500 border-red-500/30 hover:bg-red-500/15 transition-colors"
                              title="Delete uploaded CSV file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleek Professional Website Confirmation Modal */}
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-background/60 flex items-center gap-3.5">
              <div className="p-3 rounded-full bg-red-500/15 border border-red-500/30 text-red-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Delete CSV Batch & Transactions</h3>
                <p className="text-xs text-text-secondary mt-0.5">Permanent Deletion Confirmation</p>
              </div>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-text-primary text-sm leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-accent font-mono">{collectionToDelete.name}</strong>?
              </p>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 space-y-2">
                <p className="font-bold text-red-300">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-red-300/90 leading-relaxed">
                  <li>All transactions scored under this batch will be removed.</li>
                  <li>Organization fraud metrics and risk scores will recalculate.</li>
                  <li><strong>1 file slot</strong> will be freed in your 10-file quota.</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 bg-background/60 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setCollectionToDelete(null)}
                className="text-xs px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteCollection}
                className="text-xs px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

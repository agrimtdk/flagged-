import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { CSVProgressBar } from "./CSVProgressBar";
import { CSVValidationErrors } from "./CSVValidationErrors";
import { predictionService, CSVUploadResponse } from "../../services/predict";
import { Upload, CheckCircle2, XCircle, FileText, Download, RefreshCw } from "lucide-react";
import { useDataset } from "../../contexts/DatasetContext";

export interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (response: CSVUploadResponse) => void;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { refreshCollections } = useDataset();
  const [file, setFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "uploading" | "success" | "failure">("idle");
  const [progress, setProgress] = React.useState(0);
  const [response, setResponse] = React.useState<CSVUploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setResponse(null);
    setErrorMessage("");
  };

  React.useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

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
      } else {
        setErrorMessage("Please upload a CSV file only.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    try {
      const res = await predictionService.uploadCSV(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      
      setResponse(res);
      setStatus("success");
      // await refreshCollections();
      if (onUploadSuccess) {
        onUploadSuccess(res);
      }
    } catch (err: any) {
      setStatus("failure");
      const errDetail = err.response?.data?.error?.message || err.message || "Failed to process the CSV upload.";
      setErrorMessage(errDetail);
    }
  };

  const downloadCSVReport = () => {
    if (!response || response.validation_errors.length === 0) return;

    const csvRows = [
      "Row,Field,Error",
      ...response.validation_errors.map(
        (e) => `${e.row_number},${e.field},"${e.error.replace(/"/g, '""')}"`
      ),
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `validation_report_${response.batch_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch CSV Transaction Scoring" size="lg">
      <div className="flex flex-col gap-6 text-xs text-text-primary">
        {status === "idle" && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary leading-normal">
              Upload a bulk CSV file containing transaction records to score them in a single batch. 
              The system supports up to <strong>50,000 rows</strong> and <strong>10MB</strong>. 
              Invalid rows will produce row-level validation reports, allowing valid records to proceed.
            </p>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40 bg-card/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <Upload className="h-10 w-10 text-text-secondary mb-3" />
              <p className="font-bold text-sm">Drag and drop your transaction CSV here</p>
              <p className="text-text-secondary mt-1">or click to browse local files</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded font-semibold">
                {errorMessage}
              </div>
            )}

            {file && (
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  <div className="min-w-0">
                    <p className="font-bold truncate max-w-md">{file.name}</p>
                    <p className="text-text-secondary text-[10px]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button onClick={handleUpload} variant="primary">
                  Process Dataset
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CSVProgressBar progress={progress} />
            <p className="text-text-secondary">Scoring dataset and inserting transaction records...</p>
          </div>
        )}

        {status === "success" && response && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <CheckCircle2 className="h-10 w-10 text-accent flex-shrink-0" />
              <div>
                <h5 className="font-bold text-sm">Dataset Processed Successfully</h5>
                <p className="text-text-secondary text-[10px] mt-0.5">
                  Batch ID: {response.batch_id}
                </p>
              </div>
            </div>

            {/* Results metrics */}
            <div className="grid grid-cols-4 gap-4 bg-card p-4 rounded border border-border text-center">
              <div>
                <p className="text-text-secondary uppercase text-[10px] font-semibold tracking-wider">Total Rows</p>
                <p className="text-lg font-extrabold mt-1">{response.total_rows}</p>
              </div>
              <div>
                <p className="text-text-secondary uppercase text-[10px] font-semibold tracking-wider">Processed</p>
                <p className="text-lg font-extrabold text-accent mt-1">
                  {response.processed_rows}
                </p>
              </div>
              <div>
                <p className="text-text-secondary uppercase text-[10px] font-semibold tracking-wider">Failed Rows</p>
                <p className="text-lg font-extrabold text-red-600 dark:text-red-400 mt-1">
                  {response.failed_rows}
                </p>
              </div>
              <div>
                <p className="text-text-secondary uppercase text-[10px] font-semibold tracking-wider">Fraud Scored</p>
                <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {response.fraud_detected}
                </p>
              </div>
            </div>

            {/* Validation errors lists */}
            {response.failed_rows > 0 && (
              <div className="flex flex-col gap-3">
                <CSVValidationErrors errors={response.validation_errors} />
                <Button
                  onClick={downloadCSVReport}
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-xs border border-border"
                >
                  <Download className="h-4 w-4" /> Download Validation Report (CSV)
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={resetState} variant="outline" className="flex items-center gap-1 border border-border">
                <RefreshCw className="h-3 w-3" /> Upload Another
              </Button>
              <Button onClick={onClose} variant="primary">
                Close Report
              </Button>
            </div>
          </div>
        )}

        {status === "failure" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-10 w-10 text-red-500" />
              <div>
                <h5 className="font-bold text-sm">Failed to Process Dataset</h5>
                <p className="text-text-secondary">The system was unable to score your file.</p>
              </div>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded font-semibold break-all leading-normal">
              {errorMessage}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={resetState} variant="outline" className="border border-border">
                Retry Upload
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

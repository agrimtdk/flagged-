import React from "react";

export interface CSVProgressBarProps {
  progress: number;
  statusText?: string;
}

export const CSVProgressBar: React.FC<CSVProgressBarProps> = ({
  progress,
  statusText = "Uploading batch dataset...",
}) => {
  return (
    <div className="flex flex-col gap-2 w-full text-xs">
      <div className="flex justify-between font-semibold text-text-secondary">
        <span>{statusText}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
        <div
          className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

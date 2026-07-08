import React from "react";
import { Badge } from "../ui/Badge";

export interface RiskIndicatorProps {
  score: number;
  isFraud: boolean;
  showScore?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  isFraud,
  showScore = true,
}) => {
  // Determine variant and label based on fraud decision and raw score bounds
  let variant: "success" | "warning" | "danger" = "success";
  let label = "Low Risk";

  if (isFraud) {
    variant = "danger";
    label = "High Risk";
  } else if (score >= 0.2) {
    variant = "warning";
    label = "Medium Risk";
  }

  const scorePct = Math.round(score * 100);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>{label}</Badge>
      {showScore && (
        <span className="text-xs font-semibold text-text-secondary">
          {scorePct}% Risk
        </span>
      )}
    </div>
  );
};

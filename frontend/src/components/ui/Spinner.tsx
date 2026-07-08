import React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = "", size = "md", label, ...props }) => {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-solid border-border border-t-accent ${sizes[size]} ${className}`}
        role="status"
        {...props}
      >
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
      {label && <span className="text-xs font-semibold text-text-secondary animate-pulse">{label}</span>}
    </div>
  );
};

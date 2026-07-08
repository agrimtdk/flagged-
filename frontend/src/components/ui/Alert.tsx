import React from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger";
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className = "",
  variant = "default",
  title,
  children,
  onClose,
  ...props
}) => {
  const variants = {
    default: "bg-card border-border text-text-primary",
    success: "bg-accent/15 border-accent/30 text-accent font-medium",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300",
    danger: "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300",
  };

  const icons = {
    default: <Info className="h-5 w-5 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 shrink-0" />,
    danger: <XCircle className="h-5 w-5 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`flex gap-3 p-4 rounded border text-sm transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1 flex flex-col gap-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 self-start p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close alert"
        >
          <svg className="h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

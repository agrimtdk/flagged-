import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge: React.FC<BadgeProps> = ({ className = "", variant = "default", children, ...props }) => {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border transition-colors";
  
  const variants = {
    default: "bg-card border-border text-text-primary",
    success: "bg-green-500/10 border-green-500/30 text-green-500 font-bold",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

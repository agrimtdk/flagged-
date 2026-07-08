import React, { forwardRef } from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const checkboxId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`h-4 w-4 rounded border-border text-accent bg-background focus:ring-accent/50 focus:outline-none transition-colors cursor-pointer ${className}`}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className="text-sm font-medium text-text-primary select-none cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && <span className="text-xs text-red-500 pl-6">{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

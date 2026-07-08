import React, { forwardRef } from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  checked: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", label, checked, onChange, id, ...props }, ref) => {
    const switchId = id || React.useId();
    
    return (
      <div className="flex items-center gap-3">
        <div className="relative inline-flex items-center cursor-pointer">
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-2 peer-focus:ring-accent/50 dark:bg-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
        </div>
        {label && (
          <label htmlFor={switchId} className="text-sm font-medium text-text-primary select-none cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

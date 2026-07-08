import React, { forwardRef } from "react";
import { Search } from "lucide-react";

export interface SearchBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onSearch?: (value: string) => void;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ className = "", placeholder = "Search...", onChange, ...props }, ref) => {
    return (
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full pl-9 pr-3 py-2 rounded border bg-background text-text-primary border-border focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
          {...props}
        />
      </div>
    );
  }
);

SearchBox.displayName = "SearchBox";

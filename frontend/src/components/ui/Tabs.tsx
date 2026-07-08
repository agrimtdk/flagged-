import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = "" }) => {
  return (
    <div className={`border-b border-border ${className}`}>
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon && (
                <span className={`shrink-0 ${isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"}`}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

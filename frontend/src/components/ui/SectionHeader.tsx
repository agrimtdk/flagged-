import React from "react";

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, subtitle, action }) => {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border pb-5 mb-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold tracking-tight text-text-primary">{title}</h2>
        {(description || subtitle) && (
          <p className="text-xs text-text-secondary leading-normal">{description || subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
};

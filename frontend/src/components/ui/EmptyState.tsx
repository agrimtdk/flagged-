import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <FolderOpen className="h-12 w-12 text-text-secondary" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded border border-dashed border-border bg-card/30">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card mb-4 border border-border shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

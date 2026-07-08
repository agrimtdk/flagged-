import React from "react";
import { Card } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, trend }) => {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-secondary">{title}</span>
        {icon && <span className="text-text-secondary">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-text-primary">{value}</span>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trend.isPositive ? "text-accent" : "text-red-500"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {description && <p className="text-xs text-text-secondary leading-normal">{description}</p>}
    </Card>
  );
};

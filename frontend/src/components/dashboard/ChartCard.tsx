import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  hasData?: boolean;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  isLoading = false,
  hasData = true,
  children,
  headerActions,
  emptyTitle = "No data available",
  emptyDescription = "There is no recorded data matching this criteria.",
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-center min-h-[250px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-12">
            <Spinner className="h-8 w-8 text-accent" />
          </div>
        ) : !hasData ? (
          <div className="py-6">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

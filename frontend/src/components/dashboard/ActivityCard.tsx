import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { AlertCircle, ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { TransactionItem } from "../../services/predict";

export interface ActivityItem {
  id: string;
  type: "api_prediction" | "csv_upload" | "system";
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "danger" | "info";
}

export interface ActivityCardProps {
  transactions: TransactionItem[];
  activities?: ActivityItem[];
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  transactions,
  activities = [],
}) => {
  // Convert transactions to activity items dynamically if custom list is empty
  const items: ActivityItem[] = React.useMemo(() => {
    if (activities.length > 0) return activities;

    return transactions.slice(0, 5).map((tx) => {
      const isFraud = tx.is_fraud;
      const amountStr = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(tx.amount);

      return {
        id: tx.id,
        type: tx.source === "CSV" ? "csv_upload" : "api_prediction",
        title: tx.source === "CSV" ? "CSV Batch Transaction Scored" : "API Prediction Executed",
        description: isFraud
          ? `High-risk transaction detected: ${tx.transaction_external_id} (${amountStr}).`
          : `Safe transaction processed: ${tx.transaction_external_id} (${amountStr}).`,
        timestamp: new Date(tx.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: isFraud ? "danger" : "success",
      };
    });
  }, [transactions, activities]);

  const getIcon = (status: string) => {
    switch (status) {
      case "danger":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-secondary">
            No recent activity recorded.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start text-xs border-b border-border pb-3 last:border-b-0 last:pb-0">
                <div className="mt-0.5 rounded-full p-1 bg-card border border-border">
                  {getIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary truncate">{item.title}</p>
                  <p className="text-text-secondary leading-normal mt-0.5">{item.description}</p>
                </div>
                <div className="text-text-secondary whitespace-nowrap pl-2">
                  {item.timestamp}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

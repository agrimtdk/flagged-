import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { RiskIndicator } from "./RiskIndicator";
import { Badge } from "../ui/Badge";
import { TransactionItem } from "../../services/predict";

export interface RecentTransactionsProps {
  transactions: TransactionItem[];
  onViewDetails?: (tx: TransactionItem) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewDetails,
}) => {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amt);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>External ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Card Brand</TableHead>
          <TableHead>Billing Country</TableHead>
          <TableHead>Card Country</TableHead>
          <TableHead>Risk Profile</TableHead>
          {onViewDetails && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="font-mono text-xs">{tx.transaction_external_id}</TableCell>
            <TableCell className="text-xs text-text-secondary">{formatDate(tx.created_at)}</TableCell>
            <TableCell>
              <Badge variant={tx.source === "API" ? "info" : "default"}>{tx.source}</Badge>
            </TableCell>
            <TableCell className="font-bold text-xs">{formatCurrency(tx.amount)}</TableCell>
            <TableCell className="text-xs">{tx.card_brand}</TableCell>
            <TableCell className="text-xs font-mono uppercase">{tx.billing_country}</TableCell>
            <TableCell className="text-xs">
              <span
                className={`font-mono uppercase px-1.5 py-0.5 rounded ${
                  tx.card_country && tx.card_country !== tx.billing_country
                    ? "bg-red-500/15 text-red-500 font-bold border border-red-500/30"
                    : "text-text-primary"
                }`}
                title={
                  tx.card_country && tx.card_country !== tx.billing_country
                    ? "Mismatch: Card country differs from billing country!"
                    : "Card Issuing Country"
                }
              >
                {tx.card_country || "N/A"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <RiskIndicator score={tx.risk_score} isFraud={tx.is_fraud} showScore={true} />
                {tx.confidence_level && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      tx.confidence_level === "High"
                        ? "bg-green-500/10 text-green-500"
                        : tx.confidence_level === "Medium"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                    title={`Model Confidence: ${tx.confidence_level} (${Math.round((tx.confidence_score || 0) * 100)}%)`}
                  >
                    {tx.confidence_level} Conf
                  </span>
                )}
              </div>
            </TableCell>
            {onViewDetails && (
              <TableCell className="text-right">
                <button
                  onClick={() => onViewDetails(tx)}
                  className="text-xs font-semibold text-accent hover:underline focus:outline-none"
                >
                  Inspect
                </button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

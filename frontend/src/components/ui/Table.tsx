import React from "react";

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className = "", children, ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded border border-border">
      <table className={`w-full text-sm text-left border-collapse bg-background ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = "", children, ...props }) => {
  return (
    <thead className={`bg-card border-b border-border text-xs font-semibold uppercase text-text-secondary ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = "", children, ...props }) => {
  return (
    <tbody className={`divide-y divide-border ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = "", children, ...props }) => {
  return (
    <tr className={`hover:bg-border/10 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = "", children, ...props }) => {
  return (
    <th className={`px-4 py-3 font-semibold text-text-primary ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = "", children, ...props }) => {
  return (
    <td className={`px-4 py-3 text-text-primary whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
};

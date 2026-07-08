import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table";
import { CSVRowError } from "../../services/predict";

export interface CSVValidationErrorsProps {
  errors: CSVRowError[];
}

export const CSVValidationErrors: React.FC<CSVValidationErrorsProps> = ({ errors }) => {
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(errors.length / pageSize);

  const paginatedErrors = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return errors.slice(start, start + pageSize);
  }, [errors, page]);

  if (errors.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 w-full text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="font-bold text-red-600 dark:text-red-400">
          Row-Level Validation Failures ({errors.length})
        </span>
        <span className="text-text-secondary">
          Displaying {Math.min(errors.length, (page - 1) * pageSize + 1)}-
          {Math.min(errors.length, page * pageSize)}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Row</TableHead>
            <TableHead className="w-32">Field</TableHead>
            <TableHead>Validation Error Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedErrors.map((err, idx) => (
            <TableRow key={`${err.row_number}-${err.field}-${idx}`} className="bg-red-50/10 dark:bg-red-950/5">
              <TableCell className="font-bold text-red-600 dark:text-red-400">
                {err.row_number}
              </TableCell>
              <TableCell className="font-mono text-text-primary">
                {err.field}
              </TableCell>
              <TableCell className="text-text-secondary text-wrap whitespace-normal leading-normal">
                {err.error}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 border border-border rounded text-text-primary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 border border-border rounded text-text-primary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

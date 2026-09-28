import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryColor, categoryIcon, categoryTint } from "../lib/categories";
import { formatDay, formatMoney } from "../lib/format";
import { useCurrency } from "./preferences";
import { useDeleteTransaction, type TransactionFilters } from "../queries/transactions";
import type { TransactionRow } from "../types/finance";
import { AddTransactionDialog } from "./add-transaction-dialog";

export function TransactionList({
  rows,
  isLoading,
  filters,
  groupByDay = true,
  emptyLabel = "No transactions yet",
}: {
  rows: TransactionRow[];
  isLoading?: boolean;
  filters?: TransactionFilters;
  groupByDay?: boolean;
  emptyLabel?: string;
}) {
  const deleteTransaction = useDeleteTransaction(filters);
  useCurrency();
  const [editing, setEditing] = useState<TransactionRow | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  const groups = groupByDay
    ? [...rows.reduce((map, row) => {
        const key = formatDay(row.occurredAt);
        map.set(key, [...(map.get(key) ?? []), row]);
        return map;
      }, new Map<string, TransactionRow[]>())]
    : [["", rows] as [string, TransactionRow[]]];

  return (
    <>
    <div className="space-y-5">
      {groups.map(([label, items]) => (
        <div key={label || "all"} className="space-y-2">
          {label && (
            <div className="flex items-baseline justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="num text-xs font-semibold text-muted-foreground">
                {formatMoney(
                  items.reduce(
                    (sum, row) => sum + (row.kind === "expense" ? row.amount : 0),
                    0,
                  ),
                )}
              </p>
            </div>
          )}
          <ul className="space-y-2">
            {items.map((row) => {
              const Icon = categoryIcon(row.categoryIcon);
              const income = row.kind === "income";
              return (
                <li
                  key={row.id}
                  onDoubleClick={() => setEditing(row)}
                  className="group flex items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5 shadow-soft transition hover:shadow-lifted"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl"
                    style={{ backgroundColor: categoryTint(row.categoryColor) }}
                  >
                    <Icon className="size-5" style={{ color: categoryColor(row.categoryColor) }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.merchant || row.categoryName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.categoryName}
                      {row.note ? ` · ${row.note}` : ""}
                      {!label ? ` · ${formatDay(row.occurredAt)}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "num shrink-0 text-sm font-semibold",
                      income ? "text-success" : "text-foreground",
                    )}
                  >
                    {income ? "+" : "−"}
                    {formatMoney(row.amount)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${row.merchant || row.categoryName}`}
                      onClick={() => setEditing(row)}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${row.merchant || row.categoryName}`}
                      onClick={() => deleteTransaction.mutate({ id: row.id })}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
    <AddTransactionDialog
      key={editing?.id ?? "none"}
      open={Boolean(editing)}
      transaction={editing}
      onClose={() => setEditing(null)}
    />
    </>
  );
}

import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthSwitcher } from "../components/shell";
import { AddTransactionDialog } from "../components/add-transaction-dialog";
import { TransactionList } from "../components/transaction-list";
import { useMonth } from "../components/month-context";
import { useCategories } from "../queries/categories";
import { useTransactions, type TransactionFilters } from "../queries/transactions";
import { categoryColor, categoryIcon, categoryTint } from "../lib/categories";
import { formatMoney } from "../lib/format";
import { useCurrency } from "../components/preferences";
import type { CategoryRow, TransactionRow } from "../types/finance";

type Kind = "all" | "expense" | "income";

function Transactions() {
  useCurrency();
  const { month } = useMonth();
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [allTime, setAllTime] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const filters: TransactionFilters = useMemo(
    () => ({
      month: allTime ? undefined : month,
      kind: kind === "all" ? undefined : kind,
      categoryId: categoryId ?? undefined,
      search: search.trim() || undefined,
      limit: 300,
    }),
    [allTime, month, kind, categoryId, search],
  );

  const transactions = useTransactions(filters);
  const rows = (transactions.data ?? []) as TransactionRow[];
  const categoryRows = (categories.data ?? []) as CategoryRow[];

  const spent = rows
    .filter((row) => row.kind === "expense")
    .reduce((sum, row) => sum + row.amount, 0);
  const income = rows
    .filter((row) => row.kind === "income")
    .reduce((sum, row) => sum + row.amount, 0);

  const hasFilters = kind !== "all" || categoryId !== null || search.trim() !== "" || allTime;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="rise rise-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {transactions.isLoading
              ? "Loading…"
              : `${rows.length} records · ${formatMoney(spent)} out · ${formatMoney(income)} in`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!allTime && <MonthSwitcher />}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="hero-gradient hidden items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-soft sm:inline-flex"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="rise rise-2 mt-6 card-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchant, note or category"
              aria-label="Search transactions"
              className="h-11 w-full rounded-full border border-input bg-muted/50 pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:bg-card"
            />
          </div>

          <div className="flex rounded-full bg-muted p-1">
            {(["all", "expense", "income"] as Kind[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold capitalize transition",
                  kind === option
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAllTime((value) => !value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition",
              allTime ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            All time
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setKind("all");
                setCategoryId(null);
                setSearch("");
                setAllTime(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition",
              categoryId === null
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All categories
          </button>
          {categoryRows.map((category) => {
            const Icon = categoryIcon(category.icon);
            const active = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(active ? null : category.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  active ? "text-white" : "text-muted-foreground hover:text-foreground",
                )}
                style={
                  active
                    ? { backgroundColor: categoryColor(category.color) }
                    : { backgroundColor: categoryTint(category.color, 0.1) }
                }
              >
                <Icon className="size-3.5" />
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rise rise-3 mt-5 card-surface p-5 sm:p-6">
        <TransactionList
          rows={rows}
          isLoading={transactions.isLoading}
          filters={filters}
          emptyLabel={hasFilters ? "No matches for these filters" : "No transactions yet"}
        />
      </section>

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

export default Transactions;

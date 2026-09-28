import { useState } from "react";
import { Link } from "wouter";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthSwitcher } from "../components/shell";
import { AddTransactionDialog } from "../components/add-transaction-dialog";
import { TransactionList } from "../components/transaction-list";
import { EmptyPanel } from "../components/empty-panel";
import { CategoryBars, DailyArea, DonutChart, ProgressRing } from "../components/charts";
import { useMonth } from "../components/month-context";
import { useOverview, useSettings } from "../queries/analytics";
import { useCategories } from "../queries/categories";
import { useTransactions } from "../queries/transactions";
import { categoryColor, categoryIcon, categoryTint } from "../lib/categories";
import { formatMoney, formatPercent } from "../lib/format";
import { useCurrency } from "../components/preferences";
import type { CategoryRow, TransactionRow } from "../types/finance";

function Index() {
  useCurrency();
  const { month } = useMonth();
  const overview = useOverview(month);
  const settings = useSettings();
  const filters = { month, limit: 8 };
  const transactions = useTransactions(filters);
  const categories = useCategories();
  const [addOpen, setAddOpen] = useState(false);
  const [quickCategory, setQuickCategory] = useState<number | undefined>(undefined);

  const openAdd = (categoryId?: number) => {
    setQuickCategory(categoryId);
    setAddOpen(true);
  };

  const data = overview.data;
  const rows = (transactions.data ?? []) as TransactionRow[];
  const budget = settings.data?.monthlyBudget ?? 0;
  const budgetShare = budget > 0 ? (data?.spent ?? 0) / budget : 0;
  const remaining = budget - (data?.spent ?? 0);
  const change = data?.changeShare ?? 0;

  const allCategories = (categories.data ?? []) as CategoryRow[];
  const spentCategories = data?.byCategory ?? [];
  const quickRows =
    spentCategories.length > 0
      ? spentCategories.slice(0, 6).map((category) => ({
          id: category.categoryId,
          name: category.name,
          icon: category.icon,
          color: category.color,
        }))
      : allCategories
          .filter((category) => category.kind === "expense")
          .slice(0, 6)
          .map((category) => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
          }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-10 lg:pt-8">
      {/* Hero */}
      <section className="hero-gradient rise rise-1 relative overflow-hidden rounded-[2rem] px-6 pb-8 pt-7 text-white shadow-lifted sm:px-9 sm:pb-10 sm:pt-9">
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full opacity-45 blur-2xl"
          style={{ background: "radial-gradient(circle,#C4B5FD 0%,transparent 70%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full opacity-25 blur-2xl"
          style={{ background: "radial-gradient(circle,#F0ABFC 0%,transparent 70%)" }}
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">
              Hey {settings.data?.ownerName ?? "there"} — here's your month
            </p>
            <h1 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
              {data?.label ?? "Loading…"}
            </h1>
          </div>
          <MonthSwitcher tone="dark" />
        </div>

        <div className="relative mt-8 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
              Total spent
            </p>
            <p className="num mt-2 text-5xl font-semibold leading-none sm:text-6xl">
              {overview.isLoading ? "—" : formatMoney(data?.spent ?? 0)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {data && data.prevSpent > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                    change > 0 ? "bg-white/15 text-white" : "bg-white/20 text-white",
                  )}
                >
                  {change > 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {formatPercent(Math.abs(change), 1)} vs last month
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                {data?.transactionCount ?? 0} transactions
              </span>
            </div>
          </div>

          {budget > 0 && (
            <ProgressRing share={budgetShare} size={136}>
              <span className="num text-xl font-semibold">{formatPercent(budgetShare)}</span>
              <span className="mt-0.5 px-4 text-center text-[10px] font-medium uppercase tracking-wider text-white/70">
                of {formatMoney(budget, { compact: true })} budget
              </span>
            </ProgressRing>
          )}
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat
            label="Income"
            value={formatMoney(data?.income ?? 0)}
            icon={<ArrowDownRight className="size-3.5" />}
          />
          <HeroStat
            label="Net saved"
            value={formatMoney(data?.net ?? 0, { sign: true })}
            icon={<ArrowUpRight className="size-3.5" />}
          />
          <HeroStat label="Daily avg" value={formatMoney(data?.dailyAvg ?? 0)} />
          <HeroStat
            label={remaining >= 0 ? "Left to spend" : "Over budget"}
            value={budget > 0 ? formatMoney(Math.abs(remaining)) : "—"}
          />
        </div>
      </section>

      {/* Quick add */}
      <section className="rise rise-2 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Quick add</h2>
          <button
            type="button"
            onClick={() => openAdd()}
            className="text-xs font-semibold text-primary hover:underline"
          >
            More options
          </button>
        </div>
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => openAdd()}
            className="hero-gradient flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-soft"
          >
            <Plus className="size-4" />
            New
          </button>
          {quickRows.map((category) => {
            const Icon = categoryIcon(category.icon);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => openAdd(category.id)}
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm font-medium shadow-soft transition hover:-translate-y-0.5"
              >
                <span
                  className="grid size-7 place-items-center rounded-xl"
                  style={{
                    backgroundColor: categoryTint(category.color),
                    color: categoryColor(category.color),
                  }}
                >
                  <Icon className="size-4" />
                </span>
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Breakdown + daily shape */}
      <section className="rise rise-3 mt-6 grid gap-5 lg:grid-cols-5">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Where it went</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {spentCategories.length > 0
              ? "Hover a slice for the category total"
              : "Log an expense to see the split"}
          </p>
          {spentCategories.length === 0 ? (
            <EmptyPanel
              className="mt-5 h-[232px]"
              label="No spending this month"
              hint="Use Quick add above to log your first expense."
            />
          ) : (
          <>
            <div className="mt-5 flex justify-center">
              <DonutChart
                total={data?.spent ?? 0}
                slices={spentCategories.map((category) => ({
                  label: category.name,
                  value: category.total,
                  color: categoryColor(category.color),
                }))}
              />
            </div>
            <div className="mt-6 space-y-2">
              {spentCategories.slice(0, 4).map((category) => (
                <div key={category.categoryId} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: categoryColor(category.color) }}
                  />
                  <span className="flex-1 truncate text-muted-foreground">{category.name}</span>
                  <span className="num font-semibold">{formatMoney(category.total)}</span>
                </div>
              ))}
            </div>
          </>
          )}
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="card-surface p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">Day by day</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Projected month end {formatMoney(data?.projected ?? 0)}
                </p>
              </div>
              <span className="num text-sm font-semibold text-primary">
                {formatMoney(data?.dailyAvg ?? 0)}/day
              </span>
            </div>
            <div className="mt-5 h-32">
              {data && <DailyArea data={data.daily} />}
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-base font-semibold">Top categories</h2>
            <div className="mt-5">
              {spentCategories.length === 0 ? (
                <EmptyPanel
                  className="h-28"
                  label="Nothing to rank yet"
                  hint="Your biggest categories will show up here."
                />
              ) : (
                <CategoryBars
                  rows={spentCategories.slice(0, 5).map((category) => ({
                    name: category.name,
                    color: category.color,
                    total: category.total,
                    share: category.share,
                  }))}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent transactions */}
      <section className="rise rise-4 mt-6 card-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Recent transactions</h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="mt-4">
          <TransactionList
            rows={rows}
            isLoading={transactions.isLoading}
            filters={filters}
            emptyLabel="Nothing logged this month yet"
          />
        </div>
      </section>

      <AddTransactionDialog
        key={quickCategory ?? "new"}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultCategoryId={quickCategory}
      />
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/70">
        {icon}
        {label}
      </p>
      <p className="num mt-1.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default Index;

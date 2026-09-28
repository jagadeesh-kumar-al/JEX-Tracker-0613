import { useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowUp, Crown, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthSwitcher } from "../components/shell";
import { BarSeries, CategoryBars, DailyArea, DonutChart } from "../components/charts";
import { useMonth } from "../components/month-context";
import { EmptyPanel } from "../components/empty-panel";
import { useOverview, useSettings } from "../queries/analytics";
import { categoryColor, categoryIcon, categoryTint } from "../lib/categories";
import { formatMoney, formatPercent } from "../lib/format";
import { useCurrency } from "../components/preferences";

type Range = "trend" | "weekly";

function Analytics() {
  const currency = useCurrency();
  const { month } = useMonth();
  const overview = useOverview(month);
  const settings = useSettings();
  const [range, setRange] = useState<Range>("trend");

  const data = overview.data;
  const budget = settings.data?.monthlyBudget ?? 0;
  const change = data?.changeShare ?? 0;
  const trend = data?.trend ?? [];
  const avgSpend = trend.length
    ? Math.round(trend.reduce((sum, point) => sum + point.spent, 0) / trend.length)
    : 0;
  const best = [...trend].sort((a, b) => a.spent - b.spent)[0];
  const worst = [...trend].sort((a, b) => b.spent - a.spent)[0];

  const chartData =
    range === "trend"
      ? trend.map((point) => ({
          label: point.label,
          value: point.spent,
          secondary: point.income,
        }))
      : (data?.weekly ?? []).map((bucket) => ({ label: bucket.label, value: bucket.total }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="rise rise-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.label ?? "Loading…"} against the last {trend.length} months
          </p>
        </div>
        <MonthSwitcher />
      </header>

      {/* Stat strip */}
      <section className="rise rise-2 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={formatMoney(data?.spent ?? 0)}
          hint={
            data && data.prevSpent > 0
              ? `${change > 0 ? "up" : "down"} ${formatPercent(Math.abs(change), 1)} vs last month`
              : "no prior month data"
          }
          tone={change > 0 ? "warn" : "good"}
          icon={change > 0 ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
        />
        <StatCard
          label={`${trend.length}-month average`}
          value={formatMoney(avgSpend)}
          hint={
            data && avgSpend > 0
              ? `${formatPercent(Math.abs((data.spent - avgSpend) / avgSpend), 1)} ${
                  data.spent > avgSpend ? "above" : "below"
                } average`
              : "not enough history yet"
          }
        />
        <StatCard
          label="Projected month end"
          value={formatMoney(data?.projected ?? 0)}
          hint={`based on ${formatMoney(data?.dailyAvg ?? 0)} a day`}
        />
        <StatCard
          label="Budget usage"
          value={budget > 0 ? formatPercent(data ? data.spent / budget : 0) : "Not set"}
          hint={budget > 0 ? `of ${formatMoney(budget)}` : "set one below"}
          tone={budget > 0 && data && data.spent > budget ? "warn" : "good"}
          icon={<Target className="size-4" />}
        />
      </section>

      {/* Main chart */}
      <section className="rise rise-3 mt-5 card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">
              {range === "trend" ? "Monthly spend" : "Spend by week"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {range === "trend"
                ? "Violet bars are expenses, green slivers are income"
                : `Weeks of ${data?.label ?? ""}`}
            </p>
          </div>
          <div className="flex rounded-full bg-muted p-1">
            {(["trend", "weekly"] as Range[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition",
                  range === option
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "trend" ? "Monthly" : "Weekly"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          {chartData.length > 0 ? (
            <BarSeries data={chartData} height={220} />
          ) : (
            <EmptyPanel className="h-[220px]" label="No history yet" />
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="rise rise-4 card-surface p-6 lg:col-span-3">
          <h2 className="font-display text-base font-semibold">Category split</h2>
          <div className="mt-5">
            {(data?.byCategory ?? []).length === 0 ? (
              <EmptyPanel
                label="No categories to split yet"
                hint="Add a few transactions and the breakdown fills in."
              />
            ) : (
              <CategoryBars
                rows={(data?.byCategory ?? []).map((category) => ({
                  name: category.name,
                  color: category.color,
                  total: category.total,
                  share: category.share,
                }))}
              />
            )}
          </div>
        </div>

        <div className="rise rise-4 card-surface flex flex-col items-center p-6 lg:col-span-2">
          <h2 className="self-start font-display text-base font-semibold">Share of wallet</h2>
          <div className="mt-4 w-full">
            {(data?.byCategory ?? []).length === 0 ? (
              <EmptyPanel className="h-[190px]" label="Nothing spent this month" />
            ) : (
              <DonutChart
                size={190}
                total={data?.spent ?? 0}
                slices={(data?.byCategory ?? []).map((category) => ({
                  label: category.name,
                  value: category.total,
                  color: categoryColor(category.color),
                }))}
              />
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rise rise-5 card-surface p-6">
          <h2 className="font-display text-base font-semibold">Top merchants</h2>
          <div className="mt-4 space-y-2.5">
            {(data?.topMerchants ?? []).map((merchant, index) => (
              <div
                key={merchant.merchant}
                className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3"
              >
                <span className="num grid size-8 place-items-center rounded-xl bg-card text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{merchant.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    {merchant.count} {merchant.count === 1 ? "charge" : "charges"}
                  </p>
                </div>
                <span className="num text-sm font-semibold">{formatMoney(merchant.total)}</span>
              </div>
            ))}
            {!overview.isLoading && (data?.topMerchants ?? []).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No spending this month
              </p>
            )}
          </div>
        </div>

        <div className="rise rise-5 space-y-5">
          <div className="card-surface p-6">
            <h2 className="font-display text-base font-semibold">Highlights</h2>
            <div className="mt-4 space-y-3">
              {data?.largest && (
                <Highlight
                  icon={
                    <span
                      className="grid size-9 place-items-center rounded-xl"
                      style={{
                        backgroundColor: categoryTint(data.largest.color),
                        color: categoryColor(data.largest.color),
                      }}
                    >
                      {(() => {
                        const Icon = categoryIcon(data.largest.icon);
                        return <Icon className="size-4.5" />;
                      })()}
                    </span>
                  }
                  title="Largest single expense"
                  subtitle={`${data.largest.merchant || data.largest.name} · ${data.largest.name}`}
                  value={formatMoney(data.largest.amount)}
                />
              )}
              {best && (
                <Highlight
                  icon={
                    <span className="grid size-9 place-items-center rounded-xl bg-success/15 text-success">
                      <Crown className="size-4.5" />
                    </span>
                  }
                  title="Lightest month"
                  subtitle={best.label}
                  value={formatMoney(best.spent)}
                />
              )}
              {worst && (
                <Highlight
                  icon={
                    <span className="grid size-9 place-items-center rounded-xl bg-destructive/12 text-destructive">
                      <ArrowUp className="size-4.5" />
                    </span>
                  }
                  title="Heaviest month"
                  subtitle={worst.label}
                  value={formatMoney(worst.spent)}
                />
              )}
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-base font-semibold">Budget &amp; display</h2>
              <Link
                to="/preferences"
                className="text-xs font-semibold text-primary transition hover:brightness-110"
              >
                Edit in preferences
              </Link>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Monthly budget
                </p>
                <p className="num mt-1 text-lg font-semibold">
                  {budget > 0 ? formatMoney(budget) : "Not set"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Currency
                </p>
                <p className="num mt-1 text-lg font-semibold">
                  {currency.symbol} {currency.code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rise rise-5 mt-5 card-surface p-6">
        <h2 className="font-display text-base font-semibold">Daily rhythm</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Every day of {data?.label ?? "the month"}
        </p>
        <div className="mt-5 h-36">{data && <DailyArea data={data.daily} height={144} />}</div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warn";
  icon?: React.ReactNode;
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full",
              tone === "warn"
                ? "bg-destructive/12 text-destructive"
                : "bg-success/15 text-success",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="num mt-2.5 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Highlight({
  icon,
  title,
  subtitle,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="num text-sm font-semibold">{value}</span>
    </div>
  );
}

export default Analytics;

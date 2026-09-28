import { z } from "zod";
import { and, eq, gte, lt } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import { daysInMonth, monthKey, monthLabel, monthRange, trailingMonths } from "../lib/period";
import { CURRENCY_CODES } from "../lib/currency";

const input = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  /** How many months of trend history to include. */
  trendMonths: z.number().int().min(3).max(12).default(6),
});

type Row = {
  amount: number;
  kind: "expense" | "income";
  merchant: string;
  occurredAt: Date;
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  budget: number | null;
};

async function loadRows(userId: string, from: Date, to: Date): Promise<Row[]> {
  return db
    .select({
      amount: schema.transactions.amount,
      kind: schema.transactions.kind,
      merchant: schema.transactions.merchant,
      occurredAt: schema.transactions.occurredAt,
      categoryId: schema.categories.id,
      name: schema.categories.name,
      icon: schema.categories.icon,
      color: schema.categories.color,
      budget: schema.categories.monthlyBudget,
    })
    .from(schema.transactions)
    .innerJoin(schema.categories, eq(schema.categories.id, schema.transactions.categoryId))
    .where(
      and(
        eq(schema.transactions.userId, userId),
        gte(schema.transactions.occurredAt, from),
        lt(schema.transactions.occurredAt, to),
      ),
    );
}

export const analytics = {
  overview: authed.input(input).handler(async ({ input, context }) => {
    const months = trailingMonths(input.month, input.trendMonths);
    const historyStart = monthRange(months[0]).start;
    const { start: monthStart, end: monthEnd } = monthRange(input.month);
    const rows = await loadRows(context.userId, historyStart, monthEnd);

    const [settingsRow] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.userId, context.userId))
      .limit(1);
    const budget = settingsRow?.monthlyBudget ?? 0;

    const inMonth = rows.filter(
      (r) => r.occurredAt >= monthStart && r.occurredAt < monthEnd,
    );
    const spent = inMonth
      .filter((r) => r.kind === "expense")
      .reduce((sum, r) => sum + r.amount, 0);
    const income = inMonth
      .filter((r) => r.kind === "income")
      .reduce((sum, r) => sum + r.amount, 0);

    // Previous month, for the change indicator.
    const prevKey = months[months.length - 2] ?? null;
    const prevSpent = prevKey
      ? rows
          .filter((r) => monthKey(r.occurredAt) === prevKey && r.kind === "expense")
          .reduce((sum, r) => sum + r.amount, 0)
      : 0;

    // Category breakdown for the selected month (expenses only).
    const byCategoryMap = new Map<
      number,
      {
        categoryId: number;
        name: string;
        icon: string;
        color: string;
        total: number;
        count: number;
        budget: number | null;
      }
    >();
    for (const row of inMonth) {
      if (row.kind !== "expense") continue;
      const entry = byCategoryMap.get(row.categoryId) ?? {
        categoryId: row.categoryId,
        name: row.name,
        icon: row.icon,
        color: row.color,
        total: 0,
        count: 0,
        budget: row.budget,
      };
      entry.total += row.amount;
      entry.count += 1;
      byCategoryMap.set(row.categoryId, entry);
    }
    const byCategory = [...byCategoryMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((entry) => ({
        ...entry,
        share: spent > 0 ? entry.total / spent : 0,
      }));

    // Daily series for the selected month.
    const dayCount = daysInMonth(input.month);
    const daily = Array.from({ length: dayCount }, (_, i) => ({ day: i + 1, total: 0 }));
    for (const row of inMonth) {
      if (row.kind !== "expense") continue;
      daily[row.occurredAt.getUTCDate() - 1].total += row.amount;
    }

    // Weekly buckets (1-7, 8-14, 15-21, 22-end).
    const weekly = [
      { label: "1–7", total: 0 },
      { label: "8–14", total: 0 },
      { label: "15–21", total: 0 },
      { label: `22–${dayCount}`, total: 0 },
    ];
    for (const point of daily) {
      const bucket = Math.min(3, Math.floor((point.day - 1) / 7));
      weekly[bucket].total += point.total;
    }

    // Month-over-month trend.
    const trend = months.map((key) => {
      const monthRows = rows.filter((r) => monthKey(r.occurredAt) === key);
      return {
        month: key,
        label: monthLabel(key),
        spent: monthRows
          .filter((r) => r.kind === "expense")
          .reduce((sum, r) => sum + r.amount, 0),
        income: monthRows
          .filter((r) => r.kind === "income")
          .reduce((sum, r) => sum + r.amount, 0),
      };
    });

    // Top merchants this month.
    const merchantMap = new Map<string, { merchant: string; total: number; count: number }>();
    for (const row of inMonth) {
      if (row.kind !== "expense") continue;
      const key = row.merchant || row.name;
      const entry = merchantMap.get(key) ?? { merchant: key, total: 0, count: 0 };
      entry.total += row.amount;
      entry.count += 1;
      merchantMap.set(key, entry);
    }
    const topMerchants = [...merchantMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const now = new Date();
    const isCurrentMonth = monthKey(now) === input.month;
    const elapsedDays = isCurrentMonth ? now.getUTCDate() : dayCount;
    const dailyAvg = elapsedDays > 0 ? Math.round(spent / elapsedDays) : 0;

    return {
      month: input.month,
      label: monthRange(input.month).start.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      spent,
      income,
      net: income - spent,
      budget,
      budgetShare: budget > 0 ? spent / budget : 0,
      transactionCount: inMonth.length,
      prevSpent,
      changeShare: prevSpent > 0 ? (spent - prevSpent) / prevSpent : 0,
      dailyAvg,
      projected: isCurrentMonth ? dailyAvg * dayCount : spent,
      largest: inMonth
        .filter((r) => r.kind === "expense")
        .sort((a, b) => b.amount - a.amount)[0] ?? null,
      byCategory,
      daily,
      weekly,
      trend,
      topMerchants,
    };
  }),

  settings: authed.handler(async ({ context }) => {
    const [row] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.userId, context.userId))
      .limit(1);
    if (row) return row;
    const [created] = await db
      .insert(schema.settings)
      .values({ userId: context.userId, ownerName: context.user.name ?? "" })
      .returning();
    return created;
  }),

  updateSettings: authed
    .input(
      z.object({
        monthlyBudget: z.number().int().nonnegative().optional(),
        ownerName: z.string().min(1).max(60).optional(),
        currency: z.enum(CURRENCY_CODES).optional(),
        themeMode: z.enum(["light", "dark", "system"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.userId, context.userId))
        .limit(1);
      if (!row) {
        const [created] = await db
          .insert(schema.settings)
          .values({ ...input, userId: context.userId })
          .returning();
        return created;
      }
      const [updated] = await db
        .update(schema.settings)
        .set(input)
        .where(eq(schema.settings.id, row.id))
        .returning();
      return updated;
    }),
};

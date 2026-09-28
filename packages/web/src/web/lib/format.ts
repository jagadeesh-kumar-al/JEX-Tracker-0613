/** Money and date formatting. Amounts are integer cents everywhere. */
import { activeCurrency, findCurrency } from "./currency";

export function formatMoney(
  cents: number,
  options?: { compact?: boolean; sign?: boolean; currency?: string },
) {
  const value = cents / 100;
  const currency = options?.currency ? findCurrency(options.currency) : activeCurrency();
  const formatter = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    notation: options?.compact ? "compact" : "standard",
    maximumFractionDigits: options?.compact ? 1 : Math.abs(value) >= 1000 ? 0 : 2,
    minimumFractionDigits: options?.compact ? 0 : Math.abs(value) >= 1000 ? 0 : 2,
  });
  const text = formatter.format(Math.abs(value));
  if (options?.sign) return `${cents < 0 ? "−" : "+"}${text}`;
  return cents < 0 ? `−${text}` : text;
}

export function formatPercent(share: number, digits = 0) {
  return `${(share * 100).toFixed(digits)}%`;
}

export function monthKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return monthKeyOf(date);
}

export function monthTitle(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function recentMonths(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) =>
    monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
}

export function formatDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isToday) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Parses a user-typed amount ("12.40", "1,204") into cents. */
export function parseAmountToCents(input: string) {
  const cleaned = input.replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

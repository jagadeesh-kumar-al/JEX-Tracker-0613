/** Period helpers shared by the transactions and analytics routes. */

/** Parses "YYYY-MM" into an inclusive/exclusive [start, end) UTC range. */
export function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));
  return { start, end };
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(date: Date) {
  return `${monthKey(date)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** The last `count` month keys ending with `month` (inclusive), oldest first. */
export function trailingMonths(month: string, count: number) {
  const [year, m] = month.split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(year, m - 1 - i, 1))));
  }
  return keys;
}

export function monthLabel(month: string) {
  const { start } = monthRange(month);
  return start.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

export function daysInMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

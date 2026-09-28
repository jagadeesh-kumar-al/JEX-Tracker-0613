/**
 * Currencies a user can pick in preferences. The code is stored on
 * `settings.currency`; clients render amounts with `Intl.NumberFormat` using it.
 * Keep this list in sync with the client tables in
 * `packages/web/src/web/lib/currency.ts` and `packages/mobile/lib/currency.ts`.
 */
export const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "CAD",
  "AUD",
  "SGD",
  "AED",
  "BRL",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

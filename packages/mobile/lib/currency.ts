/**
 * Currency table + the app-wide active currency. Mirrors
 * `packages/web/src/web/lib/currency.ts` — keep both in sync with the codes the
 * API accepts (`packages/web/src/api/lib/currency.ts`).
 */

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "JPY"
  | "CAD"
  | "AUD"
  | "SGD"
  | "AED"
  | "BRL";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

// Dollar/yen currencies use en-US so the symbol disambiguates (CA$, A$, ¥)
// instead of a bare "$" that reads as USD.
export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", locale: "en-US" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", locale: "en-US" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", locale: "en-US" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", locale: "en-US" },
  { code: "AED", symbol: "AED", label: "UAE Dirham", locale: "en-AE" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real", locale: "pt-BR" },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

export function findCurrency(code: string | null | undefined): Currency {
  return CURRENCIES.find((entry) => entry.code === code) ?? DEFAULT_CURRENCY;
}

let active: Currency = DEFAULT_CURRENCY;

/** Set by `PreferencesProvider`; `formatMoney` reads it. */
export function setActiveCurrency(code: string | null | undefined) {
  active = findCurrency(code);
  return active;
}

export function activeCurrency(): Currency {
  return active;
}

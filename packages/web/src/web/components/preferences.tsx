import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authClient } from "../lib/auth";
import { useSettings, useUpdateSettings } from "../queries/analytics";
import {
  type Currency,
  type CurrencyCode,
  activeCurrency,
  findCurrency,
  setActiveCurrency,
} from "../lib/currency";

export type ThemeMode = "light" | "dark" | "system";

const STORE_CURRENCY = "spendwise.currency";
const STORE_THEME = "spendwise.theme";

const isBrowser = typeof window !== "undefined";

function storedCurrency(): CurrencyCode {
  if (!isBrowser) return findCurrency(null).code;
  return findCurrency(window.localStorage.getItem(STORE_CURRENCY)).code;
}

function storedTheme(): ThemeMode {
  if (!isBrowser) return "system";
  const raw = window.localStorage.getItem(STORE_THEME);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

function systemTheme(): "light" | "dark" {
  if (!isBrowser || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  if (!isBrowser) return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

// Boot from the last known choice so the first paint is already correct — the
// saved setting arrives a moment later and wins if it differs.
if (isBrowser) {
  setActiveCurrency(storedCurrency());
  const boot = storedTheme();
  applyTheme(boot === "system" ? systemTheme() : boot);
}

interface PreferencesValue {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
  saving: boolean;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const settings = useSettings({ enabled: !!session });
  const updateSettings = useUpdateSettings();

  const [code, setCode] = useState<CurrencyCode>(storedCurrency);
  const [themeMode, setMode] = useState<ThemeMode>(storedTheme);
  const [system, setSystem] = useState<"light" | "dark">(systemTheme);

  // Adopt the saved account settings once they load.
  const saved = settings.data;
  useEffect(() => {
    if (!saved) return;
    const savedCode = findCurrency(saved.currency).code;
    setCode(savedCode);
    window.localStorage.setItem(STORE_CURRENCY, savedCode);
    const savedMode = saved.themeMode;
    if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
      setMode(savedMode);
      window.localStorage.setItem(STORE_THEME, savedMode);
    }
  }, [saved]);

  // Track the OS preference while the user is on "system".
  useEffect(() => {
    if (!isBrowser || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = themeMode === "system" ? system : themeMode;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Keep the formatter in step within this same render pass.
  if (activeCurrency().code !== code) setActiveCurrency(code);

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCode(next);
      setActiveCurrency(next);
      if (isBrowser) window.localStorage.setItem(STORE_CURRENCY, next);
      updateSettings.mutate({ currency: next });
    },
    [updateSettings],
  );

  const setThemeMode = useCallback(
    (next: ThemeMode) => {
      setMode(next);
      if (isBrowser) window.localStorage.setItem(STORE_THEME, next);
      updateSettings.mutate({ themeMode: next });
    },
    [updateSettings],
  );

  const value = useMemo<PreferencesValue>(
    () => ({
      currency: findCurrency(code),
      setCurrency,
      themeMode,
      setThemeMode,
      resolvedTheme,
      saving: updateSettings.isPending,
    }),
    [code, setCurrency, themeMode, setThemeMode, resolvedTheme, updateSettings.isPending],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    return {
      currency: activeCurrency(),
      setCurrency: () => {},
      themeMode: "system",
      setThemeMode: () => {},
      resolvedTheme: "light",
      saving: false,
    };
  }
  return value;
}

/**
 * Subscribes a component to the active currency. Call it in anything that
 * renders money so a currency change re-renders it immediately.
 */
export function useCurrency(): Currency {
  return usePreferences().currency;
}

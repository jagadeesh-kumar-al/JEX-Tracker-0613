import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { authClient } from "@/lib/auth";
import { useSettings, useUpdateSettings } from "@/queries/analytics";
import {
  type Currency,
  type CurrencyCode,
  activeCurrency,
  findCurrency,
  setActiveCurrency,
} from "@/lib/currency";

export type ThemeMode = "light" | "dark" | "system";

interface PreferencesValue {
  currency: Currency;
  setCurrency: (code: CurrencyCode) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedScheme: "light" | "dark";
  saving: boolean;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

/** Account-wide display preferences: currency and light/dark appearance. */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const settings = useSettings({ enabled: !!session });
  const updateSettings = useUpdateSettings();
  const systemScheme = useColorScheme() ?? "light";

  const [code, setCode] = useState<CurrencyCode>(() => activeCurrency().code);
  const [themeMode, setMode] = useState<ThemeMode>("system");

  const saved = settings.data;
  useEffect(() => {
    if (!saved) return;
    setCode(findCurrency(saved.currency).code);
    const savedMode = saved.themeMode;
    if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
      setMode(savedMode);
    }
  }, [saved]);

  // Keep the formatter in step within this same render pass.
  if (activeCurrency().code !== code) setActiveCurrency(code);

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCode(next);
      setActiveCurrency(next);
      updateSettings.mutate({ currency: next });
    },
    [updateSettings],
  );

  const setThemeMode = useCallback(
    (next: ThemeMode) => {
      setMode(next);
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
      resolvedScheme: themeMode === "system" ? systemScheme : themeMode,
      saving: updateSettings.isPending,
    }),
    [code, setCurrency, themeMode, setThemeMode, systemScheme, updateSettings.isPending],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** Safe outside the provider (e.g. the sign-in screen): falls back to system. */
export function usePreferences(): PreferencesValue {
  const context = useContext(PreferencesContext);
  const systemScheme = useColorScheme() ?? "light";
  if (context) return context;
  return {
    currency: activeCurrency(),
    setCurrency: () => {},
    themeMode: "system",
    setThemeMode: () => {},
    resolvedScheme: systemScheme,
    saving: false,
  };
}

/**
 * Subscribes a component to the active currency. Call it in anything that
 * renders money so a currency change re-renders it immediately.
 */
export function useCurrency(): Currency {
  return usePreferences().currency;
}

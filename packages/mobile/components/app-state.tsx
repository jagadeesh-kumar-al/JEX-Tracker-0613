import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { monthKeyOf, shiftMonth } from "@/lib/format";

type Draft = {
  amount: string;
  kind: "expense" | "income";
  categoryId: number | null;
  merchant: string;
  note: string;
};

const EMPTY_DRAFT: Draft = {
  amount: "",
  kind: "expense",
  categoryId: null,
  merchant: "",
  note: "",
};

type AppStateValue = {
  month: string;
  setMonth: (month: string) => void;
  stepMonth: (delta: number) => void;
  isCurrentMonth: boolean;
  draft: Draft;
  patchDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

/** Holds the selected month and the in-progress "add transaction" draft. */
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const current = monthKeyOf(new Date());
  const [month, setMonth] = useState(current);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const stepMonth = useCallback(
    (delta: number) => {
      setMonth((value) => {
        const next = shiftMonth(value, delta);
        return next > current ? value : next;
      });
    },
    [current],
  );

  const patchDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((value) => ({ ...value, ...patch }));
  }, []);

  const resetDraft = useCallback(() => setDraft(EMPTY_DRAFT), []);

  const value = useMemo(
    () => ({
      month,
      setMonth,
      stepMonth,
      isCurrentMonth: month === current,
      draft,
      patchDraft,
      resetDraft,
    }),
    [month, stepMonth, current, draft, patchDraft, resetDraft],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}

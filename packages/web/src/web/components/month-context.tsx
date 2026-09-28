import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { monthKeyOf, shiftMonth } from "../lib/format";

type MonthContextValue = {
  month: string;
  setMonth: (month: string) => void;
  step: (delta: number) => void;
  isCurrentMonth: boolean;
};

const MonthContext = createContext<MonthContextValue | null>(null);

/** Keeps the selected month in sync across Overview, Transactions and Analytics. */
export function MonthProvider({ children }: { children: React.ReactNode }) {
  const current = monthKeyOf(new Date());
  const [month, setMonth] = useState(current);

  const step = useCallback((delta: number) => {
    setMonth((value) => {
      const next = shiftMonth(value, delta);
      return next > current ? value : next;
    });
  }, [current]);

  const value = useMemo(
    () => ({ month, setMonth, step, isCurrentMonth: month === current }),
    [month, step, current],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) throw new Error("useMonth must be used inside MonthProvider");
  return context;
}

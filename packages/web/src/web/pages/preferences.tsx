import { useEffect, useState } from "react";
import { Check, Loader2, Monitor, Moon, Sun, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "../lib/currency";
import { formatMoney, parseAmountToCents } from "../lib/format";
import { useSettings, useUpdateSettings } from "../queries/analytics";
import { type ThemeMode, usePreferences } from "../components/preferences";
import { authClient } from "../lib/auth";

const MODES: { value: ThemeMode; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", hint: "Always bright", icon: Sun },
  { value: "dark", label: "Dark", hint: "Always dim", icon: Moon },
  { value: "system", label: "System", hint: "Follow device", icon: Monitor },
];

/** Account-wide display preferences: currency, budget, appearance, name. */
function Preferences() {
  const { data: session } = authClient.useSession();
  const { currency, setCurrency, themeMode, setThemeMode, saving } = usePreferences();
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  const savedBudget = settings.data?.monthlyBudget ?? 0;
  const savedName = settings.data?.ownerName ?? "";

  const [budget, setBudget] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  // Fill the form from the saved settings until the user starts editing.
  useEffect(() => {
    if (touched || !settings.data) return;
    setBudget(savedBudget > 0 ? (savedBudget / 100).toFixed(0) : "");
    setName(savedName);
  }, [touched, settings.data, savedBudget, savedName]);

  const budgetCents = parseAmountToCents(budget);
  const dirty = budgetCents !== savedBudget || name.trim() !== savedName;

  const save = () => {
    updateSettings.mutate({
      ...(budgetCents > 0 ? { monthlyBudget: budgetCents } : {}),
      ownerName: name.trim(),
    });
    setTouched(false);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="rise rise-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Currency, budget and appearance — saved to{" "}
            {session?.user?.email ?? "your account"} and applied on every device.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-muted/70 px-3.5 py-2 text-xs font-semibold text-muted-foreground">
          {saving || updateSettings.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="size-3.5 text-success" />
              All changes saved
            </>
          )}
        </span>
      </header>

      {/* Currency */}
      <section className="rise rise-2 mt-6 card-surface p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold">Currency</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every amount in SpendWise — totals, charts, transactions — is formatted in this
              currency.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {CURRENCIES.map((entry) => {
            const active = entry.code === currency.code;
            return (
              <button
                key={entry.code}
                type="button"
                onClick={() => setCurrency(entry.code)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  active
                    ? "border-primary bg-primary/8 shadow-soft"
                    : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70",
                )}
              >
                <span
                  className={cn(
                    "num grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                  )}
                >
                  {entry.symbol}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {entry.code}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {entry.label}
                  </span>
                </span>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {formatMoney(123400, { compact: true, currency: entry.code })}
                </span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        <p className="mt-4 rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          Preview —{" "}
          <span className="num font-semibold text-foreground">{formatMoney(123456)}</span> spent,{" "}
          <span className="num font-semibold text-success">
            {formatMoney(45000, { sign: true })}
          </span>{" "}
          income
        </p>
      </section>

      {/* Budget + name */}
      <section className="rise rise-3 mt-5 card-surface p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-success/12 text-success">
            <Target className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold">Monthly budget</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drives the budget ring on Overview and the usage figure on Analytics.
            </p>
          </div>
        </div>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (dirty) save();
          }}
        >
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Budget per month
            </span>
            <span className="relative block">
              <span className="num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currency.symbol}
              </span>
              <input
                value={budget}
                onChange={(event) => {
                  setTouched(true);
                  setBudget(event.target.value);
                }}
                inputMode="decimal"
                placeholder="3000"
                aria-label="Monthly budget"
                className="num h-11 w-full rounded-2xl border border-input bg-muted/50 pr-4 text-sm outline-none transition focus:border-ring focus:bg-card"
                style={{ paddingLeft: `${2.25 + currency.symbol.length * 0.45}rem` }}
              />
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Currently {savedBudget > 0 ? formatMoney(savedBudget) : "not set"}
            </span>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Display name
            </span>
            <input
              value={name}
              onChange={(event) => {
                setTouched(true);
                setName(event.target.value);
              }}
              placeholder="Your name"
              aria-label="Display name"
              className="h-11 w-full rounded-2xl border border-input bg-muted/50 px-4 text-sm outline-none transition focus:border-ring focus:bg-card"
            />
            <span className="block text-[11px] text-muted-foreground">
              Used in the greeting on Overview.
            </span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!dirty || updateSettings.isPending}
              className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-45"
            >
              {updateSettings.isPending ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </form>
      </section>

      {/* Appearance */}
      <section className="rise rise-4 mt-5 card-surface p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/12 text-amber-500">
            <Sun className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold">Appearance</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Light, dark, or whatever this device is set to.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {MODES.map((mode) => {
            const active = mode.value === themeMode;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setThemeMode(mode.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                  active
                    ? "border-primary bg-primary/8 shadow-soft"
                    : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/70",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                  )}
                >
                  <mode.icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{mode.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{mode.hint}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Preferences;

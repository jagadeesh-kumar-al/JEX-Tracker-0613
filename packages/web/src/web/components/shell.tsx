import { Link, useLocation } from "wouter";
import {
  ChartPie,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { monthTitle } from "../lib/format";
import { useMonth } from "./month-context";
import { AddTransactionDialog } from "./add-transaction-dialog";
import { AccountCard } from "./account-card";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/analytics", label: "Analytics", icon: ChartPie },
];

const PREFERENCES = { href: "/preferences", label: "Settings", icon: Settings };

export function MonthSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { month, step, isCurrentMonth } = useMonth();
  const onDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full p-1",
        onDark ? "bg-white/15 text-white" : "bg-card text-foreground shadow-soft",
      )}
    >
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => step(-1)}
        className={cn(
          "grid size-8 place-items-center rounded-full transition",
          onDark ? "hover:bg-white/20" : "hover:bg-muted",
        )}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-36 text-center text-sm font-semibold">{monthTitle(month)}</span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => step(1)}
        disabled={isCurrentMonth}
        className={cn(
          "grid size-8 place-items-center rounded-full transition disabled:opacity-35",
          onDark ? "hover:bg-white/20" : "hover:bg-muted",
        )}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-border/70 bg-card/70 px-5 py-7 backdrop-blur lg:flex">
        <div>
          <div className="flex items-center gap-3 px-1">
            <div className="hero-gradient grid size-10 place-items-center rounded-2xl text-lg font-bold text-white">
              S
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none">SpendWise</p>
              <p className="text-xs text-muted-foreground">Spending tracker</p>
            </div>
          </div>

          <nav className="mt-9 space-y-1.5">
            {NAV.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/8"
          >
            <Plus className="size-4" />
            Add transaction
          </button>
        </div>

        <AccountCard />
      </aside>

      <main className="lg:pl-64">
        <div className="pb-28 lg:pb-12">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-6 pb-3 pt-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {NAV.slice(0, 2).map((item) => (
            <NavIcon key={item.href} item={item} active={location === item.href} />
          ))}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="hero-gradient -mt-7 grid size-14 place-items-center rounded-full text-white shadow-lifted"
            aria-label="Add transaction"
          >
            <Plus className="size-6" />
          </button>
          {NAV.slice(2).map((item) => (
            <NavIcon key={item.href} item={item} active={location === item.href} />
          ))}
          <NavIcon item={PREFERENCES} active={location === PREFERENCES.href} />
        </div>
      </nav>

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function NavIcon({
  item,
  active,
}: {
  item: { href: string; label: string; icon: typeof Settings };
  active: boolean;
}) {
  return (
    <Link
      to={item.href}
      className={cn(
        "flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-medium transition",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}

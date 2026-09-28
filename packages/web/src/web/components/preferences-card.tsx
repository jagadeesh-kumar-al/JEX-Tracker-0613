import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "./preferences";

/** Compact light/dark switch for the sidebar. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setThemeMode } = usePreferences();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setThemeMode(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        "grid size-8 place-items-center rounded-xl bg-card text-muted-foreground transition hover:text-foreground",
        className,
      )}
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

import { useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { authClient } from "../lib/auth";
import { ThemeToggleButton } from "./preferences-card";

/** Signed-in account + sign out, pinned to the bottom of the sidebar. */
export function AccountCard() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const user = session?.user;

  if (!user) return null;

  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = async () => {
    setBusy(true);
    try {
      await authClient.signOut();
      // Drop every cached row so the next account never sees this one's data.
      queryClient.clear();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-muted/70 p-3.5">
      <div className="flex items-center gap-3">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="size-9 rounded-full object-cover"
          />
        ) : (
          <div className="hero-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{user.name || "Account"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
        >
          <LogOut className="size-3.5" />
          {busy ? "Signing out…" : "Sign out"}
        </button>
        <Link
          to="/preferences"
          aria-label="Preferences"
          title="Preferences"
          className="grid size-8 place-items-center rounded-xl bg-card text-muted-foreground transition hover:text-foreground"
        >
          <Settings className="size-4" />
        </Link>
        <ThemeToggleButton />
      </div>
    </div>
  );
}

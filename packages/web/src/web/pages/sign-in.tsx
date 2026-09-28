import { useState } from "react";
import { ChartPie, Lock, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { authClient } from "../lib/auth";
import { cn } from "@/lib/utils";

const RETURNING_KEY = "spendwise:returning";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.59-5.17 3.59-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.29 6.63l3.99 3.09C6.22 6.87 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

const PERKS = [
  { icon: Receipt, label: "Log spending in seconds" },
  { icon: ChartPie, label: "See where the money went" },
  { icon: Lock, label: "Only you can see your data" },
];

export default function SignInPage() {
  const returning = (() => {
    try {
      return localStorage.getItem(RETURNING_KEY) === "1";
    } catch {
      return false;
    }
  })();

  const [mode, setMode] = useState<"signin" | "signup">(returning ? "signin" : "signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = mode === "signup";

  const go = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await authClient.managedAuth.signIn({ provider: "google" });
      if (result.error && result.error.code !== "POPUP_CLOSED") {
        setError(result.error.message ?? "Google sign-in failed. Try again.");
      } else if (!result.error) {
        try {
          localStorage.setItem(RETURNING_KEY, "1");
        } catch {
          /* private mode — harmless */
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="hero-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/12 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-white/8 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur">
            S
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none">SpendWise</p>
            <p className="text-xs text-white/70">Spending tracker</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-[2.6rem] font-bold leading-[1.08] tracking-tight">
            Every dollar,
            <br />
            in its place.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/80">
            Your own private ledger. Sign in with Google and pick up exactly where you left off —
            on this browser or your phone.
          </p>
          <ul className="mt-9 space-y-3.5">
            {PERKS.map((perk) => (
              <li key={perk.label} className="flex items-center gap-3 text-sm text-white/90">
                <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                  <perk.icon className="size-4.5" />
                </span>
                {perk.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">
          No card, no setup. Your entries stay tied to your Google account.
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="hero-gradient grid size-10 place-items-center rounded-2xl text-lg font-bold text-white">
              S
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none">SpendWise</p>
              <p className="text-xs text-muted-foreground">Spending tracker</p>
            </div>
          </div>

          {/* Mode switch */}
          <div className="flex rounded-full bg-muted p-1">
            {(
              [
                { key: "signup", label: "Sign up" },
                { key: "signin", label: "Sign in" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMode(tab.key);
                  setError(null);
                }}
                className={cn(
                  "h-10 flex-1 rounded-full text-sm font-semibold transition",
                  mode === tab.key
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight">
            {signUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {signUp
              ? "First time here? Continue with Google and we'll set up a fresh, private workspace with starter categories."
              : "Already signed up? Continue with the same Google account to load your transactions."}
          </p>

          <button
            type="button"
            onClick={go}
            disabled={busy}
            className="mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-muted/60 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Opening Google…
              </>
            ) : (
              <>
                <GoogleMark />
                {signUp ? "Sign up with Google" : "Sign in with Google"}
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-muted/70 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your transactions, categories and budget are private to your account. Nobody else
              signing in can see them.
            </p>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            {signUp ? "Already have an account? " : "New to SpendWise? "}
            <button
              type="button"
              onClick={() => setMode(signUp ? "signin" : "signup")}
              className="font-semibold text-primary hover:underline"
            >
              {signUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

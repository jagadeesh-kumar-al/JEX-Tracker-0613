import { useEffect, useState } from "react";
import { authClient } from "../lib/auth";
import SignInPage from "../pages/sign-in";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="hero-gradient grid size-12 place-items-center rounded-2xl text-lg font-bold text-white">
          S
        </div>
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}

/**
 * Everything behind sign-in. Without a session the app shows only the auth
 * screen — the API rejects unauthenticated calls anyway.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  // A top-level redirect sign-in (no popup available) lands back here with the
  // broker token in the URL; finish that exchange before showing the auth screen.
  const [redirectDone, setRedirectDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authClient.managedAuth
      .handleRedirect()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setRedirectDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isPending || !redirectDone) return <Splash />;

  if (!session) return <SignInPage />;

  return <>{children}</>;
}

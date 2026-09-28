import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MonthProvider } from "./month-context";
import { PreferencesProvider } from "./preferences";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

interface ProviderProps {
  children: React.ReactNode;
}

// App-level providers — add theme/context providers here, wrapping children.
// QueryClientProvider must stay (all API calls run through TanStack Query).
export function Provider({ children }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MonthProvider>
        <PreferencesProvider>{children}</PreferencesProvider>
      </MonthProvider>
    </QueryClientProvider>
  );
}

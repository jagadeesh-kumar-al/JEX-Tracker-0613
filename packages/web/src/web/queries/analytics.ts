import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useOverview(month: string, trendMonths = 6) {
  return useQuery(
    orpc.analytics.overview.queryOptions({
      input: { month, trendMonths },
      staleTime: 15_000,
    }),
  );
}

export function useSettings(options?: { enabled?: boolean }) {
  return useQuery(
    orpc.analytics.settings.queryOptions({
      staleTime: 60_000,
      enabled: options?.enabled ?? true,
    }),
  );
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.analytics.updateSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
      },
    }),
  );
}

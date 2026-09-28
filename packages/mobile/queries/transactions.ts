import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/api";

export type TransactionFilters = {
  month?: string;
  categoryId?: number;
  kind?: "expense" | "income";
  search?: string;
  limit?: number;
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery(
    orpc.transactions.list.queryOptions({
      input: { limit: 100, ...filters },
      staleTime: 15_000,
    }),
  );
}

export function useTransaction(id: number | null) {
  return useQuery(
    orpc.transactions.byId.queryOptions({
      input: { id: id ?? 0 },
      enabled: typeof id === "number" && id > 0,
      staleTime: 5_000,
    }),
  );
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.transactions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.transactions.key() });
        queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
      },
    }),
  );
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.transactions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.transactions.key() });
        queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
      },
    }),
  );
}

/** Optimistic delete against one filtered list. */
export function useDeleteTransaction(filters: TransactionFilters = {}) {
  const queryClient = useQueryClient();
  const listKey = orpc.transactions.list.queryOptions({
    input: { limit: 100, ...filters },
  }).queryKey;

  return useMutation(
    orpc.transactions.remove.mutationOptions({
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: listKey });
        const previous = queryClient.getQueryData(listKey);
        queryClient.setQueryData(listKey, (old) =>
          Array.isArray(old) ? old.filter((row) => row.id !== id) : old,
        );
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: orpc.transactions.key() });
        queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
      },
    }),
  );
}

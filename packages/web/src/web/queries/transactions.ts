import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

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

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.transactions.key() });
    queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
  };
}

export function useCreateTransaction() {
  const refresh = useRefresh();
  return useMutation(orpc.transactions.create.mutationOptions({ onSuccess: refresh }));
}

export function useUpdateTransaction() {
  const refresh = useRefresh();
  return useMutation(orpc.transactions.update.mutationOptions({ onSuccess: refresh }));
}

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
        queryClient.setQueryData(listKey, (old: unknown) =>
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

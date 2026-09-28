import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useCategories() {
  return useQuery(orpc.categories.list.queryOptions({ staleTime: 60_000 }));
}

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: orpc.categories.key() });
    queryClient.invalidateQueries({ queryKey: orpc.transactions.key() });
    queryClient.invalidateQueries({ queryKey: orpc.analytics.key() });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateAll();
  return useMutation(orpc.categories.create.mutationOptions({ onSuccess: invalidate }));
}

export function useUpdateCategory() {
  const invalidate = useInvalidateAll();
  return useMutation(orpc.categories.update.mutationOptions({ onSuccess: invalidate }));
}

export function useDeleteCategory() {
  const invalidate = useInvalidateAll();
  return useMutation(orpc.categories.remove.mutationOptions({ onSuccess: invalidate }));
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { Product, StockMovement } from "@/types";

export function useStockLevels() {
  return useQuery({
    queryKey: ["stock", "levels"],
    queryFn: () => api.get<(Product & { lowStock: boolean })[]>("/stock"),
  });
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ["stock", "movements", productId],
    queryFn: () => api.get<StockMovement[]>(`/stock/movements${buildQuery({ productId })}`),
  });
}

export interface StockAdjustmentInput {
  productId: string;
  quantityDelta: number;
  reason: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StockAdjustmentInput) => api.post<Product>("/stock/adjustments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productGroups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateStockDisplayName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stockDisplayName }: { id: string; stockDisplayName: string }) =>
      api.post<Product>(`/stock/${id}/display-name`, { stockDisplayName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stock"] }),
  });
}

export function useReorderStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => api.post<void>("/stock/reorder", { order }),
    onMutate: async (order: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["stock", "levels"] });
      const previous = queryClient.getQueryData<(Product & { lowStock: boolean })[]>(["stock", "levels"]);
      if (previous) {
        const byId = new Map(previous.map((p) => [p.id, p]));
        const reordered = order.map((id) => byId.get(id)).filter((p): p is Product & { lowStock: boolean } => !!p);
        queryClient.setQueryData(["stock", "levels"], reordered);
      }
      return { previous };
    },
    onError: (_err, _order, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["stock", "levels"], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["stock"] }),
  });
}

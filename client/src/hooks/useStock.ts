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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

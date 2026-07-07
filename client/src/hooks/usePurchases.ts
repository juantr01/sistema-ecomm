import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { Purchase } from "@/types";

export interface PurchaseFilters {
  supplierId?: string;
  from?: string;
  to?: string;
}

export function usePurchases(filters: PurchaseFilters = {}) {
  return useQuery({
    queryKey: ["purchases", filters],
    queryFn: () => api.get<Purchase[]>(`/purchases${buildQuery(filters)}`),
  });
}

export interface CreatePurchaseInput {
  supplierId: string;
  purchaseDate: string;
  freight: number;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseInput) => api.post<Purchase>("/purchases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

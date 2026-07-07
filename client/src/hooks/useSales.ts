import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { Sale } from "@/types";

export interface SaleFilters {
  productId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export function useSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: () => api.get<Sale[]>(`/sales${buildQuery(filters)}`),
  });
}

export interface CreateSaleInput {
  productId: string;
  quantity: number;
  totalAmount: number;
  saleDate?: string;
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaleInput) => api.post<Sale>("/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

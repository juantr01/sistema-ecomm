import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CostGroup } from "@/types";

interface CostGroupList {
  groups: CostGroup[];
  ungroupedCount: number;
}

export function useCostGroups() {
  return useQuery({
    queryKey: ["cost-groups"],
    queryFn: () => api.get<CostGroupList>("/cost-groups"),
  });
}

// Custo dos produtos muda o lucro das vendas, então tudo que mostra lucro precisa recarregar
function useInvalidateCosts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["cost-groups"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };
}

export function useCreateCostGroup() {
  const invalidate = useInvalidateCosts();
  return useMutation({
    mutationFn: (data: { name: string; cost: number }) => api.post<CostGroup>("/cost-groups", data),
    onSuccess: invalidate,
  });
}

export function useUpdateCostGroup() {
  const invalidate = useInvalidateCosts();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; cost?: number; recalculateSales?: boolean } }) =>
      api.put<CostGroup>(`/cost-groups/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCostGroup() {
  const invalidate = useInvalidateCosts();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cost-groups/${id}`),
    onSuccess: invalidate,
  });
}

export function useAddCostGroupProducts() {
  const invalidate = useInvalidateCosts();
  return useMutation({
    mutationFn: ({ id, productIds }: { id: string; productIds: string[] }) =>
      api.post<{ added: number }>(`/cost-groups/${id}/products`, { productIds }),
    onSuccess: invalidate,
  });
}

export function useRemoveCostGroupProduct() {
  const invalidate = useInvalidateCosts();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => api.delete(`/cost-groups/${id}/products/${productId}`),
    onSuccess: invalidate,
  });
}

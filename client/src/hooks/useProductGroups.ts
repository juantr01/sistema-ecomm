import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductGroup } from "@/types";

export function useProductGroups() {
  return useQuery({
    queryKey: ["productGroups"],
    queryFn: () => api.get<ProductGroup[]>("/product-groups"),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["productGroups"] });
  queryClient.invalidateQueries({ queryKey: ["stock"] });
  queryClient.invalidateQueries({ queryKey: ["products"] });
}

export function useCreateProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<ProductGroup>("/product-groups", { name }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useRenameProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put<ProductGroup>(`/product-groups/${id}`, { name }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteProductGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/product-groups/${id}`),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useReorderProductGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: string[]) => api.post<void>("/product-groups/reorder", { order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productGroups"] }),
  });
}

export function useAddVariations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, sizes }: { groupId: string; sizes: string[] }) =>
      api.post(`/product-groups/${groupId}/variations`, { sizes }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useRemoveVariation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.delete(`/products/${productId}`),
    onSuccess: () => invalidateAll(queryClient),
  });
}

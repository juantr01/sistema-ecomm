import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { Supplier, SupplierDetail } from "@/types";

export function useSuppliers(search?: string) {
  return useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => api.get<Supplier[]>(`/suppliers${buildQuery({ search })}`),
  });
}

export function useSupplier(id?: string) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => api.get<SupplierDetail>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => api.post<Supplier>("/suppliers", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) => api.put<Supplier>(`/suppliers/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Estampa } from "@/types";

export type EstampaWithStatus = Estampa & { lowStock: boolean };

export function useEstampas() {
  return useQuery({
    queryKey: ["estampas"],
    queryFn: () => api.get<EstampaWithStatus[]>("/estampas"),
  });
}

export function useCreateEstampa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Estampa>) => api.post<Estampa>("/estampas", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estampas"] }),
  });
}

export function useUpdateEstampa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Estampa> }) => api.put<Estampa>(`/estampas/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estampas"] }),
  });
}

export function useDeleteEstampa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/estampas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["estampas"] }),
  });
}

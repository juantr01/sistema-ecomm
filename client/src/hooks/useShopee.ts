import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ShopeeStatus {
  connected: boolean;
  shopId?: string;
  shopName?: string;
  lastProductSyncAt?: string | null;
  lastOrderSyncAt?: string | null;
}

interface ShopeeSyncResult {
  products: { created: number; updated: number };
  orders: { created: number; skipped: number };
}

export function useShopeeStatus() {
  return useQuery({
    queryKey: ["shopee", "status"],
    queryFn: () => api.get<ShopeeStatus>("/shopee/status"),
  });
}

export function useConnectShopee() {
  return useMutation({
    mutationFn: () => api.get<{ url: string }>("/shopee/auth-url"),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}

export function useShopeeCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, shopId }: { code: string; shopId: string }) => api.post<void>("/shopee/callback", { code, shopId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopee", "status"] }),
  });
}

export function useShopeeSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ShopeeSyncResult>("/shopee/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopee", "status"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

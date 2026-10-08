import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ShopeeShopStatus {
  shopId: string;
  shopName: string | null;
  lastProductSyncAt: string | null;
  lastOrderSyncAt: string | null;
}

interface ShopeeStatus {
  connected: boolean;
  shops: ShopeeShopStatus[];
}

interface ShopeeSyncResult {
  products: { created: number; updated: number };
  orders: {
    found: number;
    created: number;
    updated: number;
    removed: number;
    skipped: { orderSn: string; reason: string }[];
  };
  // Lojas que falharam enquanto as outras sincronizaram
  failures: { shopName: string; message: string }[];
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

export function useDisconnectShopee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shopId: string) => api.delete<void>(`/shopee/connection/${shopId}`),
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

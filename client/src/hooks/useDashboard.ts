import { useQuery } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { useShopFilter } from "@/stores/shopFilterStore";
import { DashboardSummary } from "@/types";

export function useDashboardSummary() {
  const shopId = useShopFilter();
  return useQuery({
    queryKey: ["dashboard", "summary", shopId],
    queryFn: () => api.get<DashboardSummary>(`/dashboard/summary${buildQuery({ shopId })}`),
  });
}

export interface RevenueTrendPoint {
  date: string;
  totalAmount: number;
  profit: number;
}

export function useRevenueTrend(days = 30) {
  const shopId = useShopFilter();
  return useQuery({
    queryKey: ["dashboard", "revenue-trend", days, shopId],
    queryFn: () => api.get<RevenueTrendPoint[]>(`/dashboard/revenue-trend${buildQuery({ days, shopId })}`),
  });
}

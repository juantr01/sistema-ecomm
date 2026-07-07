import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/types";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
  });
}

export interface RevenueTrendPoint {
  date: string;
  totalAmount: number;
  profit: number;
}

export function useRevenueTrend(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "revenue-trend", days],
    queryFn: () => api.get<RevenueTrendPoint[]>(`/dashboard/revenue-trend?days=${days}`),
  });
}

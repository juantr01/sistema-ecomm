import { useQuery } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { useShopFilter } from "@/stores/shopFilterStore";
import { ExpenseBySupplierReport, Product, SalesSummaryReport, TopProductReport } from "@/types";

export interface ReportRange {
  from?: string;
  to?: string;
}

export function useSalesSummaryReport(range: ReportRange) {
  const shopId = useShopFilter();
  return useQuery({
    queryKey: ["reports", "sales-summary", range, shopId],
    queryFn: () => api.get<SalesSummaryReport>(`/reports/sales-summary${buildQuery({ ...range, shopId })}`),
  });
}

export function useTopProductsReport(range: ReportRange, limit = 10) {
  const shopId = useShopFilter();
  return useQuery({
    queryKey: ["reports", "top-products", range, limit, shopId],
    queryFn: () => api.get<TopProductReport[]>(`/reports/top-products${buildQuery({ ...range, limit, shopId })}`),
  });
}

export function useExpensesBySupplierReport(range: ReportRange) {
  return useQuery({
    queryKey: ["reports", "expenses-by-supplier", range],
    queryFn: () => api.get<ExpenseBySupplierReport[]>(`/reports/expenses-by-supplier${buildQuery(range)}`),
  });
}

export function useLowStockReport() {
  return useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: () => api.get<Product[]>("/reports/low-stock"),
  });
}

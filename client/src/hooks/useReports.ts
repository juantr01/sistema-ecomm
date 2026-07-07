import { useQuery } from "@tanstack/react-query";
import { api, buildQuery } from "@/lib/api";
import { ExpenseBySupplierReport, Product, SalesSummaryReport, TopProductReport } from "@/types";

export interface ReportRange {
  from?: string;
  to?: string;
}

export function useSalesSummaryReport(range: ReportRange) {
  return useQuery({
    queryKey: ["reports", "sales-summary", range],
    queryFn: () => api.get<SalesSummaryReport>(`/reports/sales-summary${buildQuery(range)}`),
  });
}

export function useTopProductsReport(range: ReportRange, limit = 10) {
  return useQuery({
    queryKey: ["reports", "top-products", range, limit],
    queryFn: () => api.get<TopProductReport[]>(`/reports/top-products${buildQuery({ ...range, limit })}`),
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

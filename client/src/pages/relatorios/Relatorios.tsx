import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { DateRangeFilter, getDefaultRange } from "@/components/shared/DateRangeFilter";
import {
  useSalesSummaryReport,
  useTopProductsReport,
  useExpensesBySupplierReport,
  useLowStockReport,
} from "@/hooks/useReports";
import { formatCurrency } from "@/lib/format";

export default function Relatorios() {
  const [range, setRange] = useState(getDefaultRange());

  const { data: summary, isLoading: loadingSummary } = useSalesSummaryReport(range);
  const { data: topProducts, isLoading: loadingTop } = useTopProductsReport(range, 10);
  const { data: bySupplier, isLoading: loadingSupplier } = useExpensesBySupplierReport(range);
  const { data: lowStock, isLoading: loadingLowStock } = useLowStockReport();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Relatórios</h1>
      </div>

      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total vendido" value={loadingSummary ? "—" : formatCurrency(summary!.totalVendido)} />
        <StatCard label="Total gasto" value={loadingSummary ? "—" : formatCurrency(summary!.totalGasto)} tone="warning" />
        <StatCard
          label="Lucro bruto"
          value={loadingSummary ? "—" : formatCurrency(summary!.lucroBruto)}
          tone={!loadingSummary && summary!.lucroBruto < 0 ? "destructive" : "success"}
          hint="Faturamento − custo dos produtos vendidos"
        />
        <StatCard
          label="Lucro líquido"
          value={loadingSummary ? "—" : formatCurrency(summary!.lucroLiquido)}
          tone={!loadingSummary && summary!.lucroLiquido < 0 ? "destructive" : "success"}
          hint="Lucro bruto − despesas operacionais"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTop ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            ) : !topProducts || topProducts.length === 0 ? (
              <EmptyState title="Nenhuma venda no período" className="py-10" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((item) => (
                    <TableRow key={item.product?.id}>
                      <TableCell className="font-medium">{item.product?.name}</TableCell>
                      <TableCell>{item.quantitySold}</TableCell>
                      <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell className={item.profit >= 0 ? "text-success" : "text-destructive"}>
                        {formatCurrency(item.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos por fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSupplier ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            ) : !bySupplier || bySupplier.length === 0 ? (
              <EmptyState title="Nenhuma compra no período" className="py-10" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Total gasto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bySupplier.map((item) => (
                    <TableRow key={item.supplierId}>
                      <TableCell className="font-medium">{item.supplierName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos com pouco estoque</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLowStock ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
          ) : !lowStock || lowStock.length === 0 ? (
            <EmptyState title="Nenhum produto com estoque baixo" className="py-10" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>{p.stockQuantity}</TableCell>
                    <TableCell className="text-muted-foreground">{p.minStock}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Baixo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/format";
import { DashboardSummary } from "@/types";

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        {item.quantitySold} un. · {formatCurrency(item.totalAmount)}
      </p>
    </div>
  );
}

export function TopProductsChart({
  data,
  loading,
}: {
  data?: DashboardSummary["produtosMaisVendidos"];
  loading?: boolean;
}) {
  const chartData = (data ?? [])
    .filter((d) => d.product)
    .map((d) => ({
      name: d.product!.name,
      quantitySold: d.quantitySold,
      totalAmount: d.totalAmount,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos mais vendidos (mês)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : chartData.length === 0 ? (
          <EmptyState title="Nenhuma venda este mês" className="py-10" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }} barCategoryGap={10}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
              <Bar dataKey="quantitySold" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

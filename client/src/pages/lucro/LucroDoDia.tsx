import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProductThumb } from "@/components/shared/ProductThumb";
import { useDayOrders } from "@/hooks/useDashboard";
import { useShopeeStatus } from "@/hooks/useShopee";
import { formatCurrency, toInputDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toInputDate(d);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(value));
}

function profitClass(value: number) {
  return value >= 0 ? "text-success" : "text-destructive";
}

// Conferência do card "Lucro do dia": cada pedido com recebido, custo e lucro
export default function LucroDoDia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = toInputDate(new Date());
  const date = searchParams.get("data") || today;
  const setDate = (value: string) => setSearchParams(value && value !== today ? { data: value } : {});

  const { data, isLoading } = useDayOrders(date);
  const { data: shopeeStatus } = useShopeeStatus();
  const shopNames = new Map(shopeeStatus?.shops.map((s) => [s.shopId, s.shopName ?? s.shopId]));

  const totals = data?.totals;
  const itemsWithoutCost = data?.orders.flatMap((o) => o.items).filter((i) => i.unitCost === 0).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Lucro do dia</h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" title="Dia anterior" onClick={() => setDate(shiftDate(date, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Button
            variant="outline"
            size="icon"
            title="Próximo dia"
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= today}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pedidos", value: totals ? String(totals.orders) : "—" },
          { label: "Recebido", value: totals ? formatCurrency(totals.totalAmount) : "—" },
          { label: "Custo", value: totals ? formatCurrency(totals.cost) : "—" },
          { label: "Lucro", value: totals ? formatCurrency(totals.profit) : "—", className: totals && profitClass(totals.profit) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 p-3 sm:p-4">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{stat.label}</span>
              <span className={cn("text-lg font-semibold tabular-nums", stat.className)}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {itemsWithoutCost > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {itemsWithoutCost} item(ns) sem custo cadastrado: o lucro deles está igual ao valor recebido. Cadastre o custo em Custos.
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : !data?.orders.length ? (
          <EmptyState icon={<ReceiptText className="h-8 w-8" />} title="Nenhum pedido neste dia" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.orderSn ?? order.items[0].saleId} className="align-top">
                  <TableCell className="text-muted-foreground">{formatTime(order.saleDate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-mono text-xs">{order.orderSn ?? "Venda manual"}</span>
                      {order.shopeeShopId && shopNames.has(order.shopeeShopId) && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {shopNames.get(order.shopeeShopId)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ul className="space-y-1.5">
                      {order.items.map((item) => (
                        <li key={item.saleId} className="flex gap-2 text-sm">
                          <ProductThumb src={item.imageUrl} />
                          <div className="min-w-0">
                            <span className="font-medium">{item.quantity}x</span> {item.productName}
                            {item.variationName && <span className="text-muted-foreground"> · {item.variationName}</span>}
                            <span className="block text-xs text-muted-foreground">
                              recebido {formatCurrency(item.totalAmount)} · custo{" "}
                              {item.unitCost === 0 ? (
                                <span className="text-amber-500">não cadastrado</span>
                              ) : (
                                `${formatCurrency(item.unitCost * item.quantity)} (${item.quantity} × ${formatCurrency(item.unitCost)})`
                              )}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(order.cost)}</TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", profitClass(order.profit))}>
                    {formatCurrency(order.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/shared/SearchInput";
import { DateRange } from "@/components/shared/DateRangeFilter";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSales, useDeleteSale } from "@/hooks/useSales";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

type Period = "dia" | "semana" | "mes" | "todas";

const PERIODS: { value: Period; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "todas", label: "Todas" },
];

// Intervalo do período que contém a data de referência (semana de segunda a domingo)
function getPeriodRange(period: Period, reference: string): DateRange {
  if (period === "todas") return {};
  const ref = new Date(`${reference}T00:00:00`);
  if (period === "dia") return { from: reference, to: reference };
  if (period === "semana") {
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: toInputDate(monday), to: toInputDate(sunday) };
  }
  return {
    from: toInputDate(new Date(ref.getFullYear(), ref.getMonth(), 1)),
    to: toInputDate(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)),
  };
}

export default function VendasLista() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("todas");
  const [reference, setReference] = useState(() => toInputDate(new Date()));

  const range = getPeriodRange(period, reference);
  const { data: sales, isLoading } = useSales({ search: search || undefined, ...range });
  const totalAmount = sales?.reduce((sum, s) => sum + Number(s.totalAmount), 0) ?? 0;
  const totalProfit = sales?.reduce((sum, s) => sum + Number(s.profit), 0) ?? 0;
  const deleteSale = useDeleteSale();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSale.mutateAsync(deleteId);
      toast({ title: "Venda excluída e estoque estornado", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível excluir a venda",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Vendas</h1>
        <Button onClick={() => navigate("/vendas/novo")}>
          <Plus className="h-4 w-4" /> Nova venda
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por produto ou SKU..."
          className="w-full sm:w-64"
        />
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={period === p.value ? "default" : "outline"}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
        {period !== "todas" && (
          <Input
            type="date"
            className="w-40"
            value={reference}
            onChange={(e) => e.target.value && setReference(e.target.value)}
          />
        )}
      </div>

      {sales && sales.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {sales.length} {sales.length === 1 ? "venda" : "vendas"} · Total {formatCurrency(totalAmount)} · Lucro{" "}
          {formatCurrency(totalProfit)}
        </p>
      )}

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : !sales || sales.length === 0 ? (
          <EmptyState icon={<Wallet className="h-8 w-8" />} title="Nenhuma venda registrada" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor vendido</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-muted-foreground">{formatDate(sale.saleDate)}</TableCell>
                  <TableCell className="font-medium">{sale.product?.name}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(sale.totalAmount))}</TableCell>
                  <TableCell className={Number(sale.profit) >= 0 ? "text-success" : "text-destructive"}>
                    {formatCurrency(Number(sale.profit))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(sale.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir venda?"
        description="O estoque do produto será estornado (quantidade devolvida)."
        onConfirm={handleDelete}
        loading={deleteSale.isPending}
      />
    </div>
  );
}

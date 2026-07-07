import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Wallet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSales, useDeleteSale } from "@/hooks/useSales";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

export default function VendasLista() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: sales, isLoading } = useSales({ search: search || undefined });
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

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por produto ou SKU..."
        className="w-full sm:w-64"
      />

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

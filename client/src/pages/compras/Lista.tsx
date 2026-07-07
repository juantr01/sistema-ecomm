import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePurchases, useDeletePurchase } from "@/hooks/usePurchases";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

export default function ComprasLista() {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: suppliers } = useSuppliers();
  const { data: purchases, isLoading } = usePurchases({ supplierId: supplierId === "all" ? undefined : supplierId });
  const deletePurchase = useDeletePurchase();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePurchase.mutateAsync(deleteId);
      toast({ title: "Compra excluída", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível excluir a compra",
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
        <h1 className="text-xl font-semibold">Compras</h1>
        <Button onClick={() => navigate("/compras/novo")}>
          <Plus className="h-4 w-4" /> Nova compra
        </Button>
      </div>

      <Select value={supplierId} onValueChange={setSupplierId}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Fornecedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os fornecedores</SelectItem>
          {suppliers?.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : !purchases || purchases.length === 0 ? (
          <EmptyState icon={<ShoppingCart className="h-8 w-8" />} title="Nenhuma compra registrada" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Frete</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const itemsTotal = purchase.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-muted-foreground">{formatDate(purchase.purchaseDate)}</TableCell>
                    <TableCell className="font-medium">{purchase.supplier?.name}</TableCell>
                    <TableCell>
                      {purchase.items.map((i) => `${i.product?.name} (${i.quantity})`).join(", ")}
                    </TableCell>
                    <TableCell>{formatCurrency(Number(purchase.freight))}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(itemsTotal + Number(purchase.freight))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(purchase.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir compra?"
        description="O estoque adicionado por esta compra será estornado. O custo médio do produto não é revertido."
        onConfirm={handleDelete}
        loading={deletePurchase.isPending}
      />
    </div>
  );
}

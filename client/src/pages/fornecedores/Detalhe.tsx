import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { useSupplier } from "@/hooks/useSuppliers";
import { formatCurrency, formatDate } from "@/lib/format";

export default function FornecedorDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id);

  if (isLoading || !supplier) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{supplier.name}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/fornecedores/${supplier.id}/editar`)}>
          <Pencil className="h-4 w-4" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total comprado (itens)" value={String(supplier.totalItemsPurchased)} />
        <StatCard label="Total gasto" value={formatCurrency(supplier.totalSpent)} />
        <StatCard label="Compras realizadas" value={String(supplier.purchases.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados de contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">WhatsApp</p>
            <p>{supplier.whatsapp ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cidade</p>
            <p>{supplier.city ?? "—"}</p>
          </div>
          {supplier.notes && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Observações</p>
              <p>{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de compras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {supplier.purchases.length === 0 ? (
            <EmptyState title="Nenhuma compra registrada" className="py-10" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Frete</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchases.map((purchase) => {
                  const itemsTotal = purchase.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-muted-foreground">{formatDate(purchase.purchaseDate)}</TableCell>
                      <TableCell>{purchase.items.map((i) => i.product?.name).join(", ")}</TableCell>
                      <TableCell>{formatCurrency(Number(purchase.freight))}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(itemsTotal + Number(purchase.freight))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

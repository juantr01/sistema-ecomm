import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ImageOff, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/stores/toastStore";

export default function ProdutosLista() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [lowStock, setLowStock] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId === "all" ? undefined : categoryId,
    lowStock: lowStock || undefined,
    active: true,
  });
  const deleteProduct = useDeleteProduct();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteProduct.mutateAsync(deleteId);
      toast({ title: "Produto arquivado", variant: "success" });
    } catch {
      toast({ title: "Não foi possível excluir o produto", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Produtos</h1>
        <Button onClick={() => navigate("/produtos/novo")}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou SKU..." className="w-64" />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={lowStock ? "default" : "outline"} size="sm" onClick={() => setLowStock((v) => !v)}>
          Estoque baixo
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : !products || products.length === 0 ? (
          <EmptyState
            icon={<PackageSearch className="h-8 w-8" />}
            title="Nenhum produto encontrado"
            description="Ajuste os filtros ou cadastre um novo produto."
            action={
              <Button onClick={() => navigate("/produtos/novo")}>
                <Plus className="h-4 w-4" /> Novo produto
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLow = product.stockQuantity <= product.minStock;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-9 w-9 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.color && <span className="text-muted-foreground"> · {product.color}</span>}
                      {product.size && <span className="text-muted-foreground"> · {product.size}</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="text-muted-foreground">{product.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{product.stockQuantity}</span>
                        {isLow && <Badge variant="destructive">Baixo</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/produtos/${product.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        title="Arquivar produto?"
        description="O produto deixará de aparecer nas listagens, mas o histórico de vendas e compras é preservado."
        confirmLabel="Arquivar"
        onConfirm={handleDelete}
        loading={deleteProduct.isPending}
      />
    </div>
  );
}

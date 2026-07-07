import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSuppliers, useDeleteSupplier } from "@/hooks/useSuppliers";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

export default function FornecedoresLista() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useSuppliers(search || undefined);
  const deleteSupplier = useDeleteSupplier();

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteSupplier.mutateAsync(deleteId);
      toast({ title: "Fornecedor excluído", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível excluir o fornecedor",
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
        <h1 className="text-xl font-semibold">Fornecedores</h1>
        <Button onClick={() => navigate("/fornecedores/novo")}>
          <Plus className="h-4 w-4" /> Novo fornecedor
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome..." className="w-full sm:w-64" />

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : !suppliers || suppliers.length === 0 ? (
          <EmptyState icon={<Truck className="h-8 w-8" />} title="Nenhum fornecedor cadastrado" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/fornecedores/${s.id}`)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.whatsapp ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.city ?? "—"}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/fornecedores/${s.id}/editar`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
        title="Excluir fornecedor?"
        description="Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleteSupplier.isPending}
      />
    </div>
  );
}

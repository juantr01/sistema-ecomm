import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, ListPlus, Pencil, Plus, Tags, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AddVariationsDialog } from "@/components/custos/AddVariationsDialog";
import { GroupVariationsDialog } from "@/components/custos/GroupVariationsDialog";
import { useCostGroups, useCreateCostGroup, useUpdateCostGroup, useDeleteCostGroup } from "@/hooks/useCostGroups";
import { useShopeeStatus } from "@/hooks/useShopee";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { CostGroup } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
  cost: z.coerce.number().min(0, "Informe um custo válido"),
  recalculateSales: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Custos() {
  // null = fechado; "new" = criando; grupo = editando
  const [formGroup, setFormGroup] = useState<CostGroup | "new" | null>(null);
  const [addTo, setAddTo] = useState<CostGroup | null>(null);
  const [viewGroup, setViewGroup] = useState<CostGroup | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<CostGroup | null>(null);

  const { data, isLoading } = useCostGroups();
  const createGroup = useCreateCostGroup();
  const updateGroup = useUpdateCostGroup();
  const removeGroup = useDeleteCostGroup();
  const { data: shopeeStatus } = useShopeeStatus();
  const shopNames = new Map(shopeeStatus?.shops.map((s) => [s.shopId, s.shopName ?? s.shopId]));

  const editing = formGroup && formGroup !== "new" ? formGroup : null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (formGroup === "new") reset({ name: "", cost: undefined as unknown as number, recalculateSales: false });
    else if (formGroup) reset({ name: formGroup.name, cost: Number(formGroup.cost), recalculateSales: false });
  }, [formGroup, reset]);

  const costChanged = !!editing && Number(watch("cost")) !== Number(editing.cost);

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateGroup.mutateAsync({ id: editing.id, data: values });
        toast({ title: "Grupo atualizado", variant: "success" });
      } else {
        await createGroup.mutateAsync({ name: values.name, cost: values.cost });
        toast({ title: "Grupo criado", description: 'Agora clique em "Adicionar variações".', variant: "success" });
      }
      setFormGroup(null);
    } catch (err) {
      toast({
        title: "Não foi possível salvar o grupo",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteGroup) return;
    try {
      await removeGroup.mutateAsync(deleteGroup.id);
      toast({ title: "Grupo excluído", variant: "success" });
    } catch (err) {
      toast({
        title: "Não foi possível excluir o grupo",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDeleteGroup(null);
    }
  }

  const groups = data?.groups ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Custos</h1>
        <Button onClick={() => setFormGroup("new")}>
          <Plus className="h-4 w-4" /> Novo grupo de custo
        </Button>
      </div>

      {data && (
        <div
          className={
            data.ungroupedCount > 0
              ? "flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-500"
              : "flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success"
          }
        >
          {data.ungroupedCount > 0 ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {data.ungroupedCount} variação(ões) ainda sem grupo de custo.
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Todas as variações estão em um grupo de custo.
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-8 w-8" />}
            title="Nenhum grupo de custo"
            description='Crie um grupo (ex.: "Moletom Adulto" com custo R$ 39,00) e adicione as variações a ele.'
            action={
              <Button onClick={() => setFormGroup("new")}>
                <Plus className="h-4 w-4" /> Novo grupo de custo
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Variações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{formatCurrency(Number(group.cost))}</TableCell>
                  <TableCell>
                    <button type="button" className="text-primary hover:underline" onClick={() => setViewGroup(group)}>
                      {group.variationCount} variação(ões)
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" onClick={() => setAddTo(group)}>
                        <ListPlus className="h-4 w-4" /> Adicionar variações
                      </Button>
                      <Button variant="ghost" size="icon" title="Ver variações" onClick={() => setViewGroup(group)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => setFormGroup(group)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteGroup(group)}>
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

      <Dialog open={!!formGroup} onOpenChange={(open) => !open && setFormGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar grupo de custo" : "Novo grupo de custo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex.: Moletom Adulto" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Custo por unidade (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="39,00" {...register("cost")} />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
            </div>
            {costChanged && (
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register("recalculateSales")} />
                <span>
                  Recalcular também o lucro das vendas já registradas
                  <span className="block text-xs text-muted-foreground">
                    Sem marcar, o novo custo vale só para as próximas vendas.
                  </span>
                </span>
              </label>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormGroup(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
                {createGroup.isPending || updateGroup.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddVariationsDialog group={addTo} shopNames={shopNames} onOpenChange={(open) => !open && setAddTo(null)} />
      <GroupVariationsDialog group={viewGroup} shopNames={shopNames} onOpenChange={(open) => !open && setViewGroup(null)} />

      <ConfirmDialog
        open={!!deleteGroup}
        onOpenChange={(open) => !open && setDeleteGroup(null)}
        title={`Excluir o grupo ${deleteGroup?.name ?? ""}?`}
        description="As variações saem do grupo e mantêm o último custo. As vendas não são alteradas."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={removeGroup.isPending}
      />
    </div>
  );
}

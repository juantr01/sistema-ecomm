import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SlidersHorizontal, GripVertical, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/shared/Combobox";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useStockLevels, useStockMovements, useAdjustStock, useUpdateStockDisplayName, useReorderStock } from "@/hooks/useStock";
import { useEstampas, useCreateEstampa, useUpdateEstampa, useDeleteEstampa, type EstampaWithStatus } from "@/hooks/useEstampas";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE: "Compra",
  SALE: "Venda",
  ADJUSTMENT: "Ajuste",
};

const adjustmentSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  quantityDelta: z.coerce.number().int().refine((v) => v !== 0, "Informe um valor diferente de zero"),
  reason: z.string().min(1, "Informe o motivo"),
});

type AdjustmentValues = z.infer<typeof adjustmentSchema>;
type StockLevel = Product & { lowStock: boolean };

function StockDisplayNameCell({ product }: { product: StockLevel }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.stockDisplayName ?? product.name);
  const updateDisplayName = useUpdateStockDisplayName();

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(product.stockDisplayName ?? product.name);
      setEditing(false);
      return;
    }
    try {
      await updateDisplayName.mutateAsync({ id: product.id, stockDisplayName: trimmed });
      setEditing(false);
    } catch {
      toast({ title: "Não foi possível salvar o nome de exibição", variant: "destructive" });
    }
  }

  function cancel() {
    setValue(product.stockDisplayName ?? product.name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-8"
        />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={save}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={cancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const displayName = product.stockDisplayName ?? product.name;
  const hasCustomName = !!product.stockDisplayName && product.stockDisplayName !== product.name;

  return (
    <button
      type="button"
      className="group flex flex-wrap items-center gap-1.5 text-left"
      onClick={() => setEditing(true)}
    >
      <span className="font-medium">{displayName}</span>
      <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      {hasCustomName && <span className="text-xs text-muted-foreground">({product.name})</span>}
    </button>
  );
}

function SortableStockRow({ product, dragDisabled }: { product: StockLevel; dragDisabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <button
          type="button"
          className={cn(
            "flex h-6 w-6 cursor-grab items-center justify-center text-muted-foreground touch-none",
            dragDisabled && "cursor-not-allowed opacity-30"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <StockDisplayNameCell product={product} />
      </TableCell>
      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
      <TableCell className="text-muted-foreground">{product.color ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{product.size ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{product.pattern ?? "—"}</TableCell>
      <TableCell>{product.stockQuantity}</TableCell>
      <TableCell className="text-muted-foreground">{product.minStock}</TableCell>
      <TableCell>
        {product.lowStock ? <Badge variant="destructive">Estoque baixo</Badge> : <Badge variant="success">OK</Badge>}
      </TableCell>
    </TableRow>
  );
}

function RoupaSection() {
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: levels, isLoading: loadingLevels } = useStockLevels();
  const { data: movements, isLoading: loadingMovements } = useStockMovements();
  const adjustStock = useAdjustStock();
  const reorderStock = useReorderStock();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentValues>({ resolver: zodResolver(adjustmentSchema) });

  const q = search.trim().toLowerCase();
  const searchActive = q.length > 0;
  const filteredLevels = (levels ?? []).filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.color ?? "").toLowerCase().includes(q) ||
      (p.size ?? "").toLowerCase().includes(q) ||
      (p.pattern ?? "").toLowerCase().includes(q) ||
      (p.stockDisplayName ?? "").toLowerCase().includes(q)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !levels) return;
    const oldIndex = levels.findIndex((p) => p.id === active.id);
    const newIndex = levels.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(levels, oldIndex, newIndex);
    reorderStock.mutate(reordered.map((p) => p.id));
  }

  async function onAdjust(values: AdjustmentValues) {
    try {
      await adjustStock.mutateAsync(values);
      toast({ title: "Estoque ajustado", variant: "success" });
      reset();
      setAdjustOpen(false);
    } catch (err) {
      toast({
        title: "Não foi possível ajustar o estoque",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setAdjustOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Ajustar estoque
        </Button>
      </div>

      <Tabs defaultValue="niveis">
        <TabsList>
          <TabsTrigger value="niveis">Níveis atuais</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="niveis" className="space-y-3">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome, SKU, cor, tamanho ou estampa..."
              className="w-full sm:w-72"
            />
            {searchActive && (
              <p className="text-xs text-muted-foreground">Limpe a busca para reordenar arrastando.</p>
            )}
          </div>
          <div className="rounded-lg border bg-card">
            {loadingLevels ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            ) : filteredLevels.length === 0 ? (
              <EmptyState
                title="Nenhum produto com estoque próprio"
                description='Ative "Este produto tem estoque físico próprio" na edição do produto para ele aparecer aqui. Produtos de dropshipping ficam de fora por padrão.'
              />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Estampa</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext items={filteredLevels.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                      {filteredLevels.map((p) => (
                        <SortableStockRow key={p.id} product={p} dragDisabled={searchActive} />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <div className="rounded-lg border bg-card">
            {loadingMovements ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            ) : !movements || movements.length === 0 ? (
              <EmptyState title="Nenhuma movimentação registrada" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground">{formatDateTime(m.createdAt)}</TableCell>
                      <TableCell className="font-medium">{m.product?.name}</TableCell>
                      <TableCell>{MOVEMENT_LABELS[m.type]}</TableCell>
                      <TableCell className={m.quantityDelta < 0 ? "text-destructive" : "text-success"}>
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.reason ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAdjust)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione o produto"
                    options={(levels ?? []).map((p) => ({
                      value: p.id,
                      label: `${p.stockDisplayName ?? p.name} (${p.sku})`,
                    }))}
                  />
                )}
              />
              {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade (use negativo para retirar)</Label>
              <Input type="number" step={1} {...register("quantityDelta")} />
              {errors.quantityDelta && <p className="text-xs text-destructive">{errors.quantityDelta.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input placeholder="Ex: perda, quebra, contagem de inventário" {...register("reason")} />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={adjustStock.isPending}>
                {adjustStock.isPending ? "Salvando..." : "Confirmar ajuste"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const estampaSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  quantity: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

type EstampaValues = z.infer<typeof estampaSchema>;

function estampaStatus(e: EstampaWithStatus) {
  if (e.quantity <= 0) return { label: "Preciso", variant: "destructive" as const };
  if (e.lowStock) return { label: "Estoque baixo", variant: "outline" as const };
  return { label: "Tenho", variant: "success" as const };
}

function EstampaSection() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EstampaWithStatus | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: estampas, isLoading } = useEstampas();
  const createEstampa = useCreateEstampa();
  const updateEstampa = useUpdateEstampa();
  const deleteEstampa = useDeleteEstampa();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstampaValues>({
    resolver: zodResolver(estampaSchema),
    defaultValues: { quantity: 0, minStock: 0 },
  });

  useEffect(() => {
    if (formOpen) {
      reset(
        editing
          ? { name: editing.name, quantity: editing.quantity, minStock: editing.minStock, notes: editing.notes ?? "" }
          : { name: "", quantity: 0, minStock: 0, notes: "" }
      );
    }
  }, [formOpen, editing, reset]);

  const q = search.trim().toLowerCase();
  const filtered = (estampas ?? []).filter((e) => !q || e.name.toLowerCase().includes(q));

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(e: EstampaWithStatus) {
    setEditing(e);
    setFormOpen(true);
  }

  async function onSubmit(values: EstampaValues) {
    try {
      if (editing) {
        await updateEstampa.mutateAsync({ id: editing.id, data: values });
        toast({ title: "Estampa atualizada", variant: "success" });
      } else {
        await createEstampa.mutateAsync(values);
        toast({ title: "Estampa adicionada ao estoque", variant: "success" });
      }
      setFormOpen(false);
    } catch (err) {
      toast({
        title: "Não foi possível salvar a estampa",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEstampa.mutateAsync(deleteId);
      toast({ title: "Estampa removida", variant: "success" });
    } catch {
      toast({ title: "Não foi possível remover a estampa", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar estampa..." className="w-full sm:w-72" />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova estampa
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma estampa cadastrada"
            description="Cadastre as estampas que você tem prontas e as que precisa repor."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Nova estampa
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estampa</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const status = estampaStatus(e);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{e.minStock}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar estampa" : "Nova estampa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min={0} step={1} {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Estoque mínimo</Label>
                <Input type="number" min={0} step={1} {...register("minStock")} />
                {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={3} {...register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEstampa.isPending || updateEstampa.isPending}>
                {createEstampa.isPending || updateEstampa.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover estampa?"
        description="Essa estampa será removida do seu controle de estoque."
        confirmLabel="Remover"
        onConfirm={handleDelete}
        loading={deleteEstampa.isPending}
      />
    </div>
  );
}

export default function Estoque() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Estoque Próprio</h1>

      <Tabs defaultValue="roupa">
        <TabsList>
          <TabsTrigger value="roupa">Roupa</TabsTrigger>
          <TabsTrigger value="estampa">Estampa</TabsTrigger>
        </TabsList>

        <TabsContent value="roupa">
          <RoupaSection />
        </TabsContent>

        <TabsContent value="estampa">
          <EstampaSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

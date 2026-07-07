import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/shared/Combobox";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { useStockLevels, useStockMovements, useAdjustStock } from "@/hooks/useStock";
import { useProducts } from "@/hooks/useProducts";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

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

export default function Estoque() {
  const [search, setSearch] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: levels, isLoading: loadingLevels } = useStockLevels();
  const { data: movements, isLoading: loadingMovements } = useStockMovements();
  const { data: products } = useProducts({ active: true });
  const adjustStock = useAdjustStock();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentValues>({ resolver: zodResolver(adjustmentSchema) });

  const filteredLevels = (levels ?? []).filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Estoque</h1>
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
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome ou SKU..."
            className="w-full sm:w-64"
          />
          <div className="rounded-lg border bg-card">
            {loadingLevels ? (
              <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
            ) : filteredLevels.length === 0 ? (
              <EmptyState title="Nenhum produto encontrado" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLevels.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                      <TableCell>{p.stockQuantity}</TableCell>
                      <TableCell className="text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell>
                        {p.lowStock ? <Badge variant="destructive">Estoque baixo</Badge> : <Badge variant="success">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    options={(products ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
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

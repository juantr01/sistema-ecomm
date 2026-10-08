import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { CostProductRow } from "@/components/custos/CostProductRow";
import { useProducts } from "@/hooks/useProducts";
import { useAddCostGroupProducts } from "@/hooks/useCostGroups";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { CostGroup } from "@/types";

interface AddProductsDialogProps {
  group: CostGroup | null;
  shopNames: Map<string, string>;
  onOpenChange: (open: boolean) => void;
}

export function AddProductsDialog({ group, shopNames, onOpenChange }: AddProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [onlyUngrouped, setOnlyUngrouped] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    withoutCostGroup: onlyUngrouped ? "true" : undefined,
    active: true,
  }, { enabled: !!group });
  const addProducts = useAddCostGroupProducts();

  // Cada vez que abre para um grupo, começa do zero
  useEffect(() => {
    setSearch("");
    setOnlyUngrouped(true);
    setSelected(new Set());
  }, [group?.id]);

  // Produtos que já estão neste grupo não aparecem para adicionar de novo
  const visible = useMemo(() => (products ?? []).filter((p) => p.costGroupId !== group?.id), [products, group?.id]);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of visible) {
        if (allVisibleSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  async function handleAdd() {
    if (!group || selected.size === 0) return;
    try {
      const { added } = await addProducts.mutateAsync({ id: group.id, productIds: [...selected] });
      toast({
        title: `${added} produto(s) adicionado(s) a ${group.name}`,
        description: "O custo e o lucro das vendas desses produtos foram atualizados.",
        variant: "success",
      });
      // Continua aberto para a próxima busca; os adicionados somem da lista "sem grupo"
      setSelected(new Set());
      setSearch("");
    } catch (err) {
      toast({
        title: "Não foi possível adicionar os produtos",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar produtos a {group?.name}</DialogTitle>
          <DialogDescription>
            Os produtos selecionados passam a ter custo de {group ? formatCurrency(Number(group.cost)) : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder='Buscar pelo título ou SKU, ex.: "Moletom"' />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={onlyUngrouped}
                onChange={(e) => setOnlyUngrouped(e.target.checked)}
              />
              Só produtos sem grupo
            </label>
            <Button type="button" variant="outline" size="sm" onClick={toggleAllVisible} disabled={visible.length === 0}>
              {allVisibleSelected ? "Desmarcar todos" : `Selecionar todos (${visible.length})`}
            </Button>
          </div>

          <div className="max-h-[45vh] divide-y overflow-y-auto rounded-md border">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
            ) : visible.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {onlyUngrouped ? "Nenhum produto sem grupo encontrado." : "Nenhum produto encontrado."}
              </p>
            ) : (
              visible.map((product) => (
                <label key={product.id} className="block cursor-pointer hover:bg-accent/50">
                  <CostProductRow
                    product={product}
                    shopName={product.shopeeShopId ? shopNames.get(product.shopeeShopId) : undefined}
                    showCurrentGroup
                    leading={
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-primary"
                        checked={selected.has(product.id)}
                        onChange={() => toggle(product.id)}
                      />
                    }
                  />
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={handleAdd} disabled={selected.size === 0 || addProducts.isPending}>
            {addProducts.isPending ? "Adicionando..." : `Adicionar ${selected.size} produto(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

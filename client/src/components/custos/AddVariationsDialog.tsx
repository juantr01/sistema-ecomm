import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { CostVariationRow } from "@/components/custos/CostVariationRow";
import { useAddCostGroupVariations, useCostVariations } from "@/hooks/useCostGroups";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { CostGroup } from "@/types";

interface AddVariationsDialogProps {
  group: CostGroup | null;
  shopNames: Map<string, string>;
  onOpenChange: (open: boolean) => void;
}

export function AddVariationsDialog({ group, shopNames, onOpenChange }: AddVariationsDialogProps) {
  const [search, setSearch] = useState("");
  const [variationSearch, setVariationSearch] = useState("");
  const [onlyUngrouped, setOnlyUngrouped] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: variations, isLoading } = useCostVariations(
    {
      search: search || undefined,
      variationSearch: variationSearch || undefined,
      withoutGroup: onlyUngrouped ? "true" : undefined,
    },
    !!group
  );
  const addVariations = useAddCostGroupVariations();

  // Cada vez que abre para um grupo, começa do zero
  useEffect(() => {
    setSearch("");
    setVariationSearch("");
    setOnlyUngrouped(true);
    setSelected(new Set());
  }, [group?.id]);

  // Variações que já estão neste grupo não aparecem para adicionar de novo
  const visible = useMemo(() => (variations ?? []).filter((v) => v.costGroupId !== group?.id), [variations, group?.id]);
  const allVisibleSelected = visible.length > 0 && visible.every((v) => selected.has(v.id));

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
      for (const v of visible) {
        if (allVisibleSelected) next.delete(v.id);
        else next.add(v.id);
      }
      return next;
    });
  }

  async function handleAdd() {
    if (!group || selected.size === 0) return;
    try {
      const { added } = await addVariations.mutateAsync({ id: group.id, variationIds: [...selected] });
      toast({
        title: `${added} variação(ões) adicionada(s) a ${group.name}`,
        description: "O custo e o lucro das vendas dessas variações foram atualizados.",
        variant: "success",
      });
      // Continua aberto para a próxima busca; as adicionadas somem da lista "sem grupo"
      setSelected(new Set());
    } catch (err) {
      toast({
        title: "Não foi possível adicionar as variações",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar a {group?.name}</DialogTitle>
          <DialogDescription>
            As variações selecionadas passam a ter custo de {group ? formatCurrency(Number(group.cost)) : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <SearchInput value={search} onChange={setSearch} placeholder='Anúncio, ex.: "Moletom"' />
            <SearchInput value={variationSearch} onChange={setVariationSearch} placeholder='Variação, ex.: "anos" ou "GG"' />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={onlyUngrouped}
                onChange={(e) => setOnlyUngrouped(e.target.checked)}
              />
              Só variações sem grupo
            </label>
            <Button type="button" variant="outline" size="sm" onClick={toggleAllVisible} disabled={visible.length === 0}>
              {allVisibleSelected ? "Desmarcar todas" : `Selecionar todas (${visible.length})`}
            </Button>
          </div>

          <div className="max-h-[45vh] divide-y overflow-y-auto rounded-md border">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
            ) : visible.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {onlyUngrouped ? "Nenhuma variação sem grupo encontrada." : "Nenhuma variação encontrada."}
              </p>
            ) : (
              visible.map((variation) => (
                <label key={variation.id} className="block cursor-pointer hover:bg-accent/50">
                  <CostVariationRow
                    variation={variation}
                    shopName={variation.product.shopeeShopId ? shopNames.get(variation.product.shopeeShopId) : undefined}
                    showCurrentGroup
                    leading={
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 accent-primary"
                        checked={selected.has(variation.id)}
                        onChange={() => toggle(variation.id)}
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
          <Button type="button" onClick={handleAdd} disabled={selected.size === 0 || addVariations.isPending}>
            {addVariations.isPending ? "Adicionando..." : `Adicionar ${selected.size} variação(ões)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

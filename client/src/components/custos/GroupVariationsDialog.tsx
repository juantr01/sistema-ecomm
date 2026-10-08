import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { CostVariationRow } from "@/components/custos/CostVariationRow";
import { useCostVariations, useRemoveCostGroupVariation } from "@/hooks/useCostGroups";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { CostGroup } from "@/types";

interface GroupVariationsDialogProps {
  group: CostGroup | null;
  shopNames: Map<string, string>;
  onOpenChange: (open: boolean) => void;
}

export function GroupVariationsDialog({ group, shopNames, onOpenChange }: GroupVariationsDialogProps) {
  const [search, setSearch] = useState("");
  const { data: variations, isLoading } = useCostVariations(
    { groupId: group?.id, search: search || undefined },
    !!group
  );
  const removeVariation = useRemoveCostGroupVariation();

  async function handleRemove(variationId: string) {
    if (!group) return;
    try {
      await removeVariation.mutateAsync({ id: group.id, variationId });
    } catch (err) {
      toast({
        title: "Não foi possível tirar a variação do grupo",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog
      open={!!group}
      onOpenChange={(open) => {
        if (!open) setSearch("");
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variações em {group?.name}</DialogTitle>
          <DialogDescription>Variação tirada do grupo mantém o último custo e volta para a lista "sem grupo".</DialogDescription>
        </DialogHeader>

        <SearchInput value={search} onChange={setSearch} placeholder="Buscar anúncio neste grupo..." />

        <div className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
          {isLoading || !group ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : !variations?.length ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhuma variação neste grupo.</p>
          ) : (
            variations.map((variation) => (
              <CostVariationRow
                key={variation.id}
                variation={variation}
                shopName={variation.product.shopeeShopId ? shopNames.get(variation.product.shopeeShopId) : undefined}
                trailing={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Tirar do grupo"
                    onClick={() => handleRemove(variation.id)}
                    disabled={removeVariation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { CostProductRow } from "@/components/custos/CostProductRow";
import { useProducts } from "@/hooks/useProducts";
import { useRemoveCostGroupProduct } from "@/hooks/useCostGroups";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { CostGroup } from "@/types";

interface GroupProductsDialogProps {
  group: CostGroup | null;
  shopNames: Map<string, string>;
  onOpenChange: (open: boolean) => void;
}

export function GroupProductsDialog({ group, shopNames, onOpenChange }: GroupProductsDialogProps) {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useProducts({
    costGroupId: group?.id,
    search: search || undefined,
    active: true,
  }, { enabled: !!group });
  const removeProduct = useRemoveCostGroupProduct();

  async function handleRemove(productId: string) {
    if (!group) return;
    try {
      await removeProduct.mutateAsync({ id: group.id, productId });
    } catch (err) {
      toast({
        title: "Não foi possível tirar o produto do grupo",
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
          <DialogTitle>Produtos em {group?.name}</DialogTitle>
          <DialogDescription>Produto tirado do grupo mantém o último custo e volta para a lista "sem grupo".</DialogDescription>
        </DialogHeader>

        <SearchInput value={search} onChange={setSearch} placeholder="Buscar neste grupo..." />

        <div className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
          {isLoading || !group ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : !products?.length ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum produto neste grupo.</p>
          ) : (
            products.map((product) => (
              <CostProductRow
                key={product.id}
                product={product}
                shopName={product.shopeeShopId ? shopNames.get(product.shopeeShopId) : undefined}
                trailing={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Tirar do grupo"
                    onClick={() => handleRemove(product.id)}
                    disabled={removeProduct.isPending}
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

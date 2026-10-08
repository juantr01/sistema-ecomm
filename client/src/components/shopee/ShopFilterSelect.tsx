import { useEffect } from "react";
import { Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShopeeStatus } from "@/hooks/useShopee";
import { useShopFilterStore } from "@/stores/shopFilterStore";

const ALL = "all";

// Só aparece com mais de uma loja conectada; o filtro vale para Vendas, Dashboard e Relatórios
export function ShopFilterSelect() {
  const { data: status } = useShopeeStatus();
  const shopId = useShopFilterStore((s) => s.shopId);
  const setShopId = useShopFilterStore((s) => s.setShopId);
  const shops = status?.shops ?? [];

  // Loja desconectada não pode continuar selecionada
  useEffect(() => {
    if (status && shopId && !shops.some((s) => s.shopId === shopId)) setShopId("");
  }, [status, shops, shopId, setShopId]);

  if (shops.length < 2) return null;

  return (
    <Select value={shopId || ALL} onValueChange={(v) => setShopId(v === ALL ? "" : v)}>
      <SelectTrigger className="h-8 w-auto max-w-[11rem] gap-2 sm:max-w-[14rem]" aria-label="Loja">
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todas as lojas</SelectItem>
        {shops.map((s) => (
          <SelectItem key={s.shopId} value={s.shopId}>
            {s.shopName ?? s.shopId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

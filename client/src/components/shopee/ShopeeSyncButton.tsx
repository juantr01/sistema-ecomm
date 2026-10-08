import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopeeStatus, useShopeeSync } from "@/hooks/useShopee";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

interface ShopeeSyncButtonProps {
  // Versão do topo: só ícone no celular e escondida se a loja não estiver conectada
  compact?: boolean;
}

export function ShopeeSyncButton({ compact }: ShopeeSyncButtonProps) {
  const { data: status } = useShopeeStatus();
  const shopeeSync = useShopeeSync();

  if (compact && !status?.connected) return null;

  async function handleSync() {
    try {
      const { products, orders, failures } = await shopeeSync.mutateAsync();
      const skipped = orders.skipped.length
        ? ` Não importados: ${orders.skipped.map((s) => `${s.orderSn} (${s.reason})`).join(", ")}.`
        : "";
      const failed = failures.length
        ? ` Não foi possível sincronizar: ${failures.map((f) => `${f.shopName} (${f.message})`).join(", ")}.`
        : "";
      toast({
        title: failures.length ? "Sincronização concluída com falhas" : "Sincronização concluída",
        description: `Produtos: ${products.created} novos, ${products.updated} atualizados. Pedidos encontrados: ${orders.found}. Vendas: ${orders.created} importadas, ${orders.updated} atualizadas, ${orders.removed} removidas (canceladas).${skipped}${failed}`,
        variant: failures.length ? "destructive" : "success",
      });
    } catch (err) {
      toast({
        title: "Não foi possível sincronizar com a Shopee",
        description: err instanceof ApiError ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  const label = shopeeSync.isPending ? "Sincronizando..." : compact ? "Sincronizar pedidos" : "Sincronizar com Shopee";

  return (
    <Button type="button" size={compact ? "sm" : "default"} onClick={handleSync} disabled={shopeeSync.isPending}>
      <RefreshCw className={`h-4 w-4 ${shopeeSync.isPending ? "animate-spin" : ""}`} />
      <span className={compact ? "hidden sm:inline" : undefined}>{label}</span>
    </Button>
  );
}

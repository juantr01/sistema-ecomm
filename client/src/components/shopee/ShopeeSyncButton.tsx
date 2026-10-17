import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useShopeeStatus, useShopeeSync } from "@/hooks/useShopee";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatTimeAgo } from "@/lib/format";

interface ShopeeSyncButtonProps {
  // Versão do topo: só ícone no celular e escondida se a loja não estiver conectada
  compact?: boolean;
}

export function ShopeeSyncButton({ compact }: ShopeeSyncButtonProps) {
  const { data: status } = useShopeeStatus();
  const shopeeSync = useShopeeSync();
  const { pathname } = useLocation();
  // Topo: na página de produtos sincroniza só produtos, no resto só vendas (sync completo é lento)
  const scope = !compact ? "all" : pathname.startsWith("/produtos") ? "products" : "orders";

  // Atualiza o "há X min" sem precisar recarregar a página
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!compact) return;
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [compact]);

  if (compact && !status?.connected) return null;

  // Com mais de uma loja, mostra a mais atrasada; "nunca" se alguma ainda não sincronizou
  const syncTimes = (status?.shops ?? []).map((s) => (scope === "products" ? s.lastProductSyncAt : s.lastOrderSyncAt));
  const lastSync = syncTimes.length && syncTimes.every(Boolean) ? syncTimes.sort()[0] : null;

  async function handleSync() {
    try {
      const { products, orders, failures } = await shopeeSync.mutateAsync(scope);
      const skipped = orders.skipped.length
        ? ` Não importados: ${orders.skipped.map((s) => `${s.orderSn} (${s.reason})`).join(", ")}.`
        : "";
      const failed = failures.length
        ? ` Não foi possível sincronizar: ${failures.map((f) => `${f.shopName} (${f.message})`).join(", ")}.`
        : "";
      const productsSummary = `Produtos: ${products.created} novos, ${products.updated} atualizados.`;
      const ordersSummary = `Pedidos encontrados: ${orders.found}. Vendas: ${orders.created} importadas, ${orders.updated} atualizadas, ${orders.removed} removidas (canceladas).`;
      const summary = scope === "products" ? productsSummary : scope === "orders" ? ordersSummary : `${productsSummary} ${ordersSummary}`;
      toast({
        title: failures.length ? "Sincronização concluída com falhas" : "Sincronização concluída",
        description: `${summary}${skipped}${failed}`,
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

  const label = shopeeSync.isPending
    ? "Sincronizando..."
    : scope === "products"
      ? "Sincronizar produtos"
      : scope === "orders"
        ? "Sincronizar pedidos"
        : "Sincronizar com Shopee";

  const button = (
    <Button type="button" size={compact ? "sm" : "default"} onClick={handleSync} disabled={shopeeSync.isPending}>
      <RefreshCw className={`h-4 w-4 ${shopeeSync.isPending ? "animate-spin" : ""}`} />
      <span className={compact ? "hidden sm:inline" : undefined}>{label}</span>
    </Button>
  );

  if (!compact) return button;

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden text-xs text-muted-foreground lg:inline"
        title={lastSync ? `Último sync: ${formatDateTime(lastSync)}` : undefined}
      >
        {lastSync ? `Atualizado ${formatTimeAgo(lastSync, now)}` : "Nunca sincronizado"}
      </span>
      {button}
    </div>
  );
}

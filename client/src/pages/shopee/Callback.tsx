import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useShopeeCallback } from "@/hooks/useShopee";
import { toast } from "@/stores/toastStore";
import { ApiError } from "@/lib/api";

export default function ShopeeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopeeCallback = useShopeeCallback();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get("code");
    const shopId = searchParams.get("shop_id");

    if (!code || !shopId) {
      toast({ title: "Retorno da Shopee inválido", variant: "destructive" });
      navigate("/configuracoes", { replace: true });
      return;
    }

    shopeeCallback
      .mutateAsync({ code, shopId })
      .then(() => toast({ title: "Loja Shopee conectada com sucesso", variant: "success" }))
      .catch((err) =>
        toast({
          title: "Não foi possível conectar a loja Shopee",
          description: err instanceof ApiError ? err.message : undefined,
          variant: "destructive",
        })
      )
      .finally(() => navigate("/configuracoes", { replace: true }));
  }, [searchParams, navigate, shopeeCallback]);

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      Conectando com a Shopee...
    </div>
  );
}

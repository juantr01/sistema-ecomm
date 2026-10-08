import { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";

interface CostProductRowProps {
  product: Product;
  shopName?: string;
  // checkbox (seleção) ou botão de ação, à esquerda/direita da linha
  leading?: ReactNode;
  trailing?: ReactNode;
  // destaca o grupo atual quando o produto já está em outro grupo
  showCurrentGroup?: boolean;
}

export function CostProductRow({ product, shopName, leading, trailing, showCurrentGroup }: CostProductRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      {leading}
      {product.imageUrl ? (
        <img src={product.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ImageOff className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={product.name}>
          {product.name}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {shopName && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {shopName}
            </Badge>
          )}
          <span>{product.shopeeSku ?? product.sku}</span>
          {showCurrentGroup && product.costGroup && <span>· no grupo {product.costGroup.name}</span>}
        </div>
      </div>
      {trailing}
    </div>
  );
}

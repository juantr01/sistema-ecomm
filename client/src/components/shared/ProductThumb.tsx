import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductThumbProps {
  src?: string | null;
  className?: string;
}

// Miniatura da foto do produto (ou ícone quando não tem foto)
export function ProductThumb({ src, className }: ProductThumbProps) {
  return src ? (
    <img src={src} alt="" loading="lazy" className={cn("h-9 w-9 shrink-0 rounded-md object-cover", className)} />
  ) : (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground", className)}>
      <ImageOff className="h-4 w-4" />
    </div>
  );
}

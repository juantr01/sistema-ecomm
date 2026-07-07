import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toastStore";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg animate-in slide-in-from-bottom-2 fade-in",
            t.variant === "destructive" && "border-destructive/50 bg-destructive text-destructive-foreground",
            t.variant === "success" && "border-success/50 bg-success text-success-foreground"
          )}
        >
          <div>
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 text-xs opacity-90">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

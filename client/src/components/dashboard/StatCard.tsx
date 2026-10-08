import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "destructive" | "warning";
  hint?: string;
  className?: string;
  // card clicável que leva a uma tela de detalhe
  to?: string;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-amber-500",
};

export function StatCard({ label, value, icon, tone = "default", hint, className, to }: StatCardProps) {
  const card = (
    <Card className={cn(to ? "h-full transition-colors hover:border-primary/60 hover:bg-accent/30" : className)}>
      <CardContent className="flex items-start justify-between gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</span>
          <span className={cn("text-lg font-semibold tabular-nums sm:text-2xl", toneClasses[tone])}>{value}</span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {icon && <div className="shrink-0 rounded-md bg-accent p-1.5 text-muted-foreground sm:p-2">{icon}</div>}
      </CardContent>
    </Card>
  );

  return to ? (
    <Link to={to} className={cn("block", className)}>
      {card}
    </Link>
  ) : (
    card
  );
}

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "destructive" | "warning";
  hint?: string;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-amber-500",
};

export function StatCard({ label, value, icon, tone = "default", hint }: StatCardProps) {
  return (
    <Card>
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
}

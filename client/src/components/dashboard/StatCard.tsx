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
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className={cn("text-2xl font-semibold tabular-nums", toneClasses[tone])}>{value}</span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {icon && <div className="rounded-md bg-accent p-2 text-muted-foreground">{icon}</div>}
      </CardContent>
    </Card>
  );
}

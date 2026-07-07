import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateRange {
  from?: string;
  to?: string;
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const PRESETS: Array<{ label: string; get: () => DateRange }> = [
  {
    label: "Hoje",
    get: () => ({ from: toISODate(new Date()), to: toISODate(new Date()) }),
  },
  {
    label: "7 dias",
    get: () => ({ from: toISODate(new Date(Date.now() - 6 * 86400000)), to: toISODate(new Date()) }),
  },
  {
    label: "30 dias",
    get: () => ({ from: toISODate(new Date(Date.now() - 29 * 86400000)), to: toISODate(new Date()) }),
  },
  {
    label: "Este mês",
    get: () => {
      const now = new Date();
      return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) };
    },
  },
];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<string | null>("30 dias");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          size="sm"
          variant={activePreset === preset.label ? "default" : "outline"}
          onClick={() => {
            setActivePreset(preset.label);
            onChange(preset.get());
          }}
        >
          {preset.label}
        </Button>
      ))}
      <div className={cn("flex items-center gap-2", activePreset && "opacity-70")}>
        <Input
          type="date"
          className="w-36"
          value={value.from ?? ""}
          onChange={(e) => {
            setActivePreset(null);
            onChange({ ...value, from: e.target.value });
          }}
        />
        <span className="text-sm text-muted-foreground">até</span>
        <Input
          type="date"
          className="w-36"
          value={value.to ?? ""}
          onChange={(e) => {
            setActivePreset(null);
            onChange({ ...value, to: e.target.value });
          }}
        />
      </div>
    </div>
  );
}

export function getDefaultRange(): DateRange {
  return PRESETS[2].get();
}

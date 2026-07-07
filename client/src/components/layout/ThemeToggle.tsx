import { Moon, Sun, Monitor } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { value: "light" as const, icon: Sun, label: "Claro" },
  { value: "dark" as const, icon: Moon, label: "Escuro" },
  { value: "system" as const, icon: Monitor, label: "Sistema" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useUiStore();

  return (
    <div className="flex items-center rounded-md border p-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          type="button"
          variant={theme === value ? "secondary" : "ghost"}
          size="icon"
          className="h-7 w-7"
          title={label}
          onClick={() => setTheme(value)}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}

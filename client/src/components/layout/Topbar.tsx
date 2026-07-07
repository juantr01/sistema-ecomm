import { LogOut, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLogout, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { QuickAddSaleButton } from "@/components/sales/QuickAddSaleButton";

export function Topbar() {
  const { data } = useMe();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div />
      <div className="flex items-center gap-3">
        <QuickAddSaleButton />
        <ThemeToggle />
        <div className="flex items-center gap-2 border-l pl-3 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{data?.user.name}</span>
        </div>
        <Button variant="ghost" size="icon" title="Sair" onClick={() => logout.mutate()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

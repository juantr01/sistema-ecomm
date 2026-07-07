import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useLogout, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { QuickAddSaleButton } from "@/components/sales/QuickAddSaleButton";
import { useUiStore } from "@/stores/uiStore";

export function Topbar() {
  const { data } = useMe();
  const logout = useLogout();
  const openMobileMenu = useUiStore((s) => s.openMobileMenu);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div>
        <button
          type="button"
          onClick={openMobileMenu}
          aria-label="Abrir menu"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
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

import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

const storedTheme = (localStorage.getItem("theme") as Theme | null) ?? "system";
applyTheme(storedTheme);

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem("sidebarCollapsed", String(next));
      return { sidebarCollapsed: next };
    }),
  mobileMenuOpen: false,
  openMobileMenu: () => set({ mobileMenuOpen: true }),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  theme: storedTheme,
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));

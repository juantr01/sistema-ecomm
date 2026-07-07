import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
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
  theme: storedTheme,
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));

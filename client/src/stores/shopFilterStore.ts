import { create } from "zustand";

// Loja Shopee selecionada no topo; vazio = todas as lojas somadas
interface ShopFilterState {
  shopId: string;
  setShopId: (shopId: string) => void;
}

function readStoredShopId() {
  try {
    return localStorage.getItem("shopFilter") ?? "";
  } catch {
    return "";
  }
}

export const useShopFilterStore = create<ShopFilterState>((set) => ({
  shopId: readStoredShopId(),
  setShopId: (shopId) => {
    try {
      localStorage.setItem("shopFilter", shopId);
    } catch {
      // sem localStorage o filtro só não é lembrado
    }
    set({ shopId });
  },
}));

export function useShopFilter() {
  return useShopFilterStore((s) => s.shopId) || undefined;
}

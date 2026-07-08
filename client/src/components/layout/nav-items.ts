import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/produtos", label: "Produtos da Loja", icon: Package },
  { to: "/estoque", label: "Estoque Próprio", icon: Boxes },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck },
  { to: "/vendas", label: "Vendas", icon: Wallet },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

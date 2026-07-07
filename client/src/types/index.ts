export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  category?: Category | null;
  color: string | null;
  size: string | null;
  stockQuantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  notes: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  whatsapp: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDetail extends Supplier {
  purchases: Purchase[];
  totalItemsPurchased: number;
  totalSpent: number;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseDate: string;
  freight: number;
  notes: string | null;
  items: PurchaseItem[];
  createdAt: string;
}

export type SaleOrigin = "MANUAL" | "SHOPEE" | "OTHER";

export interface Sale {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  totalAmount: number;
  unitCostAtSale: number;
  profit: number;
  origin: SaleOrigin;
  saleDate: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "EMBALAGEM"
  | "FRETE"
  | "MARKETING"
  | "TRANSPORTE"
  | "COMPRA_PRODUTOS"
  | "OUTROS";

export type ExpenseSource = "MANUAL" | "PURCHASE";

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  source: ExpenseSource;
  purchaseId: string | null;
  createdAt: string;
}

export type StockMovementType = "PURCHASE" | "SALE" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: StockMovementType;
  quantityDelta: number;
  referenceId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  faturamentoDia: number;
  faturamentoMes: number;
  lucroDia: number;
  lucroMes: number;
  totalGastoMes: number;
  saldo: number;
  quantidadeProdutos: number;
  estoqueBaixo: number;
  produtosMaisVendidos: Array<{
    product?: Product;
    quantitySold: number;
    totalAmount: number;
  }>;
}

export interface SalesSummaryReport {
  totalVendido: number;
  totalGasto: number;
  lucroBruto: number;
  lucroLiquido: number;
}

export interface TopProductReport {
  product?: Product;
  quantitySold: number;
  totalAmount: number;
  profit: number;
}

export interface ExpenseBySupplierReport {
  supplierId: string;
  supplierName: string;
  total: number;
}

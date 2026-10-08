export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
}

export type ProductSourceType = "OWN_STOCK" | "DROPSHIPPING";

export interface Estampa {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products: (Product & { lowStock: boolean })[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  category?: Category | null;
  groupId: string | null;
  color: string | null;
  size: string | null;
  pattern: string | null;
  stockQuantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  netReceivedPrice: number;
  sourceType: ProductSourceType;
  stockDisplayName: string | null;
  stockSortOrder: number;
  notes: string | null;
  imageUrl: string | null;
  active: boolean;
  shopeeShopId: string | null;
  shopeeSku: string | null;
  createdAt: string;
  updatedAt: string;
  salesCount?: number;
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
  variation?: { id: string; name: string } | null;
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
  pedidosDia: number;
  lucroOntem: number;
  // false = ainda não houve o fechamento da 00:00; o valor é o atual de ontem
  lucroOntemFechado: boolean;
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

export interface CostGroup {
  id: string;
  name: string;
  cost: number;
  variationCount: number;
  createdAt: string;
  updatedAt: string;
}

// Variação de um anúncio da Shopee, com o seu grupo de custo
export interface CostVariation {
  id: string;
  name: string;
  shopeeSku: string | null;
  costGroupId: string | null;
  costPrice: number;
  product: { id: string; name: string; imageUrl: string | null; shopeeShopId: string | null };
  costGroup: { id: string; name: string } | null;
}

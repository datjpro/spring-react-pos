export interface RevenueDataPoint {
  date: string
  revenue: number
  orderCount: number
}

export interface RevenueReportResponse {
  from: string
  to: string
  groupBy: string
  totalRevenue: number
  totalOrders: number
  data: RevenueDataPoint[]
}

export interface ProfitReportResponse {
  from: string
  to: string
  groupBy: string
  totalRevenue: number
  totalCost: number
  totalProfit: number
  dataPoints: Array<{ period: string; revenue: number; cost: number; profit: number }>
}

export interface InventorySummaryResponse {
  totalProducts: number
  activeProducts: number
  totalStock: number
  lowStockProducts: number
  outOfStockProducts: number
}

export interface TopProductResponse {
  productId: number
  sku: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

export interface StockCardReportResponse {
  productId: number
  branchId: number
  from: string
  to: string
  entries: Array<{
    id: number
    createdAt: string
    movementType: string
    quantity: number
    referenceType: string
    referenceId: number
    note: string | null
    createdBy: string
  }>
}

export interface PurchaseSummaryResponse {
  from: string
  to: string
  supplierId: number | null
  branchId: number | null
  totalPurchases: number
  totalQuantity: number
  totalAmount: number
}

export interface SalesSummaryResponse {
  from: string
  to: string
  branchId: number | null
  createdBy: string | null
  totalSales: number
  totalQuantity: number
  totalAmount: number
}

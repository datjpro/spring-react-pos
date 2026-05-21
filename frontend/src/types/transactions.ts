export interface PurchaseItem {
  productId: number
  productName: string
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface Purchase {
  id: number
  purchaseCode: string
  supplierId: number
  supplierName: string
  branchId: number
  branchName: string
  status: string
  totalAmount: number
  items: PurchaseItem[]
  createdBy: string
  createdAt: string
}

export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Sale {
  id: number
  saleCode: string
  branchId: number
  branchName: string
  status: string
  totalAmount: number
  items: SaleItem[]
  createdBy: string
  createdAt: string
}

export interface CreatePurchaseRequest {
  supplierId: number
  branchId: number
  items: Array<{ productId: number; quantity: number; unitCost: number }>
  note?: string
}

export interface CreateSaleRequest {
  branchId: number
  items: Array<{ productId: number; quantity: number }>
  note?: string
}


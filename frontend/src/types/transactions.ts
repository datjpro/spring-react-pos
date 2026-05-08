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

export interface OrderItem {
  productId: number
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: number
  orderCode: string
  cashierUsername: string
  status: string
  subtotal: number
  discountAmount: number
  totalAmount: number
  items: OrderItem[]
  createdAt: string
}

export interface OrderPage {
  content: Order[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface Payment {
  id: number
  orderId: number
  orderCode: string
  paymentMethod: string
  paymentReference: string | null
  status: string
  amountPaid: number
  amountReceived: number
  changeAmount: number
  note: string | null
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

export interface CreateOrderRequest {
  items: Array<{ productId: number; quantity: number }>
  discountAmount?: number
}

export interface CreatePaymentRequest {
  orderId: number
  paymentMethod: string
  amountReceived: number
  paymentReference?: string
  note?: string
}

import type { PageResponse } from './common'

export interface InventoryAdjustment {
  id: number
  productId: number
  productName: string
  adjustmentType: string
  quantity: number
  reason: string
  note: string | null
  createdBy: string
  createdAt: string
}

export interface InventoryAdjustmentPage extends PageResponse<InventoryAdjustment> {}

export interface LowStockProduct {
  productId: number
  sku: string
  productName: string
  stock: number
  threshold: number
}

export interface StockMovement {
  id: number
  productId: number
  productName: string
  branchId: number
  branchName: string
  movementType: string
  quantity: number
  referenceType: string
  referenceId: number
  note: string | null
  createdBy: string
  createdAt: string
}

export interface StockMovementPage extends PageResponse<StockMovement> {}

export interface StockAdjustmentResult {
  productId: number
  branchId: number
  quantityDelta: number
  currentStock: number
  reason: string
  actor: string
}

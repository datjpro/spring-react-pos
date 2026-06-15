import type { PageResponse } from './common'

export interface StockLevel {
  productId: number
  productName: string
  sku: string
  branchId: number
  branchName: string
  stock: number
}

export interface StockLevelPage extends PageResponse<StockLevel> {}

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

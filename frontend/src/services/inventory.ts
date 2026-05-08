import { apiClient } from './api'
import type {
  InventoryAdjustment,
  InventoryAdjustmentPage,
  LowStockProduct,
  StockAdjustmentResult,
  StockMovementPage,
} from '../types/inventory'

export async function createInventoryAdjustment(payload: {
  productId: number
  adjustmentType: string
  quantity: number
  reason: string
  note?: string
}) {
  const response = await apiClient.post<InventoryAdjustment>('/inventory/adjustments', payload)
  return response.data
}

export async function getInventoryAdjustments(params: {
  page?: number
  size?: number
  productId?: number
  type?: string
  from?: string
  to?: string
} = {}) {
  const response = await apiClient.get<InventoryAdjustmentPage>('/inventory/adjustments', { params })
  return response.data
}

export async function getLowStockProducts(threshold = 10) {
  const response = await apiClient.get<LowStockProduct[]>('/inventory/low-stock', { params: { threshold } })
  return response.data
}

export async function getStockMovements(branchId: number, page = 0, size = 20) {
  const response = await apiClient.get<StockMovementPage>('/stock-movements', { params: { branchId, page, size } })
  return response.data
}

export async function createStockAdjustment(payload: {
  productId: number
  branchId: number
  quantityDelta: number
  reason: string
  note?: string
}) {
  const response = await apiClient.post<StockAdjustmentResult>('/stock-movements/adjustments', payload)
  return response.data
}

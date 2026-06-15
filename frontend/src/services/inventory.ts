import { apiClient } from './api'
import type { StockAdjustmentResult, StockLevelPage, StockMovementPage } from '../types/inventory'

interface StockLevelQuery {
  branchId?: number
  productId?: number
  page?: number
  size?: number
}

export async function getStockLevels(params: StockLevelQuery = {}) {
  const response = await apiClient.get<StockLevelPage>('/stock-levels', { params })
  return response.data
}

export async function getStockMovements(params: StockLevelQuery = {}) {
  const response = await apiClient.get<StockMovementPage>('/stock-movements', { params })
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

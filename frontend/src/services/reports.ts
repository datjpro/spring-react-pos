import { apiClient } from './api'
import type {
  InventorySummaryResponse,
  ProfitReportResponse,
  PurchaseSummaryResponse,
  RevenueReportResponse,
  SalesSummaryResponse,
  StockCardReportResponse,
  TopProductResponse,
} from '../types/report'

export async function getRevenueOverview() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(now.getDate() - 6)

  const response = await apiClient.get<RevenueReportResponse>('/reports/revenue', {
    params: {
      from: from.toISOString(),
      to: now.toISOString(),
      groupBy: 'day',
    },
  })

  return response.data
}

export async function getRevenueReport(params: { from: string; to: string; groupBy?: string; branchId?: number }) {
  const response = await apiClient.get<RevenueReportResponse>('/reports/revenue', { params })
  return response.data
}

export async function getProfitReport(params: { from: string; to: string; groupBy?: string; branchId?: number }) {
  const response = await apiClient.get<ProfitReportResponse>('/reports/profit', { params })
  return response.data
}

export async function getTopProductsReport(params: {
  from: string
  to: string
  limit?: number
  sortBy?: string
  branchId?: number
}) {
  const response = await apiClient.get<TopProductResponse[]>('/reports/top-products', { params })
  return response.data
}

export async function getInventorySummaryReport() {
  const response = await apiClient.get<InventorySummaryResponse>('/reports/inventory-summary')
  return response.data
}

export async function getStockCardReport(params: { productId: number; branchId: number; from: string; to: string }) {
  const response = await apiClient.get<StockCardReportResponse>('/reports/stock-card', { params })
  return response.data
}

export async function getPurchaseSummaryReport(params: {
  from: string
  to: string
  supplierId?: number
  branchId?: number
}) {
  const response = await apiClient.get<PurchaseSummaryResponse>('/reports/purchase-summary', { params })
  return response.data
}

export async function getSalesSummaryReport(params: {
  from: string
  to: string
  branchId?: number
  createdBy?: string
}) {
  const response = await apiClient.get<SalesSummaryResponse>('/reports/sales-summary', { params })
  return response.data
}

export async function exportReportCsv(params: {
  type: string
  from?: string
  to?: string
  groupBy?: string
  limit?: number
  sortBy?: string
  branchId?: number
  productId?: number
  supplierId?: number
  createdBy?: string
}) {
  const response = await apiClient.get<string>('/reports/export', {
    params: { ...params, format: 'csv' },
    responseType: 'text' as const,
  })

  return response.data
}

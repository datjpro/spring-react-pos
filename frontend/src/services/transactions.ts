import { apiClient } from './api'
import type {
  CreatePurchaseRequest,
  CreateSaleRequest,
  Purchase,
  Sale,
} from '../types/transactions'

export async function getPurchases() {
  const response = await apiClient.get<Purchase[]>('/purchases')
  return response.data
}

export async function getPurchaseById(id: number) {
  const response = await apiClient.get<Purchase>(`/purchases/${id}`)
  return response.data
}

export async function createPurchase(payload: CreatePurchaseRequest) {
  const response = await apiClient.post<Purchase>('/purchases', payload)
  return response.data
}

export async function cancelPurchase(id: number, reason?: string) {
  const response = await apiClient.post<Purchase>(`/purchases/${id}/cancel`, { reason })
  return response.data
}

export async function getSales() {
  const response = await apiClient.get<Sale[]>('/sales')
  return response.data
}

export async function getSaleById(id: number) {
  const response = await apiClient.get<Sale>(`/sales/${id}`)
  return response.data
}

export async function createSale(payload: CreateSaleRequest) {
  const response = await apiClient.post<Sale>('/sales', payload)
  return response.data
}

export async function cancelSale(id: number, reason?: string) {
  const response = await apiClient.post<Sale>(`/sales/${id}/cancel`, { reason })
  return response.data
}


import { apiClient } from './api'
import type {
  CreateOrderRequest,
  CreatePaymentRequest,
  CreatePurchaseRequest,
  CreateSaleRequest,
  Order,
  OrderPage,
  Payment,
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

export interface OrderQuery {
  page?: number
  size?: number
  status?: string
  from?: string
  to?: string
}

export async function getOrders(params: OrderQuery = {}) {
  const response = await apiClient.get<OrderPage>('/orders', { params })
  return response.data
}

export async function getOrderById(id: number) {
  const response = await apiClient.get<Order>(`/orders/${id}`)
  return response.data
}

export async function createOrder(payload: CreateOrderRequest) {
  const response = await apiClient.post<Order>('/orders', payload)
  return response.data
}

export async function cancelOrder(id: number, reason?: string) {
  const response = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason })
  return response.data
}

export async function createPayment(payload: CreatePaymentRequest) {
  const response = await apiClient.post<Payment>('/payments', payload)
  return response.data
}

export async function getPaymentById(id: number) {
  const response = await apiClient.get<Payment>(`/payments/${id}`)
  return response.data
}

export async function getPaymentsByOrder(orderId: number) {
  const response = await apiClient.get<Payment[]>('/payments', { params: { orderId } })
  return response.data
}

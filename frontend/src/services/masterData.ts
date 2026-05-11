import { apiClient } from './api'
import type { MessageResponse } from '../types/common'
import type { Branch, BranchRequest, Supplier, SupplierRequest } from '../types/masterData'

export async function getBranches() {
  const response = await apiClient.get<Branch[]>('/branches')
  return response.data
}

export async function getBranchById(id: number) {
  const response = await apiClient.get<Branch>(`/branches/${id}`)
  return response.data
}

export async function createBranch(payload: BranchRequest) {
  const response = await apiClient.post<Branch>('/branches', payload)
  return response.data
}

export async function updateBranch(id: number, payload: BranchRequest) {
  const response = await apiClient.put<Branch>(`/branches/${id}`, payload)
  return response.data
}

export async function deleteBranch(id: number) {
  const response = await apiClient.delete<MessageResponse>(`/branches/${id}`)
  return response.data
}

export async function getSuppliers() {
  const response = await apiClient.get<Supplier[]>('/suppliers')
  return response.data
}

export async function getSupplierById(id: number) {
  const response = await apiClient.get<Supplier>(`/suppliers/${id}`)
  return response.data
}

export async function createSupplier(payload: SupplierRequest) {
  const response = await apiClient.post<Supplier>('/suppliers', payload)
  return response.data
}

export async function updateSupplier(id: number, payload: SupplierRequest) {
  const response = await apiClient.put<Supplier>(`/suppliers/${id}`, payload)
  return response.data
}

export async function deleteSupplier(id: number) {
  const response = await apiClient.delete<MessageResponse>(`/suppliers/${id}`)
  return response.data
}

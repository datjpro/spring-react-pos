import { apiClient } from './api'
import type { UserMeResponse } from '../types/auth'

export interface CreateUserRequest {
  username: string
  password: string
  role: string
  branchId: number | null
  active: boolean
}

export interface UpdateUserRequest {
  role: string
  branchId: number | null
  active: boolean
}

export async function getUsers() {
  const response = await apiClient.get<UserMeResponse[]>('/users')
  return response.data
}

export async function createUser(payload: CreateUserRequest) {
  const response = await apiClient.post<UserMeResponse>('/users', payload)
  return response.data
}

export async function updateUser(id: number, payload: UpdateUserRequest) {
  const response = await apiClient.put<UserMeResponse>(`/users/${id}`, payload)
  return response.data
}

export async function updateUserActive(id: number, active: boolean) {
  const response = await apiClient.patch<UserMeResponse>(`/users/${id}/active`, { active })
  return response.data
}

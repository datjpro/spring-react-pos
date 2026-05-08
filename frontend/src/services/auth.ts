import { apiClient } from './api'
import type { LoginRequest, LoginResponse, UserMeResponse } from '../types/auth'

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function getMe() {
  const response = await apiClient.get<UserMeResponse>('/users/me')
  return response.data
}

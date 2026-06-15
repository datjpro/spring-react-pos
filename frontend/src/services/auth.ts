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

export async function refreshToken(refreshToken: string) {
  const response = await apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', { refreshToken })
  return response.data
}

export async function logoutApi() {
  const response = await apiClient.post<{ message: string }>('/auth/logout')
  return response.data
}

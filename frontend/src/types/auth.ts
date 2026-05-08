export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface UserMeResponse {
  id: number
  username: string
  role: string
  branchId: number | null
  branchName: string | null
  active: boolean
  createdAt: string
}

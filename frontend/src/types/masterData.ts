export interface Branch {
  id: number
  code: string
  name: string
  address: string | null
  active: boolean
}

export interface Supplier {
  id: number
  code: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  active: boolean
}

export interface BranchRequest {
  code: string
  name: string
  address?: string
}

export interface SupplierRequest {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
}

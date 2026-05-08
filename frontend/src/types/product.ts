export interface Product {
  id: number
  sku: string
  name: string
  category: string | null
  price: number
  cost: number | null
  stock: number
  unit: string
  barcode: string | null
  description: string | null
  imageUrl: string | null
  active: boolean
  createdAt: string
}

export interface ProductPageResponse {
  content: Product[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface CreateProductRequest {
  sku: string
  name: string
  category?: string
  price: number
  cost?: number
  stock: number
  unit: string
  barcode?: string
  description?: string
  imageUrl?: string
}

export interface UpdateProductRequest {
  name: string
  category?: string
  price: number
  cost?: number
  stock: number
  unit: string
  barcode?: string
  description?: string
  imageUrl?: string
  active: boolean
}

import { apiClient } from './api'
import type { CreateProductRequest, Product, ProductPageResponse, UpdateProductRequest } from '../types/product'
import type { MessageResponse } from '../types/common'

export interface ProductListParams {
  page?: number
  size?: number
  search?: string
  category?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export async function getProducts(params: ProductListParams = {}) {
  const response = await apiClient.get<ProductPageResponse>('/products', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      search: params.search,
      category: params.category,
      sort: params.sort ?? 'name',
      order: params.order ?? 'asc',
    },
  })

  return response.data
}

export async function getProductById(id: number) {
  const response = await apiClient.get<Product>(`/products/${id}`)
  return response.data
}

export async function createProduct(payload: CreateProductRequest) {
  const response = await apiClient.post<Product>('/products', payload)
  return response.data
}

export async function updateProduct(id: number, payload: UpdateProductRequest) {
  const response = await apiClient.put<Product>(`/products/${id}`, payload)
  return response.data
}

export async function deleteProduct(id: number) {
  const response = await apiClient.delete<MessageResponse>(`/products/${id}`)
  return response.data
}

export async function getProductCategories() {
  const response = await apiClient.get<string[]>('/products/categories')
  return response.data
}

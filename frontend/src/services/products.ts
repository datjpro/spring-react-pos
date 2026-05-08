import { apiClient } from './api'
import type { ProductPageResponse } from '../types/product'

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

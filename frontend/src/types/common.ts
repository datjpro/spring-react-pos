export interface MessageResponse {
  message: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface OptionItem {
  id: number
  label: string
}

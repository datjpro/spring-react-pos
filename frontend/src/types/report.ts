export interface RevenueDataPoint {
  period: string
  revenue: number
  orderCount: number
}

export interface RevenueReportResponse {
  from: string
  to: string
  groupBy: string
  totalRevenue: number
  totalOrders: number
  dataPoints: RevenueDataPoint[]
}

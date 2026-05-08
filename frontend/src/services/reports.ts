import { apiClient } from './api'
import type { RevenueReportResponse } from '../types/report'

export async function getRevenueOverview() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(now.getDate() - 6)

  const response = await apiClient.get<RevenueReportResponse>('/reports/revenue', {
    params: {
      from: from.toISOString(),
      to: now.toISOString(),
      groupBy: 'day',
    },
  })

  return response.data
}

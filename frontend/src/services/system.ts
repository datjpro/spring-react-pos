import { apiClient } from './api'
import type { AuditLogPage } from '../types/system'

export async function getAuditLogs(page = 0, size = 20) {
  const response = await apiClient.get<AuditLogPage>('/audit-logs', { params: { page, size } })
  return response.data
}

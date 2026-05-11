import type { PageResponse } from './common'

export interface AuditLog {
  id: number
  actor: string
  action: string
  entityName: string
  entityId: number | null
  description: string | null
  createdAt: string
}

export interface AuditLogPage extends PageResponse<AuditLog> {}

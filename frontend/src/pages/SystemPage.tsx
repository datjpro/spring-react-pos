import { ApiWorkbench } from '../components/ApiWorkbench'
import { getAuditLogs } from '../services/system'

export function SystemPage() {
  return (
    <ApiWorkbench
      eyebrow="System"
      title="Audit Logs"
      actions={[
        { name: 'List audit logs', description: 'GET /audit-logs', run: () => getAuditLogs(0, 20) },
      ]}
    />
  )
}

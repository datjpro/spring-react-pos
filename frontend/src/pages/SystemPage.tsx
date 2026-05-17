import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { getAuditLogs } from '../services/system'
import type { AuditLog } from '../types/system'
import { getApiErrorMessage } from '../utils/apiError'

export function SystemPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { void loadLogs() }, [])

  async function loadLogs() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await getAuditLogs(0, 20)
      setLogs(response.content)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">System</p><h2 className="page-header__title">Audit Logs</h2><p className="page-header__description">Theo dõi actor, hành động và entity để kiểm soát hệ thống.</p></div><Button type="button" variant="secondary" onClick={() => void loadLogs()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className="page-state page-state--error">{message}</p> : null}
      <Card>
        <CardHeader><div><p className="panel__eyebrow">Security</p><h3>Audit timeline</h3></div><Badge tone="info">{logs.length} log</Badge></CardHeader>
        <CardContent>{loading ? <p className="page-state">Đang tải logs...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Actor</th><th>Action</th><th>Entity</th><th>Description</th><th>At</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.actor}</td><td>{log.action}</td><td>{log.entityName}{log.entityId ? ` #${log.entityId}` : ''}</td><td>{log.description ?? '-'}</td><td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>}</CardContent>
      </Card>
    </section>
  )
}

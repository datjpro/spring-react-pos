import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { getAuditLogs } from '../services/system'
import type { AuditLog } from '../types/system'
import { getApiErrorMessage } from '../utils/apiError'

export function SystemPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const pageSize = 20

  useEffect(() => {
    void loadLogs()
  }, [page])

  async function loadLogs() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await getAuditLogs(page, pageSize)
      setLogs(response.content)
      setTotalElements(response.totalElements)
      setTotalPages(response.totalPages)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">System</p>
          <h2 className="page-header__title">{tr('Nhật ký audit', 'Audit Logs')}</h2>
          <p className="page-header__description">{tr('Theo dõi actor, hành động và entity để kiểm soát hệ thống.', 'Track actors, actions, and entities for system control.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadLogs()} disabled={loading}>{tr('Tải lại', 'Reload')}</Button>
      </header>
      {message ? <p className="page-state page-state--error">{message}</p> : null}
      <Card>
        <CardHeader><div><p className="panel__eyebrow">Security</p><h3>Audit timeline</h3></div><Badge tone="info">{totalElements} log</Badge></CardHeader>
        <CardContent>
          {loading ? <p className="page-state">{tr('Đang tải logs...', 'Loading logs...')}</p> : (
            <>
              <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Actor</th><th>Action</th><th>Entity</th><th>Description</th><th>At</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.actor}</td><td>{log.action}</td><td>{log.entityName}{log.entityId ? ` #${log.entityId}` : ''}</td><td>{log.description ?? '-'}</td><td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>
              <PaginationBar page={page} totalPages={totalPages} totalElements={totalElements} size={pageSize} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

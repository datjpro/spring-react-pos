import { useEffect, useState } from 'react'
import { RefreshCw, Shield, Activity, User, Database, Terminal } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { getAuditLogs } from '../services/system'
import type { AuditLog } from '../types/system'
import { getApiErrorMessage } from '../utils/apiError'

function getActionColor(action: string) {
  const a = action.toUpperCase()
  if (a.includes('CREATE') || a.includes('ADD') || a.includes('LOGIN')) return 'success'
  if (a.includes('DELETE') || a.includes('REMOVE') || a.includes('CANCEL')) return 'danger'
  if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('MODIFY')) return 'warning'
  return 'info'
}

function getEntityIcon(entity: string) {
  const e = entity.toUpperCase()
  if (e.includes('USER') || e.includes('AUTH')) return <User size={14} />
  if (e.includes('PRODUCT') || e.includes('INVENTORY') || e.includes('STOCK')) return <Database size={14} />
  if (e.includes('SALE') || e.includes('PURCHASE') || e.includes('TRANSACTION')) return <Activity size={14} />
  return <Terminal size={14} />
}

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
          <h2 className="page-header__title">{tr('Nhật ký hệ thống', 'Audit Logs')}</h2>
          <p className="page-header__description">{tr('Theo dõi mọi hành động của người dùng để kiểm soát và bảo mật.', 'Track all user actions for system security and control.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadLogs()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      {message ? <p className="page-state page-state--error">{message}</p> : null}

      <Card>
        <CardHeader>
          <div>
            <p className="panel__eyebrow">Security</p>
            <h3>{tr('Audit Timeline', 'Audit Timeline')}</h3>
          </div>
          <Shield size={20} style={{ color: 'var(--text-muted)' }} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="page-state">{tr('Đang tải nhật ký...', 'Loading logs...')}</p>
          ) : logs.length === 0 ? (
            <p className="page-state">{tr('Không có nhật ký nào.', 'No audit logs found.')}</p>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>{tr('Thời gian', 'Time')}</th>
                      <th style={{ width: 150 }}>{tr('Người dùng', 'Actor')}</th>
                      <th style={{ width: 120 }}>{tr('Hành động', 'Action')}</th>
                      <th style={{ width: 180 }}>{tr('Đối tượng', 'Entity')}</th>
                      <th>{tr('Chi tiết', 'Description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td>
                          <strong>{log.actor}</strong>
                        </td>
                        <td>
                          <Badge tone={getActionColor(log.action)}>{log.action}</Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
                              {getEntityIcon(log.entityName)}
                            </span>
                            <span>
                              {log.entityName} {log.entityId ? <strong style={{ color: 'var(--primary)' }}>#{log.entityId}</strong> : ''}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {log.description ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tr('Tổng cộng', 'Total')}: <strong>{totalElements}</strong> {tr('bản ghi', 'records')}
                </p>
                <PaginationBar page={page} totalPages={totalPages} totalElements={totalElements} size={pageSize} onPageChange={setPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

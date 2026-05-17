import { useState, type FormEvent } from 'react'
import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { getMe, refreshToken } from '../services/auth'
import type { UserMeResponse } from '../types/auth'
import { getApiErrorMessage } from '../utils/apiError'

export function AuthToolsPage() {
  const [refreshValue, setRefreshValue] = useState('')
  const [profile, setProfile] = useState<UserMeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadProfile() {
    setLoading(true)
    setMessage(null)
    try {
      setProfile(await getMe())
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitRefresh(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRefreshing(true)
    setMessage(null)
    try {
      const result = await refreshToken(refreshValue)
      setMessage(`Đã refresh token. Hết hạn sau ${result.expiresIn}s.`)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Authentication</p>
          <h2 className="page-header__title">Auth Tools</h2>
          <p className="page-header__description">Kiểm tra session hiện tại và refresh access token thủ công.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadProfile()} disabled={loading}><ShieldCheck size={16} /> Lấy profile</Button>
      </header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Session</p><h3>Người dùng hiện tại</h3></div>{profile ? <Badge tone="success">{profile.role}</Badge> : <Badge tone="neutral">Chưa tải</Badge>}</CardHeader>
          <CardContent>
            {loading ? <p className="page-state">Đang tải profile...</p> : null}
            {profile ? (
              <div className="detail-list">
                <div className="summary-block__row"><span>Username</span><strong>{profile.username}</strong></div>
                <div className="summary-block__row"><span>Branch</span><strong>{profile.branchName ?? '-'}</strong></div>
                <div className="summary-block__row"><span>Trạng thái</span><strong>{profile.active ? 'Active' : 'Inactive'}</strong></div>
              </div>
            ) : !loading ? <p className="page-state">Chưa có dữ liệu profile.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Refresh</p><h3>Làm mới token</h3></div><KeyRound size={20} /></CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitRefresh}>
              <label className="field"><span>Refresh token</span><Input required value={refreshValue} onChange={(event) => setRefreshValue(event.target.value)} placeholder="paste-refresh-token-here" /></label>
              <Button type="submit" full disabled={refreshing}><RefreshCw size={16} /> {refreshing ? 'Đang refresh...' : 'Refresh token'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

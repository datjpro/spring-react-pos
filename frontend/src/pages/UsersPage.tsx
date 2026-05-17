import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createUser, getUsers, updateUserActive } from '../services/users'
import type { UserMeResponse } from '../types/auth'
import { getApiErrorMessage } from '../utils/apiError'

export function UsersPage() {
  const [users, setUsers] = useState<UserMeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'STAFF', branchId: '', active: true })

  useEffect(() => { void loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    setMessage(null)
    try {
      setUsers(await getUsers())
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createUser({ username: form.username, password: form.password, role: form.role, branchId: form.branchId ? Number(form.branchId) : null, active: form.active })
      setForm({ username: '', password: '', role: 'STAFF', branchId: '', active: true })
      setMessage('Đã tạo user mới.')
      await loadUsers()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  async function toggleUser(user: UserMeResponse) {
    setMessage(null)
    try {
      await updateUserActive(user.id, !user.active)
      await loadUsers()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">System</p><h2 className="page-header__title">Users</h2><p className="page-header__description">Quản trị user, role, branch và trạng thái kích hoạt.</p></div><Button type="button" variant="secondary" onClick={() => void loadUsers()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Danh sách</p><h3>Người dùng hệ thống</h3></div><Badge tone="info">{users.length} user</Badge></CardHeader>
          <CardContent>
            {loading ? <p className="page-state">Đang tải users...</p> : null}
            {!loading ? <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Username</th><th>Role</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.username}</td><td>{user.role}</td><td>{user.branchName ?? '-'}</td><td><Badge tone={user.active ? 'success' : 'danger'}>{user.active ? 'Active' : 'Inactive'}</Badge></td><td><Button type="button" size="sm" variant="ghost" onClick={() => void toggleUser(user)}>{user.active ? 'Khóa' : 'Mở'}</Button></td></tr>)}</tbody></table></div> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Tạo mới</p><h3>Thêm user</h3></div></CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitCreate}>
              <label className="field"><span>Username</span><Input required value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} /></label>
              <label className="field"><span>Password</span><Input required type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <div className="form-grid form-grid--two">
                <label className="field"><span>Role</span><Input required value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} /></label>
                <label className="field"><span>Branch ID</span><Input value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} /></label>
              </div>
              <Button type="submit" full>Tạo user</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

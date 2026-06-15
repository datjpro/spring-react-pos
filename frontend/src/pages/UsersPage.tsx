import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { getBranches } from '../services/masterData'
import { createUser, getUsers, updateUserActive } from '../services/users'
import type { UserMeResponse } from '../types/auth'
import type { Branch } from '../types/masterData'
import { getApiErrorMessage } from '../utils/apiError'

const roles = ['ADMIN', 'MANAGER', 'STAFF']

export function UsersPage() {
  const { t } = useI18n()
  const [users, setUsers] = useState<UserMeResponse[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [form, setForm] = useState({ username: '', password: '', role: 'STAFF', branchId: '', active: true })

  useEffect(() => {
    void loadUsers()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [users.length])

  async function loadUsers() {
    setLoading(true)
    setMessage(null)
    try {
      const [userData, branchData] = await Promise.all([getUsers(), getBranches()])
      setUsers(userData)
      setBranches(branchData.filter((branch) => branch.active))
    } catch (error) {
      setMessageSuccess(false)
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const pagedUsers = users.slice(page * pageSize, page * pageSize + pageSize)

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createUser({
        username: form.username,
        password: form.password,
        role: form.role,
        branchId: form.branchId ? Number(form.branchId) : null,
        active: form.active,
      })
      setForm({ username: '', password: '', role: 'STAFF', branchId: '', active: true })
      setMessageSuccess(true)
      setMessage(t('users.saved'))
      await loadUsers()
    } catch (error) {
      setMessageSuccess(false)
      setMessage(getApiErrorMessage(error))
    }
  }

  async function toggleUser(user: UserMeResponse) {
    setMessage(null)
    try {
      await updateUserActive(user.id, !user.active)
      await loadUsers()
    } catch (error) {
      setMessageSuccess(false)
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">System</p>
          <h2 className="page-header__title">{t('users.title')}</h2>
          <p className="page-header__description">{t('users.description')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadUsers()} disabled={loading}>
          {t('common.reload')}
        </Button>
      </header>

      {message ? <p className={messageSuccess ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">List</p>
              <h3>{t('users.listTitle')}</h3>
            </div>
            <Badge tone="info">
              {users.length} {t('common.users')}
            </Badge>
          </CardHeader>
          <CardContent>
            {loading ? <p className="page-state">{t('common.loading')}</p> : null}
            {!loading ? (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>{t('common.username')}</th>
                      <th>{t('common.role')}</th>
                      <th>{t('common.branch')}</th>
                      <th>{t('common.status')}</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td>{user.branchName ?? '-'}</td>
                        <td>
                          <Badge tone={user.active ? 'success' : 'danger'}>{user.active ? t('common.active') : t('common.inactive')}</Badge>
                        </td>
                        <td>
                          <Button type="button" size="sm" variant="ghost" onClick={() => void toggleUser(user)}>
                            {user.active ? t('users.lock') : t('users.unlock')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <PaginationBar page={page} totalPages={Math.ceil(users.length / pageSize)} totalElements={users.length} size={pageSize} onPageChange={setPage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Create</p>
              <h3>{t('users.createTitle')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitCreate}>
              <label className="field">
                <span>{t('common.username')}</span>
                <Input required value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t('common.password')}</span>
                <Input required type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>{t('common.role')}</span>
                  <select className="ui-input" required value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{t('common.branch')}</span>
                  <select className="ui-input" value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}>
                    <option value="">{t('users.noBranch')}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button type="submit" full>
                {t('users.create')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

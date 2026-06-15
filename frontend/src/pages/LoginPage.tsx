import { FormEvent, useState } from 'react'
import { LockKeyhole, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../store/auth'

export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('postgres')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(username, password)
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(nextPath, { replace: true })
    } catch {
      setError(t('login.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="page-header__eyebrow">Authentication</p>
        <h1 className="auth-card__title">{t('login.title')}</h1>
        <p className="auth-card__subtitle">{t('login.description')}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t('common.username')}</span>
            <div className="field__control">
              <UserRound size={16} />
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="admin" />
            </div>
          </label>

          <label className="field">
            <span>{t('common.password')}</span>
            <div className="field__control">
              <LockKeyhole size={16} />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="postgres" />
            </div>
          </label>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button type="submit" className="primary-button primary-button--full" disabled={submitting}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </section>
    </main>
  )
}

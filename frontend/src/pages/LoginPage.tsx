import { FormEvent, useState } from 'react'
import { LockKeyhole, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function LoginPage() {
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
      setError('Login failed. Check username/password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="page-header__eyebrow">Authentication</p>
        <h1 className="auth-card__title">POS Admin Login</h1>
        <p className="auth-card__subtitle">Sign in with backend admin account. Demo default stays prefilled for quick access.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <div className="field__control">
              <UserRound size={16} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="admin"
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field__control">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="postgres"
              />
            </div>
          </label>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button type="submit" className="primary-button primary-button--full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}

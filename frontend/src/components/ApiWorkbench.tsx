import { FormEvent, ReactNode, useMemo, useState } from 'react'
import { Activity, Play, Sparkles } from 'lucide-react'
import { getApiErrorMessage } from '../utils/apiError'

export interface WorkbenchAction {
  name: string
  description: string
  run: () => Promise<unknown>
}

interface ApiWorkbenchProps {
  title: string
  eyebrow: string
  actions: WorkbenchAction[]
  children?: ReactNode
}

export function ApiWorkbench({ title, eyebrow, actions, children }: ApiWorkbenchProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  const latestResult = useMemo(() => {
    if (!result) {
      return 'No action executed yet.'
    }

    return JSON.stringify(result, null, 2)
  }, [result])

  async function runAction(action: WorkbenchAction) {
    setLoadingAction(action.name)
    setError(null)

    try {
      const actionResult = await action.run()
      setResult(actionResult)
    } catch (actionError) {
      setError(getApiErrorMessage(actionError))
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">{eyebrow}</p>
          <h2 className="page-header__title">{title}</h2>
          <p className="page-header__description">Live API workbench giữ backend contract thật, bọc lại bằng admin UI dễ dùng hơn.</p>
        </div>
      </header>

      {children}

      <section className="panel panel--soft">
        <div className="panel__header">
          <div>
            <p className="panel__eyebrow">Quick Actions</p>
            <h3>Run backend endpoints</h3>
          </div>
          <span className="inline-badge inline-badge--info">
            <Sparkles size={14} />
            {actions.length} actions
          </span>
        </div>

        <div className="workbench-grid">
          {actions.map((action) => (
            <article key={action.name} className="action-card">
              <div>
                <h3>{action.name}</h3>
                <p>{action.description}</p>
              </div>
              <button type="button" className="primary-button" onClick={() => runAction(action)} disabled={loadingAction === action.name}>
                <Play size={14} />
                {loadingAction === action.name ? 'Running...' : 'Run action'}
              </button>
            </article>
          ))}
        </div>
      </section>

      {error ? <p className="page-state page-state--error">{error}</p> : null}

      <section className="panel result-panel">
        <div className="panel__header">
          <div>
            <p className="panel__eyebrow">Response</p>
            <h3>Latest result</h3>
          </div>
          <span className="inline-badge inline-badge--success">
            <Activity size={14} />
            Live output
          </span>
        </div>
        <pre>{latestResult}</pre>
      </section>
    </section>
  )
}

interface JsonFormProps<T> {
  title: string
  initialValue: T
  onSubmit: (value: T) => Promise<unknown>
}

export function JsonForm<T>({ title, initialValue, onSubmit }: JsonFormProps<T>) {
  const [value, setValue] = useState(JSON.stringify(initialValue, null, 2))
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const parsed = JSON.parse(value) as T
      const result = await onSubmit(parsed)
      setMessage(JSON.stringify(result, null, 2))
    } catch (formError) {
      setMessage(getApiErrorMessage(formError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="panel json-form" onSubmit={handleSubmit}>
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">JSON Form</p>
          <h3>{title}</h3>
        </div>
      </div>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={8} />
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit payload'}
      </button>
      {message ? <pre>{message}</pre> : null}
    </form>
  )
}

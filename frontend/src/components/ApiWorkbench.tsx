import { FormEvent, ReactNode, useState } from 'react'
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
    <section>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">{eyebrow}</p>
          <h2 className="page-header__title">{title}</h2>
        </div>
      </header>

      {children}

      <div className="workbench-grid">
        {actions.map((action) => (
          <article key={action.name} className="panel action-card">
            <h3>{action.name}</h3>
            <p>{action.description}</p>
            <button type="button" onClick={() => runAction(action)} disabled={loadingAction === action.name}>
              {loadingAction === action.name ? 'Running...' : 'Run'}
            </button>
          </article>
        ))}
      </div>

      {error ? <p className="page-state page-state--error">{error}</p> : null}

      <div className="panel result-panel">
        <h3>Latest result</h3>
        <pre>{result ? JSON.stringify(result, null, 2) : 'No action executed yet.'}</pre>
      </div>
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
      <h3>{title}</h3>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={8} />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
      {message ? <pre>{message}</pre> : null}
    </form>
  )
}

import type { ReactNode } from 'react'

type SectionCardProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function SectionCard({ eyebrow, title, description, action, children }: SectionCardProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          {eyebrow ? <p className="panel__eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
          {description ? <p className="page-header__description">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

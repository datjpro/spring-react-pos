import { type ReactNode } from 'react'

export interface StatCardProps {
  icon?: ReactNode
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <article className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span className="stat-card__label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span style={{ color: 'var(--primary)' }}>{icon}</span>}
            {label}
          </span>
          <strong className="stat-card__value">{value}</strong>
        </div>
        
        {trend && (
          <div 
            className="stat-card__trend"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '0.85rem',
              color: trend.positive === false ? '#fca5a5' : '#86efac',
              background: trend.positive === false ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              padding: '4px 8px',
              borderRadius: '8px'
            }}
          >
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      
      {trend && trend.label && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {trend.label}
        </div>
      )}
    </article>
  )
}

import { useEffect, useState } from 'react'
import { getProducts } from '../services/products'
import { getRevenueOverview } from '../services/reports'

export function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([getRevenueOverview(), getProducts({ size: 1 })])
      .then(([revenue, products]) => {
        setStats({
          revenue: revenue.totalRevenue,
          orders: revenue.totalOrders,
          products: products.totalElements,
        })
      })
      .catch(() => setError('Cannot load dashboard overview.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h2 className="page-header__title">POS Dashboard</h2>
        </div>
      </header>

      {loading ? <p className="page-state">Loading dashboard...</p> : null}
      {error ? <p className="page-state page-state--error">{error}</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">7-day Revenue</span>
          <strong className="stat-card__value">{stats.revenue.toLocaleString('vi-VN')} đ</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Orders</span>
          <strong className="stat-card__value">{stats.orders}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Products</span>
          <strong className="stat-card__value">{stats.products}</strong>
        </article>
      </div>
    </section>
  )
}

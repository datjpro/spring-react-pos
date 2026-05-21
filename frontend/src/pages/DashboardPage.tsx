import { ArrowRight, Boxes, ClipboardList, CreditCard, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { getProducts } from '../services/products'
import { getRevenueOverview } from '../services/reports'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function DashboardPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([getRevenueOverview(), getProducts({ size: 1 })])
      .then(([revenue, products]) => {
        setStats({
          revenue: revenue.totalRevenue,
          sales: revenue.totalOrders,
          products: products.totalElements,
        })
      })
      .catch(() => setError('Không tải được dữ liệu dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    { to: '/products', title: t('dashboard.products.title'), description: t('dashboard.products.description'), icon: Package },
    { to: '/sales', title: t('dashboard.sales.title'), description: t('dashboard.sales.description'), icon: ClipboardList },
    { to: '/pos', title: t('dashboard.pos.title'), description: t('dashboard.pos.description'), icon: CreditCard },
    { to: '/inventory', title: t('dashboard.inventory.title'), description: t('dashboard.inventory.description'), icon: Boxes },
  ]

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h2 className="page-header__title">{t('dashboard.title')}</h2>
          <p className="page-header__description">{t('dashboard.description')}</p>
        </div>
      </header>

      {loading ? <p className="page-state">Đang tải dashboard...</p> : null}
      {error ? <p className="page-state page-state--error">{error}</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">7-day Revenue</span>
          <strong className="stat-card__value">{formatCurrency(stats.revenue)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Sales</span>
          <strong className="stat-card__value">{stats.sales}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Products</span>
          <strong className="stat-card__value">{stats.products}</strong>
        </article>
      </div>

      <div className="quick-grid">
        {quickLinks.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="quick-card">
            <div className="quick-card__icon">
              <Icon size={18} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        ))}
      </div>
    </section>
  )
}

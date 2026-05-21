import { ArrowRight, Boxes, ClipboardList, CreditCard, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { getProducts } from '../services/products'
import { getRevenueOverview } from '../services/reports'
import { useAuth } from '../store/auth'
import { hasMinimumRole } from '../utils/roles'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function DashboardPage() {
  const { t, language } = useI18n()
  const { me } = useAuth()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  const canViewManagement = hasMinimumRole(me?.role, 'MANAGER')
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0 })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setNotice(null)

    if (!canViewManagement) {
      setStats({ revenue: 0, sales: 0, products: 0 })
      setLoading(false)
      return
    }

    Promise.allSettled([getRevenueOverview(), getProducts({ size: 1 })])
      .then(([revenueResult, productsResult]) => {
        setStats({
          revenue: revenueResult.status === 'fulfilled' ? revenueResult.value.totalRevenue : 0,
          sales: revenueResult.status === 'fulfilled' ? revenueResult.value.totalOrders : 0,
          products: productsResult.status === 'fulfilled' ? productsResult.value.totalElements : 0,
        })

        if (revenueResult.status === 'rejected' || productsResult.status === 'rejected') {
          setNotice(tr('Một số chỉ số bị ẩn do quyền tài khoản hoặc API chưa sẵn sàng.', 'Some metrics are hidden because of account permissions or unavailable APIs.'))
        }
      })
      .finally(() => setLoading(false))
  }, [canViewManagement, language])

  const quickLinks = [
    ...(canViewManagement ? [{ to: '/products', title: t('dashboard.products.title'), description: t('dashboard.products.description'), icon: Package }] : []),
    ...(canViewManagement ? [{ to: '/sales', title: t('dashboard.sales.title'), description: t('dashboard.sales.description'), icon: ClipboardList }] : []),
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

      {loading ? <p className="page-state">{tr('Đang tải dashboard...', 'Loading dashboard...')}</p> : null}
      {notice ? <p className="page-state page-state--error">{notice}</p> : null}

      {canViewManagement ? (
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
      ) : (
        <p className="page-state">{tr('Tài khoản STAFF chỉ dùng POS và tồn kho chi nhánh được phân quyền.', 'STAFF can use POS and permitted branch inventory only.')}</p>
      )}

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

import { ArrowRight, Boxes, CreditCard, Package, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../services/products'
import { getRevenueOverview } from '../services/reports'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const quickLinks = [
  { to: '/products', title: 'Quản lý sản phẩm', description: 'Cập nhật SKU, giá bán, trạng thái', icon: Package },
  { to: '/orders', title: 'Theo dõi đơn hàng', description: 'Xem trạng thái đơn và thanh toán', icon: ShoppingCart },
  { to: '/pos', title: 'Bán hàng tại quầy', description: 'Tạo đơn và thu tiền nhanh', icon: CreditCard },
  { to: '/inventory', title: 'Kiểm soát tồn kho', description: 'Low-stock và biến động kho', icon: Boxes },
]

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
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h2 className="page-header__title">POS Dashboard</h2>
          <p className="page-header__description">Theo dõi doanh thu, đơn hàng và truy cập nhanh theo module nghiệp vụ.</p>
        </div>
      </header>

      {loading ? <p className="page-state">Loading dashboard...</p> : null}
      {error ? <p className="page-state page-state--error">{error}</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">7-day Revenue</span>
          <strong className="stat-card__value">{formatCurrency(stats.revenue)}</strong>
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

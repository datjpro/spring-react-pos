import { ArrowRight, Boxes, ClipboardList, CreditCard, Package, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { getProducts } from '../services/products'
import { getRevenueOverview, getInventorySummaryReport } from '../services/reports'
import { getSales } from '../services/transactions'
import { useAuth } from '../store/auth'
import { hasMinimumRole } from '../utils/roles'
import { StatCard } from '../components/StatCard'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { Sale } from '../types/transactions'
import type { Product } from '../types/product'

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
  
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0, lowStock: 0 })
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setNotice(null)

    if (!canViewManagement) {
      setStats({ revenue: 0, sales: 0, products: 0, lowStock: 0 })
      setLoading(false)
      return
    }

    Promise.allSettled([
      getRevenueOverview(), 
      getProducts({ size: 100 }), 
      getInventorySummaryReport(),
      getSales()
    ])
      .then(([revenueResult, productsResult, inventoryResult, salesResult]) => {
        
        const lowStockCount = inventoryResult.status === 'fulfilled' ? inventoryResult.value.lowStockProducts : 0
        
        setStats({
          revenue: revenueResult.status === 'fulfilled' ? revenueResult.value.totalRevenue : 0,
          sales: revenueResult.status === 'fulfilled' ? revenueResult.value.totalOrders : 0,
          products: productsResult.status === 'fulfilled' ? productsResult.value.totalElements : 0,
          lowStock: lowStockCount
        })

        if (salesResult.status === 'fulfilled') {
          // Sort by newest first and take 5
          const sortedSales = salesResult.value
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
          setRecentSales(sortedSales)
        }

        if (productsResult.status === 'fulfilled') {
          const lowStock = productsResult.value.content
            .filter(p => p.stock <= 5 && p.active)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
          setLowStockProducts(lowStock)
        }

        if (revenueResult.status === 'rejected' || productsResult.status === 'rejected') {
          setNotice(tr('Một số chỉ số bị ẩn do quyền tài khoản hoặc API chưa sẵn sàng.', 'Some metrics are hidden because of account permissions or unavailable APIs.'))
        }
      })
      .finally(() => setLoading(false))
  }, [canViewManagement, language])

  const quickLinks = [
    { to: '/pos', title: t('dashboard.pos.title'), description: t('dashboard.pos.description'), icon: CreditCard },
    { to: '/inventory', title: t('dashboard.inventory.title'), description: t('dashboard.inventory.description'), icon: Boxes },
    ...(canViewManagement ? [{ to: '/products', title: t('dashboard.products.title'), description: t('dashboard.products.description'), icon: Package }] : []),
    ...(canViewManagement ? [{ to: '/sales', title: t('dashboard.sales.title'), description: t('dashboard.sales.description'), icon: ClipboardList }] : []),
    ...(canViewManagement ? [{ to: '/reports', title: tr('Báo cáo', 'Reports'), description: tr('Xem thống kê doanh thu', 'View revenue stats'), icon: TrendingUp }] : []),
  ]

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Overview</p>
          <h2 className="page-header__title">{t('dashboard.title')}</h2>
          <p className="page-header__description">{t('dashboard.description')}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {loading ? <p className="page-state">{tr('Đang tải dashboard...', 'Loading dashboard...')}</p> : null}
      {notice ? <p className="page-state page-state--error">{notice}</p> : null}

      {canViewManagement ? (
        <div className="stats-grid catalog-stats">
          <StatCard 
            label={tr('Doanh thu (7 ngày)', '7-day Revenue')} 
            value={formatCurrency(stats.revenue)} 
            icon={<TrendingUp size={18} />} 
          />
          <StatCard 
            label={tr('Đơn hàng (7 ngày)', 'Sales (7-day)')} 
            value={stats.sales} 
            icon={<ClipboardList size={18} />} 
          />
          <StatCard 
            label={tr('Sản phẩm', 'Total Products')} 
            value={stats.products} 
            icon={<Package size={18} />} 
          />
          <StatCard 
            label={tr('Sắp hết hàng', 'Low Stock')} 
            value={stats.lowStock} 
            icon={<AlertTriangle size={18} />} 
          />
        </div>
      ) : (
        <p className="page-state">{tr('Tài khoản STAFF chỉ dùng POS và tồn kho chi nhánh được phân quyền.', 'STAFF can use POS and permitted branch inventory only.')}</p>
      )}

      {canViewManagement && (
        <div className="catalog-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          <Card>
            <CardHeader>
              <div><p className="panel__eyebrow">Activity</p><h3>{tr('Giao dịch gần đây', 'Recent Sales')}</h3></div>
              <Clock size={20} style={{ color: 'var(--text-muted)' }} />
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <p className="page-state" style={{ padding: '24px 0' }}>{tr('Chưa có giao dịch nào.', 'No recent transactions.')}</p>
              ) : (
                <div className="detail-list">
                  {recentSales.map(sale => (
                    <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 4 }}>{sale.saleCode}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(sale.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block', color: 'var(--success)' }}>{formatCurrency(sale.totalAmount)}</strong>
                        <Badge tone={sale.status === 'COMPLETED' ? 'success' : 'danger'}>{sale.status}</Badge>
                      </div>
                    </div>
                  ))}
                  <Link to="/sales" style={{ display: 'inline-block', marginTop: 16, color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
                    {tr('Xem tất cả giao dịch →', 'View all transactions →')}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div><p className="panel__eyebrow">Alerts</p><h3>{tr('Sắp hết hàng', 'Low Stock Alerts')}</h3></div>
              <AlertTriangle size={20} style={{ color: 'var(--warning-dark, #d97706)' }} />
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="page-state" style={{ padding: '24px 0' }}>{tr('Tuyệt vời, tất cả sản phẩm đều đủ hàng.', 'Great, all products are well stocked.')}</p>
              ) : (
                <div className="detail-list">
                  {lowStockProducts.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 4 }}>{product.name}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</span>
                      </div>
                      <Badge tone={product.stock === 0 ? 'danger' : 'warning'}>
                        {tr('Còn', 'Stock')}: {product.stock}
                      </Badge>
                    </div>
                  ))}
                  <Link to="/inventory" style={{ display: 'inline-block', marginTop: 16, color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
                    {tr('Kiểm tra tồn kho →', 'Check inventory →')}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="quick-grid" style={{ marginTop: 24 }}>
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

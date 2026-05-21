import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { exportReportCsv, getInventorySummaryReport, getProfitReport, getRevenueReport, getTopProductsReport } from '../services/reports'
import type { InventorySummaryResponse, ProfitReportResponse, RevenueReportResponse, TopProductResponse } from '../types/report'
import { getApiErrorMessage } from '../utils/apiError'
import { getLast7DaysRange } from '../utils/dateRange'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

export function ReportsPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  const initialRange = getLast7DaysRange()
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [revenue, setRevenue] = useState<RevenueReportResponse | null>(null)
  const [profit, setProfit] = useState<ProfitReportResponse | null>(null)
  const [inventory, setInventory] = useState<InventorySummaryResponse | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductResponse[]>([])
  const [csvPreview, setCsvPreview] = useState('No export generated yet.')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setMessage(null)
    try {
      const [revenueData, profitData, inventoryData, topProductsData] = await Promise.all([
        getRevenueReport({ from, to, groupBy: 'day' }),
        getProfitReport({ from, to, groupBy: 'day' }),
        getInventorySummaryReport(),
        getTopProductsReport({ from, to, limit: 5, sortBy: 'quantity' }),
      ])
      setRevenue(revenueData)
      setProfit(profitData)
      setInventory(inventoryData)
      setTopProducts(topProductsData)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function exportCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const csv = await exportReportCsv({ type: 'revenue', from, to, groupBy: 'day' })
      setCsvPreview(csv)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">{tr('Báo cáo', 'Reports')}</p>
          <h2 className="page-header__title">{tr('Báo cáo vận hành', 'Operations reports')}</h2>
          <p className="page-header__description">{tr('Theo dõi doanh thu, lợi nhuận, tồn kho và sản phẩm bán chạy.', 'Track revenue, profit, inventory, and top-selling products.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadReports()} disabled={loading}>{tr('Tải lại', 'Reload')}</Button>
      </header>
      {message ? <p className="page-state page-state--error">{message}</p> : null}

      <Card>
        <CardHeader><div><p className="panel__eyebrow">Filters</p><h3>{tr('Bộ lọc báo cáo', 'Report filters')}</h3></div></CardHeader>
        <CardContent><form className="form-grid form-grid--three" onSubmit={exportCsv}><label className="field"><span>From</span><Input value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="field"><span>To</span><Input value={to} onChange={(event) => setTo(event.target.value)} /></label><Button type="button" variant="secondary" onClick={() => void loadReports()} disabled={loading}>{tr('Áp dụng', 'Apply')}</Button></form></CardContent>
      </Card>

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><span>Revenue</span><strong>{formatCurrency(revenue?.totalRevenue ?? 0)}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>Profit</span><strong>{formatCurrency(profit?.totalProfit ?? 0)}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>{tr('Tổng tồn', 'Total stock')}</span><strong>{inventory?.totalStock ?? 0}</strong></CardContent></Card>
      </div>

      <div className="catalog-grid">
        <Card><CardHeader><div><p className="panel__eyebrow">Top products</p><h3>{tr('Sản phẩm bán chạy', 'Top products')}</h3></div><Badge tone="info">{topProducts.length}</Badge></CardHeader><CardContent>{loading ? <p className="page-state">{tr('Đang tải reports...', 'Loading reports...')}</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>SKU</th><th>Name</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>{topProducts.map((product) => <tr key={product.productId}><td>{product.sku}</td><td>{product.productName}</td><td>{product.totalQuantity}</td><td>{formatCurrency(product.totalRevenue)}</td></tr>)}</tbody></table></div>}</CardContent></Card>
        <Card><CardHeader><div><p className="panel__eyebrow">Inventory summary</p><h3>{tr('Tổng quan tồn kho', 'Inventory summary')}</h3></div></CardHeader><CardContent><div className="detail-list"><div className="summary-block__row"><span>{tr('Tổng sản phẩm', 'Total products')}</span><strong>{inventory?.totalProducts ?? 0}</strong></div><div className="summary-block__row"><span>{tr('Sản phẩm hoạt động', 'Active products')}</span><strong>{inventory?.activeProducts ?? 0}</strong></div><div className="summary-block__row"><span>{tr('Sắp hết hàng', 'Low stock')}</span><strong>{inventory?.lowStockProducts ?? 0}</strong></div><div className="summary-block__row"><span>{tr('Hết hàng', 'Out of stock')}</span><strong>{inventory?.outOfStockProducts ?? 0}</strong></div></div></CardContent></Card>
      </div>

      <Card><CardHeader><div><p className="panel__eyebrow">Export</p><h3>CSV preview</h3></div><Badge tone="neutral">revenue.csv</Badge></CardHeader><CardContent><form className="form-grid" onSubmit={exportCsv}><Button type="submit">{tr('Xuất CSV', 'Export CSV')}</Button><pre className="report-preview-box">{csvPreview}</pre></form></CardContent></Card>
    </section>
  )
}

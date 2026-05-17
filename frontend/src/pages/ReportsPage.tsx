import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { exportReportCsv, getInventorySummaryReport, getProfitReport, getRevenueReport, getTopProductsReport } from '../services/reports'
import { getLast7DaysRange } from '../utils/dateRange'
import type { InventorySummaryResponse, ProfitReportResponse, RevenueReportResponse, TopProductResponse } from '../types/report'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

export function ReportsPage() {
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

  useEffect(() => { void loadReports() }, [])

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
    setMessage(null)
    try {
      const csv = await exportReportCsv({ type: 'revenue', from, to, groupBy: 'day' })
      setCsvPreview(csv.slice(0, 800))
      setMessage('Đã xuất CSV preview.')
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">Reporting</p><h2 className="page-header__title">Reports</h2><p className="page-header__description">Tổng hợp doanh thu, lợi nhuận, tồn kho và top sản phẩm theo thời gian.</p></div><Button type="button" variant="secondary" onClick={() => void loadReports()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <Card><CardHeader><div><p className="panel__eyebrow">Range</p><h3>Bộ lọc báo cáo</h3></div></CardHeader><CardContent><form className="form-grid form-grid--three" onSubmit={exportCsv}><label className="field"><span>From</span><Input value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="field"><span>To</span><Input value={to} onChange={(event) => setTo(event.target.value)} /></label><Button type="button" variant="secondary" onClick={() => void loadReports()} disabled={loading}>Áp dụng</Button></form></CardContent></Card>
      <div className="stats-grid catalog-stats"><Card><CardContent className="metric-card"><span>Revenue</span><strong>{formatCurrency(revenue?.totalRevenue ?? 0)}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Profit</span><strong>{formatCurrency(profit?.totalProfit ?? 0)}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Total stock</span><strong>{inventory?.totalStock ?? 0}</strong></CardContent></Card></div>
      <div className="catalog-grid">
        <Card><CardHeader><div><p className="panel__eyebrow">Top products</p><h3>Sản phẩm bán chạy</h3></div><Badge tone="info">{topProducts.length}</Badge></CardHeader><CardContent>{loading ? <p className="page-state">Đang tải reports...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>SKU</th><th>Name</th><th>Qty</th><th>Revenue</th></tr></thead><tbody>{topProducts.map((product) => <tr key={product.productId}><td>{product.sku}</td><td>{product.productName}</td><td>{product.totalQuantity}</td><td>{formatCurrency(product.totalRevenue)}</td></tr>)}</tbody></table></div>}</CardContent></Card>
        <Card><CardHeader><div><p className="panel__eyebrow">Inventory summary</p><h3>Tổng quan tồn kho</h3></div></CardHeader><CardContent><div className="detail-list"><div className="summary-block__row"><span>Total products</span><strong>{inventory?.totalProducts ?? 0}</strong></div><div className="summary-block__row"><span>Active products</span><strong>{inventory?.activeProducts ?? 0}</strong></div><div className="summary-block__row"><span>Low stock</span><strong>{inventory?.lowStockProducts ?? 0}</strong></div><div className="summary-block__row"><span>Out of stock</span><strong>{inventory?.outOfStockProducts ?? 0}</strong></div></div></CardContent></Card>
      </div>
      <Card><CardHeader><div><p className="panel__eyebrow">Export</p><h3>CSV preview</h3></div><Badge tone="neutral">revenue.csv</Badge></CardHeader><CardContent><form className="form-grid" onSubmit={exportCsv}><Button type="submit">Xuất CSV</Button><pre className="report-preview-box">{csvPreview}</pre></form></CardContent></Card>
    </section>
  )
}

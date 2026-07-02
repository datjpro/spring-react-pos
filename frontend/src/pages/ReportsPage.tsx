import { useEffect, useState } from 'react'
import { Download, RefreshCw, BarChart2, Package, TrendingUp, Filter } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { StatCard } from '../components/StatCard'
import { useI18n } from '../i18n'
import { useToast } from '../store/toast'
import { 
  exportReportCsv, 
  getInventorySummaryReport, 
  getProfitReport, 
  getRevenueReport, 
  getTopProductsReport,
  getPurchaseSummaryReport,
  getSalesSummaryReport
} from '../services/reports'
import type { 
  InventorySummaryResponse, 
  ProfitReportResponse, 
  RevenueReportResponse, 
  TopProductResponse,
  PurchaseSummaryResponse,
  SalesSummaryResponse
} from '../types/report'
import { getApiErrorMessage } from '../utils/apiError'
import { getLast7DaysRange } from '../utils/dateRange'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function formatDateForInput(isoString: string) {
  return isoString.split('T')[0]
}

export function ReportsPage() {
  const { language } = useI18n()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  
  const initialRange = getLast7DaysRange()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [fromDate, setFromDate] = useState(formatDateForInput(initialRange.from))
  const [toDate, setToDate] = useState(formatDateForInput(initialRange.to))
  
  const [revenue, setRevenue] = useState<RevenueReportResponse | null>(null)
  const [profit, setProfit] = useState<ProfitReportResponse | null>(null)
  const [inventory, setInventory] = useState<InventorySummaryResponse | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductResponse[]>([])
  
  const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummaryResponse | null>(null)
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Preset Date Ranges
  function setPresetRange(days: number) {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - days)
    
    setFromDate(formatDateForInput(from.toISOString()))
    setToDate(formatDateForInput(now.toISOString()))
  }

  function setThisMonth() {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    
    setFromDate(formatDateForInput(from.toISOString()))
    setToDate(formatDateForInput(now.toISOString()))
  }

  useEffect(() => {
    void loadReports()
  }, [activeTab])

  async function loadReports() {
    setLoading(true)
    try {
      const fromIso = `${fromDate}T00:00:00Z`
      const toIso = `${toDate}T23:59:59Z`

      if (activeTab === 'overview') {
        const [rev, pro, inv] = await Promise.all([
          getRevenueReport({ from: fromIso, to: toIso, groupBy: 'day' }),
          getProfitReport({ from: fromIso, to: toIso, groupBy: 'day' }),
          getInventorySummaryReport(),
        ])
        setRevenue(rev)
        setProfit(pro)
        setInventory(inv)
      } 
      else if (activeTab === 'products') {
        setTopProducts(await getTopProductsReport({ from: fromIso, to: toIso, limit: 10, sortBy: 'quantity' }))
      }
      else if (activeTab === 'transactions') {
        const [purchases, sales] = await Promise.all([
          getPurchaseSummaryReport({ from: fromIso, to: toIso }),
          getSalesSummaryReport({ from: fromIso, to: toIso })
        ])
        setPurchaseSummary(purchases)
        setSalesSummary(sales)
      }
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportCsv(type: string) {
    setExporting(true)
    try {
      const fromIso = `${fromDate}T00:00:00Z`
      const toIso = `${toDate}T23:59:59Z`
      const csvContent = await exportReportCsv({ type, from: fromIso, to: toIso, groupBy: 'day' })
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${type}_report_${fromDate}_${toDate}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      addToast(tr('Đã xuất báo cáo', 'Report exported'), 'success')
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">{tr('Báo cáo', 'Reports')}</p>
          <h2 className="page-header__title">{tr('Báo cáo vận hành', 'Operations reports')}</h2>
          <p className="page-header__description">{tr('Phân tích doanh thu, lợi nhuận, tồn kho và sản phẩm bán chạy.', 'Analyze revenue, profit, inventory, and top-selling products.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadReports()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      {/* Date Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <label className="field">
                <span>{tr('Từ ngày', 'From')}</span>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </label>
              <label className="field">
                <span>{tr('Đến ngày', 'To')}</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </label>
              <Button type="button" onClick={() => void loadReports()} disabled={loading} style={{ marginBottom: '2px' }}>
                <Filter size={16} /> {tr('Lọc', 'Filter')}
              </Button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
              <Button variant="ghost" size="sm" onClick={() => setPresetRange(0)}>{tr('Hôm nay', 'Today')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setPresetRange(6)}>{tr('7 ngày', '7 days')}</Button>
              <Button variant="ghost" size="sm" onClick={() => setPresetRange(29)}>{tr('30 ngày', '30 days')}</Button>
              <Button variant="ghost" size="sm" onClick={setThisMonth}>{tr('Tháng này', 'This month')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs 
        tabs={[
          { id: 'overview', label: tr('Tổng quan', 'Overview'), icon: <BarChart2 size={16} /> },
          { id: 'products', label: tr('Sản phẩm bán chạy', 'Top Products'), icon: <TrendingUp size={16} /> },
          { id: 'transactions', label: tr('Tổng hợp Nhập/Bán', 'Transactions'), icon: <Package size={16} /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {loading ? (
        <div className="empty-state">
          <RefreshCw size={32} className="icon-spin" style={{ color: 'var(--text-muted)' }} />
          <p>{tr('Đang tải dữ liệu...', 'Loading data...')}</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="catalog-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="stats-grid catalog-stats">
                <StatCard 
                  label={tr('Tổng doanh thu', 'Total Revenue')} 
                  value={formatCurrency(revenue?.totalRevenue ?? 0)}
                  icon={<TrendingUp size={18} />}
                />
                <StatCard 
                  label={tr('Tổng lợi nhuận', 'Total Profit')} 
                  value={formatCurrency(profit?.totalProfit ?? 0)}
                  icon={<BarChart2 size={18} />}
                />
                <StatCard 
                  label={tr('Tổng đơn hàng', 'Total Orders')} 
                  value={revenue?.totalOrders ?? 0}
                  icon={<Package size={18} />}
                />
              </div>

              <div className="catalog-grid">
                <Card>
                  <CardHeader>
                    <div>
                      <p className="panel__eyebrow">Inventory summary</p>
                      <h3>{tr('Tổng quan tồn kho', 'Inventory summary')}</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="detail-list">
                      <div className="summary-block__row">
                        <span>{tr('Tổng sản phẩm', 'Total products')}</span>
                        <strong>{inventory?.totalProducts ?? 0}</strong>
                      </div>
                      <div className="summary-block__row">
                        <span>{tr('Tổng tồn kho (SL)', 'Total stock units')}</span>
                        <strong>{inventory?.totalStock ?? 0}</strong>
                      </div>
                      <div className="summary-block__row">
                        <span>{tr('Sắp hết hàng (≤ 5)', 'Low stock (≤ 5)')}</span>
                        <strong style={{ color: 'var(--warning-dark, #d97706)' }}>{inventory?.lowStockProducts ?? 0}</strong>
                      </div>
                      <div className="summary-block__row">
                        <span>{tr('Hết hàng (= 0)', 'Out of stock')}</span>
                        <strong style={{ color: 'var(--danger)' }}>{inventory?.outOfStockProducts ?? 0}</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <p className="panel__eyebrow">Export data</p>
                      <h3>{tr('Xuất dữ liệu CSV', 'Export CSV')}</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                      {tr('Tải xuống báo cáo dạng CSV để phân tích nâng cao trên Excel.', 'Download report as CSV for advanced analysis in Excel.')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Button variant="secondary" onClick={() => handleExportCsv('revenue')} disabled={exporting}>
                        <Download size={16} /> {tr('Doanh thu theo ngày', 'Daily Revenue')}
                      </Button>
                      <Button variant="secondary" onClick={() => handleExportCsv('top_products')} disabled={exporting}>
                        <Download size={16} /> {tr('Sản phẩm bán chạy', 'Top Products')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <Card>
              <CardHeader>
                <div>
                  <p className="panel__eyebrow">Top products</p>
                  <h3>{tr('Sản phẩm bán chạy', 'Top products')}</h3>
                </div>
                <Badge tone="info">Top {topProducts.length}</Badge>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="page-state">{tr('Không có dữ liệu trong khoảng thời gian này.', 'No data for this period.')}</p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table data-table--dense">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>#</th>
                          <th>SKU</th>
                          <th>{tr('Tên sản phẩm', 'Product name')}</th>
                          <th style={{ textAlign: 'center' }}>{tr('SL Đã bán', 'Qty Sold')}</th>
                          <th style={{ textAlign: 'right' }}>{tr('Doanh thu', 'Revenue')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product, index) => (
                          <tr key={product.productId}>
                            <td>{index + 1}</td>
                            <td>{product.sku}</td>
                            <td><strong>{product.productName}</strong></td>
                            <td style={{ textAlign: 'center' }}><Badge tone="success">{product.totalQuantity}</Badge></td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(product.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => handleExportCsv('top_products')} disabled={exporting}>
                    <Download size={16} /> {tr('Xuất báo cáo (CSV)', 'Export Report (CSV)')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'transactions' && (
            <div className="catalog-grid">
              <Card>
                <CardHeader>
                  <div>
                    <p className="panel__eyebrow">Purchases</p>
                    <h3>{tr('Tổng hợp Nhập kho', 'Purchase Summary')}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="detail-list" style={{ marginBottom: 24 }}>
                    <div className="summary-block__row">
                      <span>{tr('Số phiếu nhập', 'Total purchases')}</span>
                      <strong>{purchaseSummary?.totalPurchases ?? 0}</strong>
                    </div>
                    <div className="summary-block__row">
                      <span>{tr('Tổng sản phẩm', 'Total quantity')}</span>
                      <strong>{purchaseSummary?.totalQuantity ?? 0}</strong>
                    </div>
                    <div className="summary-block__row summary-block__row--total">
                      <span>{tr('Tổng giá trị', 'Total amount')}</span>
                      <strong style={{ color: 'var(--danger)' }}>{formatCurrency(purchaseSummary?.totalAmount ?? 0)}</strong>
                    </div>
                  </div>
                  <Button variant="secondary" full onClick={() => handleExportCsv('purchase_summary')} disabled={exporting}>
                    <Download size={16} /> {tr('Xuất danh sách phiếu nhập (CSV)', 'Export Purchases (CSV)')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <p className="panel__eyebrow">Sales</p>
                    <h3>{tr('Tổng hợp Bán hàng', 'Sales Summary')}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="detail-list" style={{ marginBottom: 24 }}>
                    <div className="summary-block__row">
                      <span>{tr('Số hóa đơn', 'Total sales')}</span>
                      <strong>{salesSummary?.totalSales ?? 0}</strong>
                    </div>
                    <div className="summary-block__row">
                      <span>{tr('Tổng sản phẩm', 'Total quantity')}</span>
                      <strong>{salesSummary?.totalQuantity ?? 0}</strong>
                    </div>
                    <div className="summary-block__row summary-block__row--total">
                      <span>{tr('Tổng giá trị', 'Total amount')}</span>
                      <strong style={{ color: 'var(--success)' }}>{formatCurrency(salesSummary?.totalAmount ?? 0)}</strong>
                    </div>
                  </div>
                  <Button variant="secondary" full onClick={() => handleExportCsv('sales_summary')} disabled={exporting}>
                    <Download size={16} /> {tr('Xuất danh sách hóa đơn (CSV)', 'Export Sales (CSV)')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </section>
  )
}

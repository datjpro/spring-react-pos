import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { createSale, getSales } from '../services/transactions'
import type { CreateSaleRequest, Sale } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptySale: CreateSaleRequest = { branchId: 1, note: '', items: [{ productId: 1, quantity: 1 }] }

export function SalesPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [sales, setSales] = useState<Sale[]>([])
  const [form, setForm] = useState<CreateSaleRequest>(emptySale)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const totalAmount = useMemo(() => sales.reduce((sum, item) => sum + item.totalAmount, 0), [sales])
  const pagedSales = useMemo(() => sales.slice(page * pageSize, page * pageSize + pageSize), [page, sales])

  useEffect(() => {
    void loadSales()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [sales.length])

  async function loadSales() {
    setLoading(true)
    setMessage(null)
    try {
      setSales(await getSales())
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await createSale(form)
      setForm(emptySale)
      setMessage(tr('Đã tạo phiếu bán hàng.', 'Sales invoice created.'))
      await loadSales()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">{tr('Giao dịch', 'Transactions')}</p>
          <h2 className="page-header__title">{tr('Hóa đơn bán', 'Sales')}</h2>
          <p className="page-header__description">{tr('Theo dõi giao dịch bán hàng và tạo phiếu bán thủ công khi cần.', 'Track sales and create manual invoices when needed.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadSales()} disabled={loading}>
          {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      {message ? <p className={message.includes('Đã') || message.includes('created') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><span>{tr('Số phiếu bán', 'Sales count')}</span><strong>{sales.length}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>{tr('Tổng doanh số', 'Total revenue')}</span><strong>{formatCurrency(totalAmount)}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>{tr('Phiếu gần nhất', 'Latest invoice')}</span><strong>{sales[0]?.saleCode ?? '-'}</strong></CardContent></Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Ledger</p><h3>{tr('Lịch sử bán hàng', 'Sales history')}</h3></div><Badge tone="info">{sales.length}</Badge></CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải sales...', 'Loading sales...')}</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data-table data-table--dense">
                    <thead>
                      <tr><th>Code</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Trạng thái', 'Status')}</th><th>{tr('Giá trị', 'Amount')}</th><th>{tr('Người tạo', 'Created by')}</th><th>{tr('Ngày tạo', 'Created')}</th></tr>
                    </thead>
                    <tbody>
                      {pagedSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.saleCode}</td>
                          <td>{sale.branchName}</td>
                          <td><Badge tone="info">{sale.status}</Badge></td>
                          <td>{formatCurrency(sale.totalAmount)}</td>
                          <td>{sale.createdBy}</td>
                          <td>{new Date(sale.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar page={page} totalPages={Math.ceil(sales.length / pageSize)} totalElements={sales.length} size={pageSize} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create</p><h3>{tr('Tạo phiếu bán', 'Create sale')}</h3></div></CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitSale}>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Chi nhánh', 'Branch')}</span><Input required type="number" min={1} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))} /></label>
                <label className="field"><span>{tr('Sản phẩm', 'Product')}</span><Input required type="number" min={1} value={form.items[0].productId} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: Number(event.target.value) }] }))} /></label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Số lượng', 'Quantity')}</span><Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} /></label>
                <label className="field"><span>{tr('Ghi chú', 'Note')}</span><Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
              </div>
              <Button type="submit" full disabled={saving}>{saving ? tr('Đang tạo...', 'Creating...') : tr('Tạo sale', 'Create sale')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

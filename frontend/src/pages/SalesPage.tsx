import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createSale, getSales } from '../services/transactions'
import type { CreateSaleRequest, Sale } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptySale: CreateSaleRequest = { branchId: 1, note: '', items: [{ productId: 1, quantity: 1 }] }

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [form, setForm] = useState<CreateSaleRequest>(emptySale)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const totalAmount = useMemo(() => sales.reduce((sum, item) => sum + item.totalAmount, 0), [sales])

  useEffect(() => { void loadSales() }, [])

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
      setMessage('Đã tạo phiếu bán hàng.')
      await loadSales()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">Transactions</p><h2 className="page-header__title">Sales</h2><p className="page-header__description">Theo dõi giao dịch bán hàng và tạo sale thủ công khi cần.</p></div><Button type="button" variant="secondary" onClick={() => void loadSales()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <div className="stats-grid catalog-stats"><Card><CardContent className="metric-card"><span>Số phiếu bán</span><strong>{sales.length}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Tổng doanh số</span><strong>{formatCurrency(totalAmount)}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Phiếu gần nhất</span><strong>{sales[0]?.saleCode ?? '-'}</strong></CardContent></Card></div>
      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Ledger</p><h3>Lịch sử bán hàng</h3></div><Badge tone="info">{sales.length}</Badge></CardHeader>
          <CardContent>{loading ? <p className="page-state">Đang tải sales...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Branch</th><th>Status</th><th>Amount</th><th>Created by</th><th>Created</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id}><td>{sale.saleCode}</td><td>{sale.branchName}</td><td><Badge tone="info">{sale.status}</Badge></td><td>{formatCurrency(sale.totalAmount)}</td><td>{sale.createdBy}</td><td>{new Date(sale.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create</p><h3>Tạo phiếu bán</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitSale}><div className="form-grid form-grid--two"><label className="field"><span>Branch ID</span><Input required type="number" min={1} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))} /></label><label className="field"><span>Product ID</span><Input required type="number" min={1} value={form.items[0].productId} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: Number(event.target.value) }] }))} /></label></div><div className="form-grid form-grid--two"><label className="field"><span>Số lượng</span><Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} /></label><label className="field"><span>Note</span><Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label></div><Button type="submit" full disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo sale'}</Button></form></CardContent>
        </Card>
      </div>
    </section>
  )
}

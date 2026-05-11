import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createPurchase, getPurchases } from '../services/transactions'
import type { CreatePurchaseRequest, Purchase } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptyPurchase: CreatePurchaseRequest = { supplierId: 1, branchId: 1, note: '', items: [{ productId: 1, quantity: 1, unitCost: 10000 }] }

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [form, setForm] = useState<CreatePurchaseRequest>(emptyPurchase)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const totalAmount = useMemo(() => purchases.reduce((sum, item) => sum + item.totalAmount, 0), [purchases])

  useEffect(() => { void loadPurchases() }, [])

  async function loadPurchases() {
    setLoading(true)
    setMessage(null)
    try {
      setPurchases(await getPurchases())
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await createPurchase(form)
      setForm(emptyPurchase)
      setMessage('Đã tạo phiếu nhập hàng.')
      await loadPurchases()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">Transactions</p><h2 className="page-header__title">Purchases</h2><p className="page-header__description">Quản lý luồng nhập kho từ nhà cung cấp theo chi nhánh.</p></div><Button type="button" variant="secondary" onClick={() => void loadPurchases()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <div className="stats-grid catalog-stats"><Card><CardContent className="metric-card"><span>Số phiếu nhập</span><strong>{purchases.length}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Tổng tiền nhập</span><strong>{formatCurrency(totalAmount)}</strong></CardContent></Card><Card><CardContent className="metric-card"><span>Phiếu gần nhất</span><strong>{purchases[0]?.purchaseCode ?? '-'}</strong></CardContent></Card></div>
      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Ledger</p><h3>Lịch sử nhập hàng</h3></div><Badge tone="info">{purchases.length}</Badge></CardHeader>
          <CardContent>{loading ? <p className="page-state">Đang tải purchases...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Supplier</th><th>Branch</th><th>Status</th><th>Amount</th><th>Created</th></tr></thead><tbody>{purchases.map((purchase) => <tr key={purchase.id}><td>{purchase.purchaseCode}</td><td>{purchase.supplierName}</td><td>{purchase.branchName}</td><td><Badge tone="info">{purchase.status}</Badge></td><td>{formatCurrency(purchase.totalAmount)}</td><td>{new Date(purchase.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create</p><h3>Tạo phiếu nhập</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitPurchase}><div className="form-grid form-grid--two"><label className="field"><span>Supplier ID</span><Input required type="number" min={1} value={form.supplierId} onChange={(event) => setForm((current) => ({ ...current, supplierId: Number(event.target.value) }))} /></label><label className="field"><span>Branch ID</span><Input required type="number" min={1} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))} /></label></div><div className="form-grid form-grid--three"><label className="field"><span>Product ID</span><Input required type="number" min={1} value={form.items[0].productId} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: Number(event.target.value) }] }))} /></label><label className="field"><span>Qty</span><Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} /></label><label className="field"><span>Unit Cost</span><Input required type="number" min={0} value={form.items[0].unitCost} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], unitCost: Number(event.target.value) }] }))} /></label></div><label className="field"><span>Note</span><Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label><Button type="submit" full disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo purchase'}</Button></form></CardContent>
        </Card>
      </div>
    </section>
  )
}

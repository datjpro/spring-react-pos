import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { createPurchase, getPurchases } from '../services/transactions'
import type { CreatePurchaseRequest, Purchase } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptyPurchase: CreatePurchaseRequest = { supplierId: 1, branchId: 1, note: '', items: [{ productId: 1, quantity: 1, unitCost: 10000 }] }

export function PurchasesPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [form, setForm] = useState<CreatePurchaseRequest>(emptyPurchase)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const totalAmount = useMemo(() => purchases.reduce((sum, item) => sum + item.totalAmount, 0), [purchases])
  const pagedPurchases = useMemo(() => purchases.slice(page * pageSize, page * pageSize + pageSize), [page, purchases])

  useEffect(() => {
    void loadPurchases()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [purchases.length])

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
      setMessage(tr('Đã tạo phiếu nhập hàng.', 'Purchase created.'))
      await loadPurchases()
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
          <h2 className="page-header__title">{tr('Phiếu nhập', 'Purchases')}</h2>
          <p className="page-header__description">{tr('Quản lý luồng nhập kho từ nhà cung cấp theo chi nhánh.', 'Manage supplier intake by branch.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadPurchases()} disabled={loading}>
          {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      {message ? <p className={message.includes('Đã') || message.includes('created') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><span>{tr('Số phiếu nhập', 'Purchases count')}</span><strong>{purchases.length}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>{tr('Tổng tiền nhập', 'Total purchase value')}</span><strong>{formatCurrency(totalAmount)}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><span>{tr('Phiếu gần nhất', 'Latest purchase')}</span><strong>{purchases[0]?.purchaseCode ?? '-'}</strong></CardContent></Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Ledger</p><h3>{tr('Lịch sử nhập hàng', 'Purchase history')}</h3></div><Badge tone="info">{purchases.length}</Badge></CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải purchases...', 'Loading purchases...')}</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data-table data-table--dense">
                    <thead>
                      <tr><th>Code</th><th>{tr('Nhà cung cấp', 'Supplier')}</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Trạng thái', 'Status')}</th><th>{tr('Giá trị', 'Amount')}</th><th>{tr('Ngày tạo', 'Created')}</th></tr>
                    </thead>
                    <tbody>
                      {pagedPurchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td>{purchase.purchaseCode}</td>
                          <td>{purchase.supplierName}</td>
                          <td>{purchase.branchName}</td>
                          <td><Badge tone="info">{purchase.status}</Badge></td>
                          <td>{formatCurrency(purchase.totalAmount)}</td>
                          <td>{new Date(purchase.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar page={page} totalPages={Math.ceil(purchases.length / pageSize)} totalElements={purchases.length} size={pageSize} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create</p><h3>{tr('Tạo phiếu nhập', 'Create purchase')}</h3></div></CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitPurchase}>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Nhà cung cấp', 'Supplier')}</span><Input required type="number" min={1} value={form.supplierId} onChange={(event) => setForm((current) => ({ ...current, supplierId: Number(event.target.value) }))} /></label>
                <label className="field"><span>{tr('Chi nhánh', 'Branch')}</span><Input required type="number" min={1} value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))} /></label>
              </div>
              <div className="form-grid form-grid--three">
                <label className="field"><span>{tr('Sản phẩm', 'Product')}</span><Input required type="number" min={1} value={form.items[0].productId} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: Number(event.target.value) }] }))} /></label>
                <label className="field"><span>{tr('Số lượng', 'Quantity')}</span><Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} /></label>
                <label className="field"><span>{tr('Đơn giá nhập', 'Unit cost')}</span><Input required type="number" min={0} value={form.items[0].unitCost} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], unitCost: Number(event.target.value) }] }))} /></label>
              </div>
              <label className="field"><span>{tr('Ghi chú', 'Note')}</span><Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
              <Button type="submit" full disabled={saving}>{saving ? tr('Đang tạo...', 'Creating...') : tr('Tạo phiếu nhập', 'Create purchase')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

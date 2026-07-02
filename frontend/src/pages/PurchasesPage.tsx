import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, RefreshCw, FileText, Ban } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PaginationBar } from '../components/PaginationBar'
import { useToast } from '../store/toast'
import { useI18n } from '../i18n'
import { cancelPurchase, createPurchase, getPurchases } from '../services/transactions'
import { getBranches, getSuppliers } from '../services/masterData'
import { getProducts } from '../services/products'
import type { CreatePurchaseRequest, Purchase, PurchaseItem } from '../types/transactions'
import type { Branch, Supplier } from '../types/masterData'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptyPurchase: CreatePurchaseRequest = { supplierId: 0, branchId: 0, note: '', items: [{ productId: 0, quantity: 1, unitCost: 0 }] }

export function PurchasesPage() {
  const { language } = useI18n()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [activeTab, setActiveTab] = useState('list')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  
  const [branches, setBranches] = useState<Branch[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [form, setForm] = useState<CreatePurchaseRequest>(emptyPurchase)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10
  
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const pagedPurchases = useMemo(() => purchases.slice(page * pageSize, page * pageSize + pageSize), [page, purchases])

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [purchases.length])
  
  // Set default values when master data is loaded
  useEffect(() => {
    if (branches.length > 0 && suppliers.length > 0 && products.length > 0 && form.supplierId === 0) {
      setForm({
        ...form,
        supplierId: suppliers[0].id,
        branchId: branches[0].id,
        items: [{ productId: products[0].id, quantity: 1, unitCost: products[0].cost ?? 0 }]
      })
    }
  }, [branches, suppliers, products])

  async function loadData() {
    setLoading(true)
    try {
      const [purchasesData, branchesData, suppliersData, productsData] = await Promise.all([
        getPurchases(),
        getBranches().catch(() => []),
        getSuppliers().catch(() => []),
        getProducts({ size: 1000 }).then(res => res.content).catch(() => [])
      ])
      setPurchases(purchasesData)
      setBranches(branchesData)
      setSuppliers(suppliersData)
      setProducts(productsData)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await createPurchase(form)
      setForm(current => ({ ...emptyPurchase, supplierId: current.supplierId, branchId: current.branchId, items: [{ productId: current.items[0].productId, quantity: 1, unitCost: 0 }] }))
      addToast(tr('Đã tạo phiếu nhập hàng.', 'Purchase created.'), 'success')
      await loadData()
      setActiveTab('list')
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleCancelPurchase() {
    if (!selectedPurchase) return
    setCanceling(true)
    try {
      await cancelPurchase(selectedPurchase.id, cancelReason)
      addToast(tr('Đã hủy phiếu nhập.', 'Purchase cancelled.'), 'success')
      setShowCancelConfirm(false)
      setSelectedPurchase(null)
      await loadData()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setCanceling(false)
    }
  }
  
  function getStatusTone(status: string) {
    if (status === 'COMPLETED') return 'success'
    if (status === 'CANCELLED') return 'danger'
    return 'neutral'
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">{tr('Giao dịch', 'Transactions')}</p>
          <h2 className="page-header__title">{tr('Phiếu nhập kho', 'Purchases')}</h2>
          <p className="page-header__description">{tr('Quản lý luồng nhập kho từ nhà cung cấp theo chi nhánh.', 'Manage supplier intake by branch.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      <Tabs 
        tabs={[
          { id: 'list', label: tr('Danh sách phiếu nhập', 'Purchase List'), icon: <FileText size={16} /> },
          { id: 'create', label: tr('Tạo phiếu mới', 'Create Purchase'), icon: <Plus size={16} /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'list' && (
        <div className="catalog-grid">
          <Card>
            <CardHeader>
              <div><p className="panel__eyebrow">Ledger</p><h3>{tr('Lịch sử nhập hàng', 'Purchase history')}</h3></div>
              <Badge tone="info">{purchases.length}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="page-state">{tr('Đang tải...', 'Loading...')}</p>
              ) : purchases.length === 0 ? (
                <p className="page-state">{tr('Chưa có phiếu nhập nào.', 'No purchases yet.')}</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="data-table data-table--dense">
                      <thead>
                        <tr><th>Code</th><th>{tr('Nhà cung cấp', 'Supplier')}</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Trạng thái', 'Status')}</th><th>{tr('Giá trị', 'Amount')}</th><th>{tr('Ngày tạo', 'Created')}</th></tr>
                      </thead>
                      <tbody>
                        {pagedPurchases.map((purchase) => (
                          <tr 
                            key={purchase.id} 
                            onClick={() => setSelectedPurchase(purchase)}
                            style={{ cursor: 'pointer' }}
                            className="table-row-clickable"
                          >
                            <td><strong>{purchase.purchaseCode}</strong></td>
                            <td>{purchase.supplierName}</td>
                            <td>{purchase.branchName}</td>
                            <td><Badge tone={getStatusTone(purchase.status)}>{purchase.status}</Badge></td>
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
        </div>
      )}

      {activeTab === 'create' && (
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <CardHeader>
            <div><p className="panel__eyebrow">New</p><h3>{tr('Tạo phiếu nhập mới', 'Create new purchase')}</h3></div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitPurchase}>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>{tr('Nhà cung cấp', 'Supplier')}</span>
                  <Select 
                    required 
                    value={form.supplierId} 
                    onChange={(event) => setForm((current) => ({ ...current, supplierId: Number(event.target.value) }))}
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  />
                </label>
                <label className="field">
                  <span>{tr('Chi nhánh', 'Branch')}</span>
                  <Select 
                    required 
                    value={form.branchId} 
                    onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))}
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                  />
                </label>
              </div>
              
              <div style={{ padding: '16px', background: 'var(--surface-strong)', borderRadius: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>{tr('Sản phẩm nhập', 'Item')}</h4>
                <div className="form-grid form-grid--three">
                  <label className="field">
                    <span>{tr('Sản phẩm', 'Product')}</span>
                    <Select 
                      required 
                      value={form.items[0].productId} 
                      onChange={(event) => {
                        const pid = Number(event.target.value);
                        const prod = products.find(p => p.id === pid);
                        setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: pid, unitCost: prod?.cost ?? current.items[0].unitCost }] }))
                      }}
                      options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                    />
                  </label>
                  <label className="field">
                    <span>{tr('Số lượng', 'Quantity')}</span>
                    <Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} />
                  </label>
                  <label className="field">
                    <span>{tr('Đơn giá nhập', 'Unit cost')}</span>
                    <Input required type="number" min={0} value={form.items[0].unitCost} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], unitCost: Number(event.target.value) }] }))} />
                  </label>
                </div>
              </div>

              <label className="field">
                <span>{tr('Ghi chú', 'Note')}</span>
                <Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button type="submit" size="lg" disabled={saving || !form.supplierId || !form.branchId || !form.items[0].productId}>
                  {saving ? tr('Đang xử lý...', 'Processing...') : tr('Xác nhận nhập kho', 'Confirm purchase')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Purchase Details Modal */}
      <Modal
        isOpen={!!selectedPurchase && !showCancelConfirm}
        onClose={() => setSelectedPurchase(null)}
        title={tr('Chi tiết phiếu nhập', 'Purchase details')}
        maxWidth="600px"
        footer={
          <>
            {selectedPurchase?.status === 'COMPLETED' && (
              <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
                <Ban size={16} /> {tr('Hủy phiếu này', 'Cancel purchase')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelectedPurchase(null)}>{tr('Đóng', 'Close')}</Button>
          </>
        }
      >
        {selectedPurchase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{selectedPurchase.purchaseCode}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{new Date(selectedPurchase.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <Badge tone={getStatusTone(selectedPurchase.status)}>{selectedPurchase.status}</Badge>
            </div>
            
            <div className="form-grid form-grid--two">
              <div><small className="panel__eyebrow">{tr('Nhà cung cấp', 'Supplier')}</small><p style={{ margin: 0, fontWeight: 500 }}>{selectedPurchase.supplierName}</p></div>
              <div><small className="panel__eyebrow">{tr('Chi nhánh', 'Branch')}</small><p style={{ margin: 0, fontWeight: 500 }}>{selectedPurchase.branchName}</p></div>
            </div>

            <table className="data-table data-table--dense" style={{ marginTop: 8 }}>
              <thead>
                <tr>
                  <th>{tr('Sản phẩm', 'Product')}</th>
                  <th style={{ textAlign: 'center' }}>{tr('SL', 'Qty')}</th>
                  <th style={{ textAlign: 'right' }}>{tr('Đơn giá', 'Price')}</th>
                  <th style={{ textAlign: 'right' }}>{tr('Thành tiền', 'Total')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchase.items.map((item: PurchaseItem, idx) => (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitCost)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>{tr('Tổng cộng:', 'Total:')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(selectedPurchase.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Modal>

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelPurchase}
        title={tr('Xác nhận hủy phiếu nhập', 'Confirm cancellation')}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0 }}>
              {tr(`Bạn có chắc muốn hủy phiếu nhập ${selectedPurchase?.purchaseCode}? Số lượng tồn kho sẽ bị trừ đi tương ứng.`, `Are you sure you want to cancel purchase ${selectedPurchase?.purchaseCode}? Stock levels will be deducted.`)}
            </p>
            <label className="field">
              <span>{tr('Lý do hủy (bắt buộc)', 'Reason (required)')}</span>
              <Input 
                autoFocus
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)} 
                placeholder={tr('Nhập lý do hủy...', 'Enter reason...')} 
              />
            </label>
          </div>
        }
        confirmLabel={tr('Xác nhận hủy', 'Confirm cancel')}
        variant="danger"
        loading={canceling}
      />
    </section>
  )
}

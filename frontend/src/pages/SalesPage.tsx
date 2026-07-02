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
import { cancelSale, createSale, getSales } from '../services/transactions'
import { getBranches } from '../services/masterData'
import { getProducts } from '../services/products'
import type { CreateSaleRequest, Sale, SaleItem } from '../types/transactions'
import type { Branch } from '../types/masterData'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptySale: CreateSaleRequest = { branchId: 0, note: '', items: [{ productId: 0, quantity: 1 }] }

export function SalesPage() {
  const { language } = useI18n()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [activeTab, setActiveTab] = useState('list')
  const [sales, setSales] = useState<Sale[]>([])
  
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [form, setForm] = useState<CreateSaleRequest>(emptySale)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const pagedSales = useMemo(() => sales.slice(page * pageSize, page * pageSize + pageSize), [page, sales])

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    setPage(0)
  }, [sales.length])
  
  useEffect(() => {
    if (branches.length > 0 && products.length > 0 && form.branchId === 0) {
      setForm({
        ...form,
        branchId: branches[0].id,
        items: [{ productId: products[0].id, quantity: 1 }]
      })
    }
  }, [branches, products])

  async function loadData() {
    setLoading(true)
    try {
      const [salesData, branchesData, productsData] = await Promise.all([
        getSales(),
        getBranches().catch(() => []),
        getProducts({ size: 1000 }).then(res => res.content).catch(() => [])
      ])
      setSales(salesData)
      setBranches(branchesData)
      setProducts(productsData)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await createSale(form)
      setForm(current => ({ ...emptySale, branchId: current.branchId, items: [{ productId: current.items[0].productId, quantity: 1 }] }))
      addToast(tr('Đã tạo hóa đơn bán hàng.', 'Sale invoice created.'), 'success')
      await loadData()
      setActiveTab('list')
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleCancelSale() {
    if (!selectedSale) return
    setCanceling(true)
    try {
      await cancelSale(selectedSale.id, cancelReason)
      addToast(tr('Đã hủy hóa đơn.', 'Sale cancelled.'), 'success')
      setShowCancelConfirm(false)
      setSelectedSale(null)
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
          <h2 className="page-header__title">{tr('Hóa đơn bán', 'Sales')}</h2>
          <p className="page-header__description">{tr('Quản lý hóa đơn bán hàng từ POS hoặc tạo tay.', 'Manage sales invoices from POS or create manually.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      <Tabs 
        tabs={[
          { id: 'list', label: tr('Danh sách hóa đơn', 'Sales List'), icon: <FileText size={16} /> },
          { id: 'create', label: tr('Tạo thủ công', 'Manual Entry'), icon: <Plus size={16} /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'list' && (
        <div className="catalog-grid">
          <Card>
            <CardHeader>
              <div><p className="panel__eyebrow">Ledger</p><h3>{tr('Lịch sử bán hàng', 'Sales history')}</h3></div>
              <Badge tone="info">{sales.length}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="page-state">{tr('Đang tải...', 'Loading...')}</p>
              ) : sales.length === 0 ? (
                <p className="page-state">{tr('Chưa có hóa đơn nào.', 'No sales yet.')}</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="data-table data-table--dense">
                      <thead>
                        <tr><th>Code</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Trạng thái', 'Status')}</th><th>{tr('Giá trị', 'Amount')}</th><th>{tr('Người tạo', 'Created by')}</th><th>{tr('Ngày tạo', 'Created')}</th></tr>
                      </thead>
                      <tbody>
                        {pagedSales.map((sale) => (
                          <tr 
                            key={sale.id} 
                            onClick={() => setSelectedSale(sale)}
                            style={{ cursor: 'pointer' }}
                            className="table-row-clickable"
                          >
                            <td><strong>{sale.saleCode}</strong></td>
                            <td>{sale.branchName}</td>
                            <td><Badge tone={getStatusTone(sale.status)}>{sale.status}</Badge></td>
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
        </div>
      )}

      {activeTab === 'create' && (
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <CardHeader>
            <div><p className="panel__eyebrow">New</p><h3>{tr('Tạo hóa đơn thủ công', 'Create manual sale')}</h3></div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitSale}>
              <label className="field">
                <span>{tr('Chi nhánh', 'Branch')}</span>
                <Select 
                  required 
                  value={form.branchId} 
                  onChange={(event) => setForm((current) => ({ ...current, branchId: Number(event.target.value) }))}
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                />
              </label>
              
              <div style={{ padding: '16px', background: 'var(--surface-strong)', borderRadius: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>{tr('Sản phẩm bán', 'Item')}</h4>
                <div className="form-grid form-grid--two">
                  <label className="field">
                    <span>{tr('Sản phẩm', 'Product')}</span>
                    <Select 
                      required 
                      value={form.items[0].productId} 
                      onChange={(event) => {
                        const pid = Number(event.target.value);
                        setForm((current) => ({ ...current, items: [{ ...current.items[0], productId: pid }] }))
                      }}
                      options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku}) - ${formatCurrency(p.price)}` }))}
                    />
                  </label>
                  <label className="field">
                    <span>{tr('Số lượng', 'Quantity')}</span>
                    <Input required type="number" min={1} value={form.items[0].quantity} onChange={(event) => setForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} />
                  </label>
                </div>
              </div>

              <label className="field">
                <span>{tr('Ghi chú', 'Note')}</span>
                <Input value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button type="submit" size="lg" disabled={saving || !form.branchId || !form.items[0].productId}>
                  {saving ? tr('Đang xử lý...', 'Processing...') : tr('Xác nhận hóa đơn', 'Confirm sale')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sale Details Modal */}
      <Modal
        isOpen={!!selectedSale && !showCancelConfirm}
        onClose={() => setSelectedSale(null)}
        title={tr('Chi tiết hóa đơn', 'Sale details')}
        maxWidth="600px"
        footer={
          <>
            {selectedSale?.status === 'COMPLETED' && (
              <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>
                <Ban size={16} /> {tr('Hủy hóa đơn', 'Cancel sale')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelectedSale(null)}>{tr('Đóng', 'Close')}</Button>
          </>
        }
      >
        {selectedSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{selectedSale.saleCode}</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{new Date(selectedSale.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <Badge tone={getStatusTone(selectedSale.status)}>{selectedSale.status}</Badge>
            </div>
            
            <div className="form-grid form-grid--two">
              <div><small className="panel__eyebrow">{tr('Chi nhánh', 'Branch')}</small><p style={{ margin: 0, fontWeight: 500 }}>{selectedSale.branchName}</p></div>
              <div><small className="panel__eyebrow">{tr('Người tạo', 'Created by')}</small><p style={{ margin: 0, fontWeight: 500 }}>{selectedSale.createdBy}</p></div>
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
                {selectedSale.items.map((item: SaleItem, idx) => (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>{tr('Tổng cộng:', 'Total:')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(selectedSale.totalAmount)}</td>
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
        onConfirm={handleCancelSale}
        title={tr('Xác nhận hủy hóa đơn', 'Confirm cancellation')}
        message={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0 }}>
              {tr(`Bạn có chắc muốn hủy hóa đơn ${selectedSale?.saleCode}? Tồn kho sẽ được cộng lại tương ứng.`, `Are you sure you want to cancel sale ${selectedSale?.saleCode}? Stock levels will be restored.`)}
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

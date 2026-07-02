import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { RefreshCcw, ScanBarcode, Package, Activity, Wrench } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { PaginationBar } from '../components/PaginationBar'
import { useToast } from '../store/toast'
import { useI18n } from '../i18n'
import { createStockAdjustment, getStockLevels, getStockMovements } from '../services/inventory'
import { getProducts } from '../services/products'
import { getBranches } from '../services/masterData'
import { useAuth } from '../store/auth'
import type { StockLevel, StockMovement } from '../types/inventory'
import type { Product } from '../types/product'
import type { Branch } from '../types/masterData'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode } from '../utils/barcode'
import { hasMinimumRole } from '../utils/roles'

export function InventoryPage() {
  const { t, language } = useI18n()
  const { me } = useAuth()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  
  const canChooseBranch = hasMinimumRole(me?.role, 'ADMIN')
  const canAdjustStock = hasMinimumRole(me?.role, 'MANAGER')

  const [activeTab, setActiveTab] = useState('stock')
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [scanValue, setScanValue] = useState('')
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    branchId: me?.branchId ?? 1,
    productId: 0,
    page: 0,
    size: 20,
  })

  const [stockForm, setStockForm] = useState({
    productId: 0,
    branchId: me?.branchId ?? 1,
    quantityDelta: 1,
    reason: 'Điều chỉnh thủ công',
    note: '',
  })

  useEffect(() => {
    if (me?.branchId != null && !canChooseBranch) {
      const assignedBranchId = me.branchId
      setFilters((current) => ({ ...current, branchId: assignedBranchId }))
      setStockForm((current) => ({ ...current, branchId: assignedBranchId }))
    }
  }, [canChooseBranch, me?.branchId])

  useEffect(() => {
    if (canChooseBranch) {
      getBranches().then(setBranches).catch(() => {})
    }
  }, [canChooseBranch])

  useEffect(() => {
    void loadData()
  }, [filters.page, filters.branchId])
  
  useEffect(() => {
    if (products.length > 0 && stockForm.productId === 0) {
      setStockForm(f => ({ ...f, productId: products[0].id }))
    }
  }, [products])

  const stockSummary = useMemo(
    () => ({
      totalRows: stockLevels.length,
      totalStock: stockLevels.reduce((sum, row) => sum + row.stock, 0),
      branchName: branches.find(b => b.id === filters.branchId)?.name ?? stockLevels[0]?.branchName ?? me?.branchName ?? `#${filters.branchId}`,
    }),
    [filters.branchId, me?.branchName, stockLevels, branches],
  )

  async function loadData() {
    setLoading(true)
    try {
      const productQuery = filters.productId > 0 ? filters.productId : undefined
      const [stockLevelData, movementData, productData] = await Promise.all([
        getStockLevels({ branchId: filters.branchId, productId: productQuery, page: filters.page, size: filters.size }),
        getStockMovements({ branchId: filters.branchId, productId: productQuery, page: filters.page, size: filters.size }),
        getProducts({ page: 0, size: 1000 }).then(res => res.content),
      ])

      setStockLevels(stockLevelData.content)
      setMovements(movementData.content)
      setProducts(productData)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters((current) => ({ ...current, page: 0 }))
    await loadData()
  }

  async function submitStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createStockAdjustment(stockForm)
      addToast(tr('Điều chỉnh kho thành công.', 'Stock adjusted successfully.'), 'success')
      setStockForm(current => ({ ...current, quantityDelta: 1, note: '' }))
      await loadData()
      setActiveTab('movements')
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    }
  }

  function fillProductByBarcode(rawBarcode: string) {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    const product = findProductByBarcode(products, barcode)
    if (!product) {
      addToast(tr(`Không tìm thấy sản phẩm với barcode: ${barcode}`, `Product not found for barcode: ${barcode}`), 'error')
      return
    }

    setFilters((current) => ({ ...current, productId: product.id }))
    setStockForm((current) => ({ ...current, productId: product.id }))
    setScanValue('')
    addToast(tr(`Đã chọn sản phẩm: ${product.name}`, `Selected product: ${product.name}`), 'success')
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Inventory</p>
          <h2 className="page-header__title">{t('inventory.title')}</h2>
          <p className="page-header__description">{t('inventory.description')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCcw size={16} /> {t('common.reload')}
        </Button>
      </header>

      <Tabs 
        tabs={[
          { id: 'stock', label: tr('Tồn kho hiện tại', 'Current Stock'), icon: <Package size={16} /> },
          { id: 'movements', label: tr('Lịch sử biến động', 'Stock Movements'), icon: <Activity size={16} /> },
          ...(canAdjustStock ? [{ id: 'adjust', label: tr('Điều chỉnh kho', 'Stock Adjustment'), icon: <Wrench size={16} /> }] : [])
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Global Filter Bar for Inventory */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={{ padding: '16px' }}>
          <form className="form-grid" onSubmit={submitFilters} style={{ gap: '16px', alignItems: 'flex-end', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label className="field">
              <span>{t('common.branch')}</span>
              {canChooseBranch ? (
                <Select 
                  value={filters.branchId}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setFilters((current) => ({ ...current, branchId: value }))
                    setStockForm((current) => ({ ...current, branchId: value }))
                  }}
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                />
              ) : (
                <Input value={stockSummary.branchName} disabled />
              )}
            </label>
            <label className="field">
              <span>{tr('Sản phẩm (0 = Tất cả)', 'Product (0 = All)')}</span>
              <Select 
                value={filters.productId}
                onChange={(event) => setFilters((current) => ({ ...current, productId: Number(event.target.value) }))}
                options={[
                  { value: 0, label: tr('--- Tất cả sản phẩm ---', '--- All products ---') },
                  ...products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))
                ]}
              />
            </label>
            <label className="field">
              <span>{tr('Barcode nhanh', 'Quick Barcode')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      fillProductByBarcode(scanValue)
                    }
                  }}
                  placeholder={tr('Quét barcode...', 'Scan...')}
                  style={{ minWidth: 120 }}
                />
                <Button type="button" variant="secondary" onClick={() => fillProductByBarcode(scanValue)} style={{ padding: '0 12px' }}>
                  <ScanBarcode size={16} />
                </Button>
              </div>
            </label>
            <Button type="submit" disabled={loading}>{t('inventory.filter')}</Button>
          </form>
        </CardContent>
      </Card>

      {activeTab === 'stock' && (
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Stock levels</p>
              <h3>{tr('Tồn kho tại: ', 'Stock at: ')}{stockSummary.branchName}</h3>
            </div>
            <Badge tone="info">{stockSummary.totalStock} {tr('sản phẩm', 'items')}</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải tồn kho...', 'Loading stock levels...')}</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr><th>SKU</th><th>{tr('Sản phẩm', 'Product')}</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Tồn kho', 'Stock')}</th></tr>
                  </thead>
                  <tbody>
                    {stockLevels.length === 0 ? (
                      <tr><td colSpan={4}>{t('inventory.emptyStock')}</td></tr>
                    ) : (
                      stockLevels.map((item) => (
                        <tr 
                          key={`${item.productId}-${item.branchId}`}
                          style={item.stock <= 0 ? { background: 'var(--danger-light, rgba(239, 68, 68, 0.05))' } : item.stock <= 5 ? { background: 'var(--warning-light, rgba(245, 158, 11, 0.05))' } : {}}
                        >
                          <td>{item.sku}</td>
                          <td><strong>{item.productName}</strong></td>
                          <td>{item.branchName}</td>
                          <td>
                            <Badge tone={item.stock <= 0 ? 'danger' : item.stock <= 5 ? 'warning' : 'neutral'}>
                              {item.stock}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationBar page={filters.page} totalPages={1} totalElements={stockLevels.length} size={filters.size} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Movements</p>
              <h3>{t('inventory.movementTitle')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải biến động kho...', 'Loading movements...')}</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr><th>{tr('Sản phẩm', 'Product')}</th><th>{tr('Chi nhánh', 'Branch')}</th><th>{tr('Loại', 'Type')}</th><th>{tr('Số lượng', 'Quantity')}</th><th>{tr('Tham chiếu', 'Reference')}</th><th>{tr('Thời gian', 'Time')}</th></tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr><td colSpan={6}>{t('inventory.emptyMovements')}</td></tr>
                    ) : (
                      movements.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.productName}</strong></td>
                          <td>{item.branchName}</td>
                          <td>
                            <Badge tone={item.movementType === 'PURCHASE' ? 'info' : item.movementType === 'SALE' ? 'success' : 'warning'}>
                              {item.movementType}
                            </Badge>
                          </td>
                          <td>
                            <span style={{ color: item.quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                              {item.quantity > 0 ? '+' : ''}{item.quantity}
                            </span>
                          </td>
                          <td>{item.referenceType} #{item.referenceId}</td>
                          <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationBar page={filters.page} totalPages={1} totalElements={movements.length} size={filters.size} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'adjust' && canAdjustStock && (
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <CardHeader>
            <div><p className="panel__eyebrow">{tr('Tạo phiếu', 'Create Ticket')}</p><h3>{t('inventory.adjustmentTitle')}</h3></div>
            <Wrench size={20} />
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitStockAdjustment}>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>{t('common.product')}</span>
                  <Select 
                    required
                    value={stockForm.productId} 
                    onChange={(event) => setStockForm((current) => ({ ...current, productId: Number(event.target.value) }))}
                    options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                  />
                </label>
                <label className="field">
                  <span>{t('common.branch')}</span>
                  {canChooseBranch ? (
                    <Select 
                      required
                      value={stockForm.branchId} 
                      onChange={(event) => setStockForm((current) => ({ ...current, branchId: Number(event.target.value) }))}
                      options={branches.map(b => ({ value: b.id, label: b.name }))}
                    />
                  ) : (
                    <Input value={stockSummary.branchName} disabled />
                  )}
                </label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>{tr('Biến động số lượng (+/-)', 'Quantity Delta (+/-)')}</span>
                  <Input required type="number" value={stockForm.quantityDelta} onChange={(event) => setStockForm((current) => ({ ...current, quantityDelta: Number(event.target.value) }))} placeholder="VD: -2 hoặc 5" />
                </label>
                <label className="field">
                  <span>{tr('Lý do', 'Reason')}</span>
                  <Input required value={stockForm.reason} onChange={(event) => setStockForm((current) => ({ ...current, reason: event.target.value }))} placeholder="VD: Hàng hỏng, Kiểm kê" />
                </label>
              </div>
              <label className="field">
                <span>{tr('Ghi chú chi tiết', 'Detailed note')}</span>
                <Input value={stockForm.note} onChange={(event) => setStockForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button type="submit" size="lg" disabled={loading || !stockForm.productId}>
                  {tr('Xác nhận điều chỉnh', 'Confirm adjustment')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

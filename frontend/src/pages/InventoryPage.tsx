import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FileUp, RefreshCcw, ScanBarcode } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { createStockAdjustment, getStockLevels, getStockMovements } from '../services/inventory'
import { getProducts } from '../services/products'
import { useAuth } from '../store/auth'
import type { StockLevel, StockMovement } from '../types/inventory'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'
import { hasMinimumRole } from '../utils/roles'

type MessageTone = 'success' | 'error'

export function InventoryPage() {
  const { t, language } = useI18n()
  const { me } = useAuth()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  const canChooseBranch = hasMinimumRole(me?.role, 'ADMIN')

  const [products, setProducts] = useState<Product[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [scanValue, setScanValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<MessageTone>('success')

  const [filters, setFilters] = useState({
    branchId: me?.branchId ?? 1,
    productId: 0,
    page: 0,
    size: 20,
  })

  const [stockForm, setStockForm] = useState({
    productId: 1,
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
    void loadData()
  }, [filters.page, filters.branchId])

  const stockSummary = useMemo(
    () => ({
      totalRows: stockLevels.length,
      totalStock: stockLevels.reduce((sum, row) => sum + row.stock, 0),
      branchName: stockLevels[0]?.branchName ?? me?.branchName ?? `#${filters.branchId}`,
    }),
    [filters.branchId, me?.branchName, stockLevels],
  )

  async function loadData() {
    setLoading(true)
    setMessage(null)
    try {
      const productQuery = filters.productId > 0 ? filters.productId : undefined
      const [stockLevelData, movementData, productData] = await Promise.all([
        getStockLevels({
          branchId: filters.branchId,
          productId: productQuery,
          page: filters.page,
          size: filters.size,
        }),
        getStockMovements({
          branchId: filters.branchId,
          productId: productQuery,
          page: filters.page,
          size: filters.size,
        }),
        getProducts({ page: 0, size: 100 }),
      ])

      setStockLevels(stockLevelData.content)
      setMovements(movementData.content)
      setProducts(productData.content)
    } catch (error) {
      setMessageTone('error')
      setMessage(getApiErrorMessage(error))
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
    setMessage(null)
    try {
      await createStockAdjustment(stockForm)
      setMessageTone('success')
      setMessage(tr('Điều chỉnh kho thành công.', 'Stock adjusted successfully.'))
      await loadData()
    } catch (error) {
      setMessageTone('error')
      setMessage(getApiErrorMessage(error))
    }
  }

  function fillProductByBarcode(rawBarcode: string) {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    const product = findProductByBarcode(products, barcode)
    if (!product) {
      setMessageTone('error')
      setMessage(tr(`Không tìm thấy sản phẩm với barcode: ${barcode}`, `Product not found for barcode: ${barcode}`))
      return
    }

    setFilters((current) => ({ ...current, productId: product.id }))
    setStockForm((current) => ({ ...current, productId: product.id }))
    setScanValue('')
    setMessageTone('success')
    setMessage(tr(`Đã chọn sản phẩm: ${product.name}`, `Selected product: ${product.name}`))
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    setMessage(null)

    try {
      const barcode = await readBarcodeFromFile(file)
      setScanValue(barcode)
      fillProductByBarcode(barcode)
    } catch (error) {
      setMessageTone('error')
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Inventory</p>
          <h2 className="page-header__title">{t('inventory.title')}</h2>
          <p className="page-header__description">{t('inventory.description')}</p>
          <p className="page-header__description">
            {tr('Chi nhánh đang xem', 'Current branch')}: <strong>{stockSummary.branchName}</strong>
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCcw size={16} />
          {t('common.reload')}
        </Button>
      </header>

      {message ? <p className={messageTone === 'success' ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <Card>
        <CardHeader>
          <div>
            <p className="panel__eyebrow">Barcode</p>
            <h3>{t('inventory.barcodeTitle')}</h3>
          </div>
          <ScanBarcode size={20} />
        </CardHeader>
        <CardContent>
          <div className="barcode-scan-row">
            <label className="field barcode-scan-row__input">
              <span>Barcode</span>
              <Input
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    fillProductByBarcode(scanValue)
                  }
                }}
                placeholder={tr('Quét scanner để tự điền Product ID', 'Scan to autofill product')}
              />
            </label>
            <Button type="button" variant="secondary" onClick={() => fillProductByBarcode(scanValue)}>
              <ScanBarcode size={16} />
              {tr('Quét', 'Scan')}
            </Button>
            <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn">
              <FileUp size={16} />
              {tr('Import ảnh mã', 'Import barcode image')}
              <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">{tr('Bộ lọc', 'Filters')}</p>
              <h3>{t('inventory.stockTitle')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitFilters}>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>{t('common.branch')}</span>
                  <Input
                    type="number"
                    min={1}
                    value={filters.branchId}
                    disabled={!canChooseBranch}
                    onChange={(event) => {
                      if (!canChooseBranch) return
                      const value = Number(event.target.value)
                      setFilters((current) => ({ ...current, branchId: value }))
                      setStockForm((current) => ({ ...current, branchId: value }))
                    }}
                  />
                </label>
                <label className="field">
                  <span>{tr('Product ID (0 = tất cả)', 'Product ID (0 = all)')}</span>
                  <Input type="number" min={0} value={filters.productId} onChange={(event) => setFilters((current) => ({ ...current, productId: Number(event.target.value) }))} />
                </label>
              </div>
              {!canChooseBranch ? <p className="page-state">{tr('Manager/Staff chỉ xem được chi nhánh được gán.', 'Manager/Staff can only view assigned branch.')}</p> : null}
              <Button type="submit" full disabled={loading}>
                {t('inventory.filter')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasMinimumRole(me?.role, 'MANAGER') ? (
          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">{tr('Điều chỉnh kho', 'Stock adjustment')}</p>
                <h3>{t('inventory.adjustmentTitle')}</h3>
              </div>
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={submitStockAdjustment}>
                <div className="form-grid form-grid--two">
                  <label className="field">
                    <span>{t('common.product')}</span>
                    <Input type="number" min={1} value={stockForm.productId} onChange={(event) => setStockForm((current) => ({ ...current, productId: Number(event.target.value) }))} />
                  </label>
                  <label className="field">
                    <span>{t('common.branch')}</span>
                    <Input type="number" min={1} value={stockForm.branchId} disabled={!canChooseBranch} onChange={(event) => canChooseBranch && setStockForm((current) => ({ ...current, branchId: Number(event.target.value) }))} />
                  </label>
                </div>
                <div className="form-grid form-grid--two">
                  <label className="field">
                    <span>{tr('Quantity Delta', 'Quantity Delta')}</span>
                    <Input type="number" value={stockForm.quantityDelta} onChange={(event) => setStockForm((current) => ({ ...current, quantityDelta: Number(event.target.value) }))} />
                  </label>
                  <label className="field">
                    <span>{tr('Lý do', 'Reason')}</span>
                    <Input value={stockForm.reason} onChange={(event) => setStockForm((current) => ({ ...current, reason: event.target.value }))} />
                  </label>
                </div>
                <label className="field">
                  <span>{tr('Ghi chú', 'Note')}</span>
                  <Input value={stockForm.note} onChange={(event) => setStockForm((current) => ({ ...current, note: event.target.value }))} />
                </label>
                <Button type="submit" full disabled={loading}>
                  {tr('Tạo điều chỉnh', 'Create adjustment')}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Stock levels</p>
              <h3>{t('inventory.stockTitle')}</h3>
            </div>
            <Badge tone="info">{stockSummary.totalRows}</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải tồn kho...', 'Loading stock levels...')}</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>{tr('Sản phẩm', 'Product')}</th>
                      <th>{tr('Chi nhánh', 'Branch')}</th>
                      <th>{tr('Tồn kho', 'Stock')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockLevels.length === 0 ? (
                      <tr>
                        <td colSpan={4}>{t('inventory.emptyStock')}</td>
                      </tr>
                    ) : (
                      stockLevels.map((item) => (
                        <tr key={`${item.productId}-${item.branchId}`}>
                          <td>{item.sku}</td>
                          <td>{item.productName}</td>
                          <td>{item.branchName}</td>
                          <td>{item.stock}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <p className="page-state">{tr('Tổng tồn trên bảng hiện tại', 'Total stock on current table')}: {stockSummary.totalStock}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Stock movements</p>
              <h3>{t('inventory.movementTitle')}</h3>
            </div>
            <Badge tone="neutral">{movements.length}</Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="page-state">{tr('Đang tải biến động kho...', 'Loading stock movements...')}</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>{tr('Sản phẩm', 'Product')}</th>
                      <th>{tr('Chi nhánh', 'Branch')}</th>
                      <th>{tr('Loại', 'Type')}</th>
                      <th>{tr('Số lượng', 'Quantity')}</th>
                      <th>{tr('Tham chiếu', 'Reference')}</th>
                      <th>{tr('Thời gian', 'Time')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={6}>{t('inventory.emptyMovements')}</td>
                      </tr>
                    ) : (
                      movements.map((item) => (
                        <tr key={item.id}>
                          <td>{item.productName}</td>
                          <td>{item.branchName}</td>
                          <td>{item.movementType}</td>
                          <td>{item.quantity}</td>
                          <td>{item.referenceType} #{item.referenceId}</td>
                          <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

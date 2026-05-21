import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FileUp, RefreshCcw, ScanBarcode } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { createStockAdjustment, getStockLevels, getStockMovements } from '../services/inventory'
import { getProducts } from '../services/products'
import type { StockLevel, StockMovement } from '../types/inventory'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'

type MessageTone = 'success' | 'error'

export function InventoryPage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [scanValue, setScanValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<MessageTone>('success')

  const [filters, setFilters] = useState({
    branchId: 1,
    productId: 0,
    page: 0,
    size: 20,
  })

  const [stockForm, setStockForm] = useState({
    productId: 1,
    branchId: 1,
    quantityDelta: 1,
    reason: 'Điều chỉnh thủ công',
    note: '',
  })

  useEffect(() => {
    void loadData()
  }, [])

  const stockSummary = useMemo(
    () => ({
      totalRows: stockLevels.length,
      totalStock: stockLevels.reduce((sum, row) => sum + row.stock, 0),
    }),
    [stockLevels],
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
    await loadData()
  }

  async function submitStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createStockAdjustment(stockForm)
      setMessageTone('success')
      setMessage('Điều chỉnh kho thành công.')
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
      setMessage(`Không tìm thấy sản phẩm với barcode: ${barcode}`)
      return
    }

    setFilters((current) => ({ ...current, productId: product.id }))
    setStockForm((current) => ({ ...current, productId: product.id }))
    setScanValue('')
    setMessageTone('success')
    setMessage(`Đã chọn sản phẩm: ${product.name}`)
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
                placeholder="Quét scanner để tự điền Product ID"
              />
            </label>
            <Button type="button" variant="secondary" onClick={() => fillProductByBarcode(scanValue)}>
              <ScanBarcode size={16} />
              Quét
            </Button>
            <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn">
              <FileUp size={16} />
              Import ảnh mã
              <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Bộ lọc</p>
              <h3>{t('inventory.stockTitle')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitFilters}>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Branch ID</span>
                  <Input
                    type="number"
                    min={1}
                    value={filters.branchId}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setFilters((current) => ({ ...current, branchId: value }))
                      setStockForm((current) => ({ ...current, branchId: value }))
                    }}
                  />
                </label>
                <label className="field">
                  <span>Product ID (0 = tất cả)</span>
                  <Input type="number" min={0} value={filters.productId} onChange={(event) => setFilters((current) => ({ ...current, productId: Number(event.target.value) }))} />
                </label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Trang</span>
                  <Input type="number" min={0} value={filters.page} onChange={(event) => setFilters((current) => ({ ...current, page: Number(event.target.value) }))} />
                </label>
                <label className="field">
                  <span>Kích thước</span>
                  <Input type="number" min={1} value={filters.size} onChange={(event) => setFilters((current) => ({ ...current, size: Number(event.target.value) }))} />
                </label>
              </div>
              <Button type="submit" full disabled={loading}>
                {t('inventory.filter')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Điều chỉnh kho</p>
              <h3>{t('inventory.adjustmentTitle')}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitStockAdjustment}>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Product ID</span>
                  <Input type="number" min={1} value={stockForm.productId} onChange={(event) => setStockForm((current) => ({ ...current, productId: Number(event.target.value) }))} />
                </label>
                <label className="field">
                  <span>Branch ID</span>
                  <Input type="number" min={1} value={stockForm.branchId} onChange={(event) => setStockForm((current) => ({ ...current, branchId: Number(event.target.value) }))} />
                </label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Quantity Delta</span>
                  <Input type="number" value={stockForm.quantityDelta} onChange={(event) => setStockForm((current) => ({ ...current, quantityDelta: Number(event.target.value) }))} />
                </label>
                <label className="field">
                  <span>Lý do</span>
                  <Input value={stockForm.reason} onChange={(event) => setStockForm((current) => ({ ...current, reason: event.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span>Ghi chú</span>
                <Input value={stockForm.note} onChange={(event) => setStockForm((current) => ({ ...current, note: event.target.value }))} />
              </label>
              <Button type="submit" full disabled={loading}>
                Tạo điều chỉnh
              </Button>
            </form>
          </CardContent>
        </Card>
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
              <p className="page-state">Đang tải tồn kho...</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Sản phẩm</th>
                      <th>Chi nhánh</th>
                      <th>Tồn kho</th>
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
            <p className="page-state">Tổng tồn trên bảng hiện tại: {stockSummary.totalStock}</p>
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
              <p className="page-state">Đang tải biến động kho...</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Chi nhánh</th>
                      <th>Loại</th>
                      <th>Số lượng</th>
                      <th>Tham chiếu</th>
                      <th>Thời gian</th>
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
                          <td>
                            {item.referenceType} #{item.referenceId}
                          </td>
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

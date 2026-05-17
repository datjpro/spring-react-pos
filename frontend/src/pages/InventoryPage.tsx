import { useEffect, useState, type FormEvent } from 'react'
import { FileUp, ScanBarcode } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createInventoryAdjustment, createStockAdjustment, getInventoryAdjustments, getLowStockProducts, getStockMovements } from '../services/inventory'
import { getProducts } from '../services/products'
import type { InventoryAdjustment, LowStockProduct, StockMovement } from '../types/inventory'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'

export function InventoryPage() {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [scanValue, setScanValue] = useState('')
  const [legacyForm, setLegacyForm] = useState({ productId: 1, adjustmentType: 'INCREASE', quantity: 1, reason: 'Bổ sung tồn', note: '' })
  const [stockForm, setStockForm] = useState({ productId: 1, branchId: 1, quantityDelta: 1, reason: 'Manual adjustment', note: '' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { void loadData() }, [])

  async function loadData() {
    setLoading(true)
    setMessage(null)
    try {
      const [adjustmentData, lowStockData, movementData] = await Promise.all([
        getInventoryAdjustments({ page: 0, size: 8 }),
        getLowStockProducts(10),
        getStockMovements(1, 0, 8),
      ])
      const productData = await getProducts({ size: 100 })
      setAdjustments(adjustmentData.content)
      setLowStock(lowStockData)
      setMovements(movementData.content)
      setProducts(productData.content)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitLegacy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createInventoryAdjustment(legacyForm)
      setMessage('Đã tạo inventory adjustment.')
      await loadData()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  async function submitStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createStockAdjustment(stockForm)
      setMessage('Đã tạo stock adjustment.')
      await loadData()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  function fillProductByBarcode(rawBarcode: string) {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    const product = findProductByBarcode(products, barcode)
    if (!product) {
      setMessage(`Không tìm thấy barcode ${barcode}`)
      return
    }

    setLegacyForm((current) => ({ ...current, productId: product.id }))
    setStockForm((current) => ({ ...current, productId: product.id }))
    setMessage(`Đã chọn ${product.name} từ barcode`)
    setScanValue('')
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    setMessage(null)

    try {
      const barcode = await readBarcodeFromFile(file)
      setScanValue(barcode)
      fillProductByBarcode(barcode)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">Inventory</p><h2 className="page-header__title">Inventory & Stock Movements</h2><p className="page-header__description">Theo dõi low stock, lịch sử điều chỉnh và biến động tồn kho theo chi nhánh.</p></div><Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <Card>
        <CardHeader><div><p className="panel__eyebrow">Barcode</p><h3>Quét mã để nhập/kiểm kho</h3></div><ScanBarcode size={20} /></CardHeader>
        <CardContent>
          <div className="barcode-scan-row">
            <label className="field barcode-scan-row__input"><span>Barcode</span><Input value={scanValue} onChange={(event) => setScanValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); fillProductByBarcode(scanValue) } }} placeholder="Quét scanner để tự điền Product ID" /></label>
            <Button type="button" variant="secondary" onClick={() => fillProductByBarcode(scanValue)}><ScanBarcode size={16} /> Quét</Button>
            <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn"><FileUp size={16} /> Import ảnh mã<input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} /></label>
          </div>
        </CardContent>
      </Card>
      <div className="catalog-grid">
        <Card><CardHeader><div><p className="panel__eyebrow">Alerts</p><h3>Low stock</h3></div><Badge tone="warning">{lowStock.length}</Badge></CardHeader><CardContent>{loading ? <p className="page-state">Đang tải low stock...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Threshold</th></tr></thead><tbody>{lowStock.map((item) => <tr key={item.productId}><td>{item.sku}</td><td>{item.productName}</td><td><Badge tone="danger">{item.stock}</Badge></td><td>{item.threshold}</td></tr>)}</tbody></table></div>}</CardContent></Card>
        <Card><CardHeader><div><p className="panel__eyebrow">Legacy</p><h3>Inventory adjustment</h3></div></CardHeader><CardContent><form className="form-grid" onSubmit={submitLegacy}><div className="form-grid form-grid--two"><label className="field"><span>Product ID</span><Input type="number" min={1} value={legacyForm.productId} onChange={(event) => setLegacyForm((current) => ({ ...current, productId: Number(event.target.value) }))} /></label><label className="field"><span>Type</span><Input value={legacyForm.adjustmentType} onChange={(event) => setLegacyForm((current) => ({ ...current, adjustmentType: event.target.value }))} /></label></div><div className="form-grid form-grid--two"><label className="field"><span>Qty</span><Input type="number" min={1} value={legacyForm.quantity} onChange={(event) => setLegacyForm((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label><label className="field"><span>Reason</span><Input value={legacyForm.reason} onChange={(event) => setLegacyForm((current) => ({ ...current, reason: event.target.value }))} /></label></div><Button type="submit" full>Tạo adjustment</Button></form></CardContent></Card>
      </div>
      <div className="catalog-grid">
        <Card><CardHeader><div><p className="panel__eyebrow">Adjustments</p><h3>Lịch sử điều chỉnh</h3></div><Badge tone="info">{adjustments.length}</Badge></CardHeader><CardContent><div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>Reason</th></tr></thead><tbody>{adjustments.map((item) => <tr key={item.id}><td>{item.productName}</td><td>{item.adjustmentType}</td><td>{item.quantity}</td><td>{item.reason}</td></tr>)}</tbody></table></div></CardContent></Card>
        <Card><CardHeader><div><p className="panel__eyebrow">Stock</p><h3>Stock movement adjustment</h3></div></CardHeader><CardContent><form className="form-grid" onSubmit={submitStock}><div className="form-grid form-grid--two"><label className="field"><span>Product ID</span><Input type="number" min={1} value={stockForm.productId} onChange={(event) => setStockForm((current) => ({ ...current, productId: Number(event.target.value) }))} /></label><label className="field"><span>Branch ID</span><Input type="number" min={1} value={stockForm.branchId} onChange={(event) => setStockForm((current) => ({ ...current, branchId: Number(event.target.value) }))} /></label></div><div className="form-grid form-grid--two"><label className="field"><span>Qty delta</span><Input type="number" value={stockForm.quantityDelta} onChange={(event) => setStockForm((current) => ({ ...current, quantityDelta: Number(event.target.value) }))} /></label><label className="field"><span>Reason</span><Input value={stockForm.reason} onChange={(event) => setStockForm((current) => ({ ...current, reason: event.target.value }))} /></label></div><Button type="submit" full>Tạo stock adjustment</Button></form></CardContent></Card>
      </div>
      <Card><CardHeader><div><p className="panel__eyebrow">Movements</p><h3>Stock movements</h3></div><Badge tone="neutral">{movements.length}</Badge></CardHeader><CardContent><div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Product</th><th>Branch</th><th>Type</th><th>Qty</th><th>At</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{movement.productName}</td><td>{movement.branchName}</td><td>{movement.movementType}</td><td>{movement.quantity}</td><td>{new Date(movement.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></CardContent></Card>
    </section>
  )
}

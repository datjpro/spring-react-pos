import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreditCard, FileUp, Minus, Plus, ScanBarcode, ShoppingCart, Trash2 } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { getStockLevels } from '../services/inventory'
import { getProducts } from '../services/products'
import { createSale } from '../services/transactions'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'

type CartItem = Product & { quantity: number; branchStock: number }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PosPage() {
  const { t, language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [stockByProduct, setStockByProduct] = useState<Record<number, number>>({})
  const [cart, setCart] = useState<CartItem[]>([])
  const [branchId, setBranchId] = useState(1)
  const [search, setSearch] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState(false)

  useEffect(() => {
    void loadProductsAndStock(branchId)
  }, [branchId])

  const saleableProducts = useMemo(
    () => allProducts.filter((product) => product.active && (stockByProduct[product.id] ?? 0) > 0),
    [allProducts, stockByProduct],
  )

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return saleableProducts
    return saleableProducts.filter((product) => [product.name, product.sku, product.barcode ?? '', product.category ?? ''].some((value) => value.toLowerCase().includes(keyword)))
  }, [saleableProducts, search])

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  async function loadProductsAndStock(currentBranchId: number) {
    setLoading(true)
    setMessage(null)
    try {
      const [productsData, stockPage] = await Promise.all([
        getProducts({ page: 0, size: 200 }),
        getStockLevels({ branchId: currentBranchId, page: 0, size: 500 }),
      ])

      const stockMap: Record<number, number> = {}
      for (const item of stockPage.content) stockMap[item.productId] = item.stock

      setAllProducts(productsData.content)
      setStockByProduct(stockMap)
      setCart([])
    } catch (error) {
      const apiMessage = getApiErrorMessage(error)
      const notFoundHint = apiMessage.includes('No static resource api/v1/stock-levels')
        ? tr('Backend chưa bật endpoint stock-levels. Kiểm tra BE đang chạy đúng branch/migration.', 'Backend missing stock-levels endpoint. Check running BE branch/migration.')
        : apiMessage
      setMessageSuccess(false)
      setMessage(notFoundHint)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product: Product) {
    const maxStock = stockByProduct[product.id] ?? 0
    if (maxStock <= 0) return

    setCart((current) => {
      const index = current.findIndex((item) => item.id === product.id)
      if (index === -1) return [...current, { ...product, quantity: 1, branchStock: maxStock }]

      const next = [...current]
      const found = next[index]
      if (found.quantity >= maxStock) return next
      next[index] = { ...found, quantity: found.quantity + 1 }
      return next
    })
  }

  function increaseQuantity(productId: number) {
    setCart((current) =>
      current.map((item) => {
        if (item.id !== productId) return item
        if (item.quantity >= item.branchStock) return item
        return { ...item, quantity: item.quantity + 1 }
      }),
    )
  }

  function decreaseQuantity(productId: number) {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.id !== productId) return item
        if (item.quantity <= 1) return []
        return { ...item, quantity: item.quantity - 1 }
      }),
    )
  }

  function removeFromCart(productId: number) {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  function fillByBarcode(rawBarcode: string) {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    const product = findProductByBarcode(saleableProducts, barcode)
    if (!product) {
      setMessageSuccess(false)
      setMessage(tr(`Không tìm thấy barcode có tồn kho: ${barcode}`, `No saleable barcode found: ${barcode}`))
      return
    }

    addToCart(product)
    setScanValue('')
    setMessageSuccess(true)
    setMessage(tr(`Đã thêm ${product.name} vào giỏ.`, `Added ${product.name} to cart.`))
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    try {
      const barcode = await readBarcodeFromFile(file)
      setScanValue(barcode)
      fillByBarcode(barcode)
    } catch (error) {
      setMessageSuccess(false)
      setMessage(getApiErrorMessage(error))
    }
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cart.length === 0) {
      setMessageSuccess(false)
      setMessage(tr('Giỏ hàng đang trống.', 'Cart is empty.'))
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const sale = await createSale({
        branchId,
        note: note.trim() || undefined,
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      })
      setCart([])
      setNote('')
      setMessageSuccess(true)
      setMessage(tr(`Đã tạo hóa đơn bán ${sale.saleCode}.`, `Created sales invoice ${sale.saleCode}.`))
      await loadProductsAndStock(branchId)
    } catch (error) {
      setMessageSuccess(false)
      setMessage(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack pos-workspace">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">POS</p>
          <h2 className="page-header__title">{t('pos.title')}</h2>
          <p className="page-header__description">{t('pos.description')}</p>
        </div>
        <div className="pos-hero__metrics">
          <Badge tone="info">
            <ShoppingCart size={14} /> {itemCount} {tr('món', 'items')}
          </Badge>
          <Badge tone="success">{formatCurrency(subtotal)}</Badge>
        </div>
      </header>

      {message ? <p className={messageSuccess ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="pos-grid pos-grid--checkout">
        <Card className="pos-products-card">
          <CardHeader>
            <div>
              <p className="panel__eyebrow">{tr('Sản phẩm', 'Products')}</p>
              <h3>{t('pos.addToCart')}</h3>
            </div>
            <Badge tone="neutral">
              {filteredProducts.length}/{saleableProducts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>{t('pos.branch')}</span>
                <Input
                  type="number"
                  min={1}
                  value={branchId}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setBranchId(value > 0 ? value : 1)
                  }}
                />
              </label>
              <label className="field">
                <span>{tr('Tìm kiếm', 'Search')}</span>
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr('Tìm tên, SKU, barcode...', 'Search name, SKU, barcode...')} />
              </label>
            </div>

            <div className="barcode-scan-row">
              <label className="field barcode-scan-row__input">
                <span>Barcode</span>
                <Input
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      fillByBarcode(scanValue)
                    }
                  }}
                  placeholder={tr('Quét scanner để thêm nhanh', 'Scan to add quickly')}
                />
              </label>
              <Button type="button" variant="secondary" onClick={() => fillByBarcode(scanValue)}>
                <ScanBarcode size={16} /> {tr('Quét', 'Scan')}
              </Button>
              <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn">
                <FileUp size={16} />
                {tr('Import ảnh mã', 'Import barcode image')}
                <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            {loading ? (
              <p className="page-state">{tr('Đang tải sản phẩm tồn kho...', 'Loading in-stock products...')}</p>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <button key={product.id} type="button" className="product-card" onClick={() => addToCart(product)}>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                    <span>{formatCurrency(product.price)}</span>
                    <Badge tone="info">{tr('Tồn', 'Stock')}: {stockByProduct[product.id] ?? 0}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="pos-sidebar">
          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">{tr('Giỏ hàng', 'Cart')}</p>
                <h3>{tr('Chi tiết đơn', 'Order details')}</h3>
              </div>
              <ShoppingCart size={20} />
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="page-state">{t('pos.emptyCart')}</p>
              ) : (
                <div className="list-stack">
                  {cart.map((item) => (
                    <article key={item.id} className="cart-item">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{formatCurrency(item.price)}</p>
                        <small>{tr('Tồn chi nhánh', 'Branch stock')}: {item.branchStock}</small>
                      </div>
                      <div className="cart-item__actions">
                        <Button type="button" size="sm" variant="ghost" onClick={() => decreaseQuantity(item.id)}>
                          <Minus size={14} />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => increaseQuantity(item.id)} disabled={item.quantity >= item.branchStock}>
                          <Plus size={14} />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">{tr('Thanh toán', 'Checkout')}</p>
                <h3>{tr('Tạo phiếu bán', 'Create sale')}</h3>
              </div>
              <CreditCard size={20} />
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={checkout}>
                <label className="field">
                  <span>{t('pos.note')}</span>
                  <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr('VD: Bán tại quầy ca sáng', 'Example: Morning counter sale')} />
                </label>
                <div className="summary-block summary-block--pos">
                  <div className="summary-block__row">
                    <span>{tr('Tổng cộng', 'Total')}</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                </div>
                <Button type="submit" full disabled={submitting || cart.length === 0}>
                  <CreditCard size={16} />
                  {submitting ? tr('Đang tạo...', 'Creating...') : t('pos.checkout')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}

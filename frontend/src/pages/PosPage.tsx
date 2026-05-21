import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreditCard, FileUp, Minus, Plus, ScanBarcode, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { getProducts } from '../services/products'
import { createSale } from '../services/transactions'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'

type CartItem = Product & { quantity: number }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PosPage() {
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
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
    getProducts({ page: 0, size: 100 })
      .then((data) => setProducts(data.content))
      .catch((error) => {
        setMessage(getApiErrorMessage(error))
        setMessageSuccess(false)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return products

    return products.filter((product) => {
      const fields = [product.name, product.sku, product.barcode ?? '', product.category ?? '']
      return fields.some((value) => value.toLowerCase().includes(keyword))
    })
  }, [products, search])

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  function addToCart(product: Product) {
    if (!product.active) return

    setCart((current) => {
      const index = current.findIndex((item) => item.id === product.id)
      if (index === -1) return [...current, { ...product, quantity: 1 }]

      const next = [...current]
      const found = next[index]
      next[index] = { ...found, quantity: found.quantity + 1 }
      return next
    })
  }

  function increaseQuantity(productId: number) {
    setCart((current) => current.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item)))
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

    const product = findProductByBarcode(products, barcode)
    if (!product) {
      setMessageSuccess(false)
      setMessage(`Không tìm thấy barcode: ${barcode}`)
      return
    }

    addToCart(product)
    setScanValue('')
    setMessageSuccess(true)
    setMessage(`Đã thêm ${product.name} vào giỏ.`)
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
      setMessage('Giỏ hàng đang trống.')
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
      setMessage(`Đã tạo hóa đơn bán ${sale.saleCode}.`)
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
            <ShoppingCart size={14} /> {itemCount} món
          </Badge>
          <Badge tone="success">{formatCurrency(subtotal)}</Badge>
        </div>
      </header>

      {message ? <p className={messageSuccess ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="pos-grid pos-grid--checkout">
        <Card className="pos-products-card">
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Sản phẩm</p>
                <h3>{t('pos.addToCart')}</h3>
            </div>
            <Badge tone="neutral">
              {filteredProducts.length}/{products.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <label className="pos-search">
              <Search size={16} />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, SKU, barcode..." />
            </label>

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
                  placeholder="Quét scanner để thêm nhanh"
                />
              </label>
              <Button type="button" variant="secondary" onClick={() => fillByBarcode(scanValue)}>
                <ScanBarcode size={16} />
                Quét
              </Button>
              <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn">
                <FileUp size={16} />
                Import ảnh mã
                <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            {loading ? (
              <p className="page-state">Đang tải sản phẩm...</p>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <button key={product.id} type="button" className="product-card" onClick={() => addToCart(product)} disabled={!product.active}>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                    <span>{formatCurrency(product.price)}</span>
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
                <p className="panel__eyebrow">Giỏ hàng</p>
                <h3>Chi tiết đơn</h3>
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
                      </div>
                      <div className="cart-item__actions">
                        <Button type="button" size="sm" variant="ghost" onClick={() => decreaseQuantity(item.id)}>
                          <Minus size={14} />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => increaseQuantity(item.id)}>
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
                <p className="panel__eyebrow">Thanh toán</p>
                <h3>Tạo phiếu bán</h3>
              </div>
              <CreditCard size={20} />
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={checkout}>
                <label className="field">
                  <span>{t('pos.branch')}</span>
                  <Input type="number" min={1} value={branchId} onChange={(event) => setBranchId(Number(event.target.value))} />
                </label>
                <label className="field">
                  <span>{t('pos.note')}</span>
                  <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="VD: Bán tại quầy ca sáng" />
                </label>
                <div className="summary-block summary-block--pos">
                  <div className="summary-block__row">
                    <span>Tổng cộng</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                </div>
                <Button type="submit" full disabled={submitting || cart.length === 0}>
                  <CreditCard size={16} />
                  {submitting ? 'Đang tạo...' : t('pos.checkout')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}

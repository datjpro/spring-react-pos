import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, CreditCard, FileUp, Minus, Plus, ReceiptText, ScanBarcode, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { createOrder, createPayment } from '../services/transactions'
import { getProducts } from '../services/products'
import type { Product } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

type CartItem = Product & { quantity: number }
type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'

const quickAmounts = [50000, 100000, 200000, 500000]
const POS_CART_STORAGE_KEY = 'pos_cart_draft_v1'

interface PersistedCartItem {
  productId: number
  quantity: number
}

export function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const scanInputRef = useRef<HTMLInputElement | null>(null)
  const restoredCartRef = useRef(false)

  useEffect(() => {
    getProducts({ size: 24 })
      .then((data) => setProducts(data.content))
      .catch((error) => setMessage(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    scanInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (restoredCartRef.current || products.length === 0) return

    restoredCartRef.current = true

    const raw = localStorage.getItem(POS_CART_STORAGE_KEY)
    if (!raw) return

    try {
      const persisted: PersistedCartItem[] = JSON.parse(raw)
      const restored = persisted
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId)
          if (!product || !product.active || product.stock <= 0) return null

          return {
            ...product,
            quantity: Math.max(1, Math.min(item.quantity, product.stock)),
          }
        })
        .filter((item): item is CartItem => item !== null)

      if (restored.length > 0) {
        setCart(restored)
        setMessage(`Đã khôi phục ${restored.length} món từ giỏ tạm.`)
      }
    } catch {
      localStorage.removeItem(POS_CART_STORAGE_KEY)
    }
  }, [products])

  useEffect(() => {
    if (cart.length === 0) {
      localStorage.removeItem(POS_CART_STORAGE_KEY)
      return
    }

    const payload: PersistedCartItem[] = cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }))

    localStorage.setItem(POS_CART_STORAGE_KEY, JSON.stringify(payload))
  }, [cart])

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return products

    return products.filter((product) => {
      const fields = [product.name, product.sku, product.barcode ?? '', product.category ?? '']
      return fields.some((field) => field.toLowerCase().includes(keyword))
    })
  }, [products, search])

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart])
  const paidAmount = Number(amountReceived || 0)
  const changeAmount = Math.max(paidAmount - subtotal, 0)
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)

  function addToCart(product: Product) {
    if (!product.active || product.stock <= 0) return

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, product.stock)
        return current.map((item) => (item.id === product.id ? { ...item, quantity: nextQuantity } : item))
      }

      return [...current, { ...product, quantity: 1 }]
    })
  }

  function updateQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.id !== productId) return item
        if (quantity <= 0) return []
        return { ...item, quantity: Math.min(quantity, item.stock) }
      }),
    )
  }

  function removeFromCart(productId: number) {
    setCart((current) => current.filter((item) => item.id !== productId))
  }

  function clearCartDraft() {
    setCart([])
    localStorage.removeItem(POS_CART_STORAGE_KEY)
    setMessage('Đã xóa giỏ tạm trên trình duyệt.')
  }

  function scanBarcodeIntoCart(rawBarcode: string) {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    const product = findProductByBarcode(products, barcode)
    if (!product) {
      setMessage(`Không tìm thấy barcode ${barcode}`)
      return
    }

    addToCart(product)
    setMessage(`Đã thêm ${product.name} từ barcode`)
    setScanValue('')
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    setMessage(null)

    try {
      const barcode = await readBarcodeFromFile(file)
      setScanValue(barcode)
      scanBarcodeIntoCart(barcode)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  async function checkout() {
    if (cart.length === 0) {
      setMessage('Giỏ hàng đang trống.')
      return
    }

    if (paymentMethod === 'CASH' && paidAmount < subtotal) {
      setMessage('Tiền khách đưa chưa đủ.')
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const order = await createOrder({
        discountAmount: 0,
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      })

      await createPayment({
        orderId: order.id,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? paidAmount : order.totalAmount,
        note: 'POS checkout',
      })

      setCart([])
      setAmountReceived('')
      localStorage.removeItem(POS_CART_STORAGE_KEY)
      setMessage(`Đã thanh toán đơn ${order.orderCode}`)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack pos-workspace">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">POS Counter</p>
          <h2 className="page-header__title">Bán hàng tại quầy</h2>
          <p className="page-header__description">Chọn sản phẩm, kiểm tra tồn kho, nhận tiền và tạo hóa đơn trong một màn hình.</p>
        </div>
        <div className="pos-hero__metrics">
          <Badge tone="info"><ShoppingCart size={14} /> {itemCount} món</Badge>
          <Badge tone="success"><Banknote size={14} /> {formatCurrency(subtotal)}</Badge>
        </div>
      </header>

      {message ? <p className={message.includes('Đã thanh toán') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="pos-grid pos-grid--checkout">
        <Card className="pos-products-card">
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Sản phẩm</p>
              <h3>Chạm để thêm vào giỏ</h3>
            </div>
            <Badge tone="neutral">{filteredProducts.length}/{products.length}</Badge>
          </CardHeader>

          <CardContent>
            <label className="pos-search">
              <Search size={16} />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, SKU, barcode..." />
            </label>

            <div className="barcode-scan-row">
              <label className="field barcode-scan-row__input">
                <span>Quét barcode (scanner)</span>
                <Input
                  ref={scanInputRef}
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      scanBarcodeIntoCart(scanValue)
                    }
                  }}
                  placeholder="Focus ở đây rồi quét mã..."
                />
              </label>
              <Button type="button" variant="secondary" onClick={() => scanBarcodeIntoCart(scanValue)}><ScanBarcode size={16} /> Quét</Button>
              <label className="ui-button ui-button--ghost ui-button--md ui-input--file-btn">
                <FileUp size={16} /> Import ảnh mã
                <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            {loading ? <p className="page-state">Đang tải sản phẩm...</p> : null}
            {!loading && filteredProducts.length === 0 ? <p className="page-state">Không tìm thấy sản phẩm phù hợp.</p> : null}

            <div className="product-grid product-grid--pos">
              {filteredProducts.map((product) => {
                const disabled = !product.active || product.stock <= 0
                return (
                  <button key={product.id} type="button" className="product-tile product-tile--pos" onClick={() => addToCart(product)} disabled={disabled}>
                    <div className="product-tile__topline">
                      <Badge tone={product.stock > 0 ? 'success' : 'danger'}>{product.stock} {product.unit}</Badge>
                      {product.barcode ? <span>{product.barcode}</span> : null}
                    </div>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.sku} · {product.category ?? 'Chưa phân loại'}</p>
                    </div>
                    <strong>{formatCurrency(product.price)}</strong>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <aside className="pos-checkout-stack">
          <Card className="cart-panel">
            <CardHeader>
              <div>
                <p className="panel__eyebrow">Giỏ hàng</p>
                <h3>Hóa đơn hiện tại</h3>
              </div>
              <div className="cart-header-actions">
                <ReceiptText size={20} />
                <Button type="button" size="sm" variant="ghost" onClick={clearCartDraft} disabled={cart.length === 0}>Xóa giỏ</Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="cart-list cart-list--pos">
                {cart.length === 0 ? <p className="page-state">Chưa chọn sản phẩm.</p> : null}
                {cart.map((item) => (
                  <div key={item.id} className="cart-row cart-row--pos">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{formatCurrency(item.price)} · Tồn {item.stock}</p>
                    </div>
                    <div className="quantity-stepper">
                      <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Giảm ${item.name}`}>
                        <Minus size={14} />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Tăng ${item.name}`}>
                        <Plus size={14} />
                      </Button>
                      <Button type="button" variant="danger" size="icon" onClick={() => removeFromCart(item.id)} aria-label={`Xóa ${item.name}`}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">Thanh toán</p>
                <h3>Tổng kết</h3>
              </div>
              <CreditCard size={20} />
            </CardHeader>
            <CardContent>
              <div className="summary-block summary-block--pos">
                <div className="summary-block__row"><span>Tạm tính</span><strong>{formatCurrency(subtotal)}</strong></div>
                <div className="summary-block__row"><span>Giảm giá</span><strong>{formatCurrency(0)}</strong></div>
                <div className="summary-block__row summary-block__row--total"><span>Phải thu</span><strong>{formatCurrency(subtotal)}</strong></div>
              </div>

              <div className="payment-methods" role="group" aria-label="Chọn phương thức thanh toán">
                {(['CASH', 'CARD', 'TRANSFER'] as PaymentMethod[]).map((method) => (
                  <Button key={method} type="button" variant={paymentMethod === method ? 'primary' : 'secondary'} onClick={() => setPaymentMethod(method)}>
                    {method}
                  </Button>
                ))}
              </div>

              {paymentMethod === 'CASH' ? (
                <div className="cash-box">
                  <Input value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} inputMode="numeric" placeholder="Tiền khách đưa" />
                  <div className="quick-cash">
                    {quickAmounts.map((amount) => (
                      <Button key={amount} type="button" variant="ghost" size="sm" onClick={() => setAmountReceived(String(amount))}>
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>
                  <div className="summary-block__row"><span>Tiền thối</span><strong>{formatCurrency(changeAmount)}</strong></div>
                </div>
              ) : null}

              <div className="actions-column">
                <Button type="button" variant="secondary">
                  <ScanBarcode size={16} />
                  Quét barcode
                </Button>
                <Button type="button" full onClick={checkout} disabled={submitting || cart.length === 0}>
                  <CreditCard size={16} />
                  {submitting ? 'Đang xử lý...' : 'Thanh toán'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}

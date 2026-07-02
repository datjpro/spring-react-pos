import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreditCard, FileUp, Minus, Plus, ScanBarcode, ShoppingCart, Trash2, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../store/toast'
import { useI18n } from '../i18n'
import { getStockLevels } from '../services/inventory'
import { getProducts, getProductCategories } from '../services/products'
import { getBranches } from '../services/masterData'
import { createSale } from '../services/transactions'
import { useAuth } from '../store/auth'
import type { StockLevel } from '../types/inventory'
import type { Product } from '../types/product'
import type { Branch } from '../types/masterData'
import type { Sale } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'
import { findProductByBarcode, readBarcodeFromFile } from '../utils/barcode'
import { hasMinimumRole } from '../utils/roles'

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
  const { me } = useAuth()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  const canChooseBranch = hasMinimumRole(me?.role, 'ADMIN')

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [stockRows, setStockRows] = useState<StockLevel[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [branchId, setBranchId] = useState<number>(me?.branchId ?? 1)
  
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [scanValue, setScanValue] = useState('')
  const [note, setNote] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null)

  useEffect(() => {
    if (me?.branchId && !canChooseBranch) {
      setBranchId(me.branchId)
    }
  }, [canChooseBranch, me?.branchId])

  useEffect(() => {
    if (canChooseBranch) {
      getBranches().then(setBranches).catch(() => {})
    }
    getProductCategories().then(setCategories).catch(() => {})
  }, [canChooseBranch])

  useEffect(() => {
    if (!branchId) return
    void loadProductsAndStock(branchId)
  }, [branchId])

  const stockByProduct = useMemo(() => Object.fromEntries(stockRows.map((item) => [item.productId, item.stock])), [stockRows])

  const saleableProducts = useMemo(
    () =>
      allProducts
        .filter((product) => product.active && (stockByProduct[product.id] ?? 0) > 0)
        .sort((first, second) => first.name.localeCompare(second.name)),
    [allProducts, stockByProduct],
  )

  const filteredProducts = useMemo(() => {
    let result = saleableProducts
    
    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.category === selectedCategory)
    }
    
    const keyword = search.trim().toLowerCase()
    if (keyword) {
      result = result.filter((product) => [product.name, product.sku, product.barcode ?? '', product.category ?? ''].some((value) => value.toLowerCase().includes(keyword)))
    }
    
    return result
  }, [saleableProducts, search, selectedCategory])

  const branchName = branches.find(b => b.id === branchId)?.name ?? stockRows[0]?.branchName ?? me?.branchName ?? `#${branchId}`
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0)

  const categoryTabs = [
    { id: 'ALL', label: tr('Tất cả', 'All') },
    ...categories.map(c => ({ id: c, label: c }))
  ]

  async function loadAllProducts() {
    const collected: Product[] = []
    let currentPage = 0
    let totalPages = 1

    while (currentPage < totalPages) {
      const pageData = await getProducts({ page: currentPage, size: 100 })
      collected.push(...pageData.content)
      totalPages = pageData.totalPages
      currentPage += 1
    }

    return collected
  }

  async function loadAllStockLevels(currentBranchId: number) {
    const collected: StockLevel[] = []
    let currentPage = 0
    let totalPages = 1

    while (currentPage < totalPages) {
      const pageData = await getStockLevels({ branchId: currentBranchId, page: currentPage, size: 100 })
      collected.push(...pageData.content)
      totalPages = pageData.totalPages
      currentPage += 1
    }

    return collected
  }

  async function loadProductsAndStock(currentBranchId: number) {
    setLoading(true)
    try {
      const [productsData, stockData] = await Promise.all([loadAllProducts(), loadAllStockLevels(currentBranchId)])
      setAllProducts(productsData)
      setStockRows(stockData)
      // Only clear cart if changing branch
      if (currentBranchId !== branchId) setCart([])
    } catch (error) {
      const apiMessage = getApiErrorMessage(error)
      const branchHint = apiMessage.toLowerCase().includes('forbidden')
        ? tr('Tài khoản này chỉ được xem chi nhánh của mình. Hãy dùng đúng branch được gán.', 'This account can only access its own branch. Use assigned branch.')
        : apiMessage
      addToast(branchHint, 'error')
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
      if (found.quantity >= maxStock) {
        addToast(tr(`Đã đạt tối đa tồn kho cho ${product.name}`, `Reached maximum stock for ${product.name}`), 'info')
        return next
      }
      next[index] = { ...found, quantity: found.quantity + 1 }
      return next
    })
  }

  function increaseQuantity(productId: number) {
    setCart((current) => current.map((item) => {
      if (item.id !== productId) return item
      if (item.quantity >= item.branchStock) {
        addToast(tr(`Đã đạt tối đa tồn kho`, `Reached maximum stock`), 'info')
        return item
      }
      return { ...item, quantity: item.quantity + 1 }
    }))
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
      addToast(tr(`Không tìm thấy sản phẩm mã ${barcode}.`, `Product not found for ${barcode}.`), 'error')
      return
    }

    addToCart(product)
    setScanValue('')
    addToast(tr(`Đã thêm ${product.name}`, `Added ${product.name}`), 'success')
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    try {
      const barcode = await readBarcodeFromFile(file)
      setScanValue(barcode)
      fillByBarcode(barcode)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    }
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cart.length === 0) {
      addToast(tr('Giỏ hàng đang trống!', 'Cart is empty!'), 'error')
      return
    }

    setSubmitting(true)
    try {
      const sale = await createSale({
        branchId,
        note: note.trim() || undefined,
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      })
      setCart([])
      setNote('')
      setReceiptSale(sale)
      addToast(tr(`Đã tạo hóa đơn ${sale.saleCode}`, `Created invoice ${sale.saleCode}`), 'success')
      await loadProductsAndStock(branchId)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
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
          {canChooseBranch && (
            <Select 
              value={branchId}
              onChange={(e) => setBranchId(Number(e.target.value))}
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              style={{ minWidth: 200 }}
            />
          )}
          <Badge tone="info">
            <ShoppingCart size={14} /> {itemCount} {tr('món', 'items')}
          </Badge>
          <Badge tone="success">{formatCurrency(subtotal)}</Badge>
        </div>
      </header>

      <div className="pos-grid pos-grid--checkout">
        <Card className="pos-products-card">
          <CardHeader>
            <div className="pos-search" style={{ flexGrow: 1, marginRight: 16 }}>
              <Input 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                placeholder={tr('Tìm tên, SKU...', 'Search name, SKU...')} 
                style={{ minWidth: 250 }}
              />
              <div className="barcode-scan-row" style={{ flexGrow: 1 }}>
                <Input
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      fillByBarcode(scanValue)
                    }
                  }}
                  placeholder={tr('Quét barcode', 'Scan barcode')}
                  className="barcode-scan-row__input"
                />
                <Button type="button" variant="secondary" onClick={() => fillByBarcode(scanValue)}>
                  <ScanBarcode size={16} />
                </Button>
                <label className="ui-button ui-button--ghost ui-button--icon ui-input--file-btn">
                  <FileUp size={16} />
                  <input type="file" accept="image/*" className="ui-input--file-hidden" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs 
              tabs={categoryTabs} 
              activeTab={selectedCategory} 
              onChange={setSelectedCategory} 
            />

            {loading ? (
              <p className="page-state">{tr('Đang tải sản phẩm...', 'Loading products...')}</p>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <ShoppingCart size={48} className="empty-state__icon" />
                <h3 className="empty-state__title">{tr('Không tìm thấy sản phẩm', 'No products found')}</h3>
                <p className="empty-state__description">{tr('Chi nhánh này không có sản phẩm phù hợp.', 'This branch has no matching products.')}</p>
              </div>
            ) : (
              <div className="product-grid product-grid--pos">
                {filteredProducts.map((product) => (
                  <button key={product.id} type="button" className="product-tile product-tile--pos" onClick={() => addToCart(product)}>
                    {product.imageUrl ? (
                      <div style={{ height: 100, borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: 'var(--surface-strong)' }}>
                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ height: 100, borderRadius: 8, marginBottom: 8, background: 'var(--surface-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="product-tile__topline">
                      <span>{product.sku}</span>
                      <Badge tone="info">{stockByProduct[product.id] ?? 0}</Badge>
                    </div>
                    <h3>{product.name}</h3>
                    <strong style={{ color: 'var(--primary)' }}>{formatCurrency(product.price)}</strong>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="pos-sidebar">
          <div className="pos-checkout-stack">
            <Card>
              <CardHeader>
                <div>
                  <p className="panel__eyebrow">{tr('Giỏ hàng', 'Cart')}</p>
                  <h3>{branchName}</h3>
                </div>
                <ShoppingCart size={20} />
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="page-state" style={{ margin: '32px 0' }}>{t('pos.emptyCart')}</p>
                ) : (
                  <div className="cart-list cart-list--pos">
                    {cart.map((item) => (
                      <article key={item.id} className="cart-row cart-row--pos">
                        <div style={{ flexGrow: 1, minWidth: 0, paddingRight: 12 }}>
                          <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</strong>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatCurrency(item.price)}</p>
                        </div>
                        <div className="quantity-stepper">
                          <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => decreaseQuantity(item.id)}>
                            <Minus size={14} />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => increaseQuantity(item.id)} disabled={item.quantity >= item.branchStock}>
                            <Plus size={14} />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', marginLeft: 8 }}>
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
              <CardContent style={{ paddingTop: 24 }}>
                <form className="form-grid" onSubmit={checkout}>
                  <label className="field">
                    <span>{t('pos.note')}</span>
                    <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr('VD: Bán tại quầy ca sáng', 'Example: Morning counter sale')} />
                  </label>
                  <div className="summary-block summary-block--pos">
                    <div className="summary-block__row summary-block__row--total">
                      <span style={{ fontSize: '1.2rem' }}>{tr('Tổng cộng', 'Total')}</span>
                      <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{formatCurrency(subtotal)}</strong>
                    </div>
                  </div>
                  <Button type="submit" size="lg" full disabled={submitting || cart.length === 0}>
                    <CreditCard size={18} />
                    {submitting ? tr('Đang xử lý...', 'Processing...') : t('pos.checkout')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Modal 
        isOpen={!!receiptSale} 
        onClose={() => setReceiptSale(null)} 
        title={tr('Thanh toán thành công', 'Checkout successful')}
        maxWidth="450px"
        footer={
          <Button onClick={() => setReceiptSale(null)}>
            {tr('Đóng', 'Close')}
          </Button>
        }
      >
        {receiptSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <CheckCircle2 size={64} color="var(--success)" style={{ margin: '16px 0' }} />
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{formatCurrency(receiptSale.totalAmount)}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{tr('Mã hóa đơn', 'Receipt ID')}: <strong>{receiptSale.saleCode}</strong></p>
            
            <div style={{ width: '100%', borderTop: '1px dashed var(--border-strong)', paddingTop: '16px', marginTop: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <tbody>
                  {receiptSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 0' }}>{item.quantity}x {item.productName}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '16px' }}>
              {new Date(receiptSale.createdAt).toLocaleString('vi-VN')} - {receiptSale.branchName}
            </p>
          </div>
        )}
      </Modal>
    </section>
  )
}

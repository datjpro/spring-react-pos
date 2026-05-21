import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Barcode, Boxes, PackagePlus, RefreshCw, Search, Tags } from 'lucide-react'
import { BarcodePreview } from '../components/BarcodePreview'
import { PaginationBar } from '../components/PaginationBar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useI18n } from '../i18n'
import { createProduct, getProductCategories, getProducts } from '../services/products'
import type { CreateProductRequest, ProductPageResponse } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { generateBarcodeValue, type BarcodeFormat } from '../utils/barcode'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const emptyProduct: CreateProductRequest = {
  sku: '',
  name: '',
  category: 'General',
  price: 0,
  cost: 0,
  stock: 0,
  unit: 'cái',
  barcode: '',
  description: '',
  imageUrl: '',
}

export function ProductsPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [products, setProducts] = useState<ProductPageResponse | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState<CreateProductRequest>(emptyProduct)
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const lowStockCount = useMemo(() => products?.content.filter((product) => product.stock <= 5).length ?? 0, [products])
  const activeCount = useMemo(() => products?.content.filter((product) => product.active).length ?? 0, [products])

  useEffect(() => {
    setPage(0)
  }, [search])

  useEffect(() => {
    void loadProducts()
  }, [search, page])

  useEffect(() => {
    getProductCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  function updateField<K extends keyof CreateProductRequest>(field: K, value: CreateProductRequest[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function loadProducts() {
    setLoading(true)
    setMessage(null)
    try {
      setProducts(await getProducts({ search: search || undefined, page, size: 12 }))
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await createProduct(form)
      setForm(emptyProduct)
      setMessage(tr('Đã tạo sản phẩm mới.', 'Product created.'))
      await loadProducts()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack catalog-workspace">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Catalog</p>
          <h2 className="page-header__title">{tr('Quản lý sản phẩm', 'Product management')}</h2>
          <p className="page-header__description">{tr('Theo dõi tồn kho, giá bán và tạo nhanh sản phẩm cho hệ thống POS.', 'Track stock, prices, and create products for POS.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadProducts()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      {message ? <p className={message.includes('Đã') || message.includes('created') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><Boxes size={22} /><span>{tr('Tổng sản phẩm', 'Total products')}</span><strong>{products?.totalElements ?? 0}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><Tags size={22} /><span>{tr('Đang bán', 'Active')}</span><strong>{activeCount}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><Barcode size={22} /><span>{tr('Sắp hết hàng', 'Low stock')}</span><strong>{lowStockCount}</strong></CardContent></Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Products</p><h3>{tr('Danh sách sản phẩm', 'Product list')}</h3></div><Badge tone="info">{products?.content.length ?? 0}</Badge></CardHeader>
          <CardContent>
            <label className="pos-search"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr('Tìm tên, SKU, barcode...', 'Search name, SKU, barcode...')} /></label>
            {loading ? <p className="page-state">{tr('Đang tải sản phẩm...', 'Loading products...')}</p> : null}
            {!loading && products?.content.length === 0 ? <p className="page-state">{tr('Chưa có sản phẩm phù hợp.', 'No matching products.')}</p> : null}
            {!loading && products?.content.length ? (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                  <tbody>
                    {products.content.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.category ?? '-'}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td><Badge tone={product.stock <= 5 ? 'warning' : 'neutral'}>{product.stock} {product.unit}</Badge></td>
                        <td><Badge tone={product.active ? 'success' : 'danger'}>{product.active ? tr('Đang bán', 'Active') : tr('Ngừng bán', 'Inactive')}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {products ? <PaginationBar page={products.page} totalPages={products.totalPages} totalElements={products.totalElements} size={products.size} onPageChange={setPage} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create</p><h3>{tr('Thêm sản phẩm', 'Add product')}</h3></div><PackagePlus size={20} /></CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitProduct}>
              <label className="field"><span>SKU</span><Input required value={form.sku} onChange={(event) => updateField('sku', event.target.value)} /></label>
              <label className="field"><span>{tr('Tên sản phẩm', 'Product name')}</span><Input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
              <label className="field"><span>{tr('Danh mục', 'Category')}</span><Input list="product-categories" value={form.category ?? ''} onChange={(event) => updateField('category', event.target.value)} /></label>
              <datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Giá bán', 'Price')}</span><Input required type="number" min={0} value={form.price} onChange={(event) => updateField('price', Number(event.target.value))} /></label>
                <label className="field"><span>{tr('Giá vốn', 'Cost')}</span><Input type="number" min={0} value={form.cost ?? 0} onChange={(event) => updateField('cost', Number(event.target.value))} /></label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Tồn kho tổng', 'Total stock')}</span><Input required type="number" min={0} value={form.stock} onChange={(event) => updateField('stock', Number(event.target.value))} /></label>
                <label className="field"><span>{tr('Đơn vị', 'Unit')}</span><Input required value={form.unit} onChange={(event) => updateField('unit', event.target.value)} /></label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field"><span>{tr('Chuẩn barcode', 'Barcode format')}</span><select className="ui-input" value={barcodeFormat} onChange={(event) => setBarcodeFormat(event.target.value as BarcodeFormat)}><option value="CODE128">Code 128</option><option value="EAN13">EAN-13</option></select></label>
                <label className="field"><span>Barcode</span><Input value={form.barcode ?? ''} onChange={(event) => updateField('barcode', event.target.value)} placeholder={tr('Nhập hoặc tự tạo barcode', 'Enter or generate barcode')} /></label>
              </div>
              <Button type="button" variant="secondary" onClick={() => updateField('barcode', generateBarcodeValue(barcodeFormat))}>{tr('Tự tạo barcode', 'Generate barcode')}</Button>
              <BarcodePreview productName={form.name} barcode={form.barcode ?? ''} price={form.price} format={barcodeFormat} />
              <Button type="submit" full disabled={saving}>{saving ? tr('Đang lưu...', 'Saving...') : tr('Tạo sản phẩm', 'Create product')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Barcode, Boxes, PackagePlus, RefreshCw, Search, Sparkles, Tags } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { BarcodePreview } from '../components/BarcodePreview'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createProduct, getProductCategories, getProducts } from '../services/products'
import type { CreateProductRequest, ProductPageResponse } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { generateBarcodeValue, readBarcodeFromFile, type BarcodeFormat, type BarcodeMode } from '../utils/barcode'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
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

const marketUnits = [
  { value: 'cái', label: 'Cái' },
  { value: 'chiếc', label: 'Chiếc' },
  { value: 'bộ', label: 'Bộ' },
  { value: 'hộp', label: 'Hộp' },
  { value: 'gói', label: 'Gói' },
  { value: 'túi', label: 'Túi' },
  { value: 'thùng', label: 'Thùng' },
  { value: 'chai', label: 'Chai' },
  { value: 'lon', label: 'Lon' },
  { value: 'ly', label: 'Ly' },
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'Gram' },
  { value: 'l', label: 'Lít' },
  { value: 'ml', label: 'ml' },
  { value: 'm', label: 'Mét' },
  { value: 'cm', label: 'cm' },
]

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<ProductPageResponse | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState<CreateProductRequest>(emptyProduct)
  const [barcodeMode, setBarcodeMode] = useState<BarcodeMode>('auto')
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const lowStockCount = useMemo(() => products?.content.filter((product) => product.stock <= 5).length ?? 0, [products])
  const activeCount = useMemo(() => products?.content.filter((product) => product.active).length ?? 0, [products])

  useEffect(() => {
    void loadProducts()
  }, [search])

  useEffect(() => {
    getProductCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (barcodeMode === 'auto' && !form.barcode) {
      updateField('barcode', generateBarcodeValue(barcodeFormat))
    }
  }, [barcodeMode, barcodeFormat])

  async function loadProducts() {
    setLoading(true)
    setMessage(null)

    try {
      const data = await getProducts({ search: search || undefined, size: 12 })
      setProducts(data)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof CreateProductRequest>(field: K, value: CreateProductRequest[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await createProduct(form)
      setForm(emptyProduct)
      setMessage('Đã tạo sản phẩm mới.')
      await loadProducts()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function importBarcodeFile(file: File | null) {
    if (!file) return
    setMessage(null)

    try {
      const barcode = await readBarcodeFromFile(file)
      setBarcodeMode('manual')
      updateField('barcode', barcode)
      setMessage(`Đã đọc barcode: ${barcode}`)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack catalog-workspace">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Catalog</p>
          <h2 className="page-header__title">Quản lý sản phẩm</h2>
          <p className="page-header__description">Theo dõi tồn kho, giá bán và tạo nhanh sản phẩm cho hệ thống POS.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadProducts()} disabled={loading}>
          <RefreshCw size={16} />
          Tải lại
        </Button>
      </header>

      <div className="stats-grid catalog-stats">
        <Card>
          <CardContent className="metric-card"><Boxes size={22} /><span>Tổng sản phẩm</span><strong>{products?.totalElements ?? 0}</strong></CardContent>
        </Card>
        <Card>
          <CardContent className="metric-card"><Tags size={22} /><span>Đang bán</span><strong>{activeCount}</strong></CardContent>
        </Card>
        <Card>
          <CardContent className="metric-card"><Barcode size={22} /><span>Sắp hết hàng</span><strong>{lowStockCount}</strong></CardContent>
        </Card>
      </div>

      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Danh sách</p>
              <h3>Sản phẩm hiện có</h3>
            </div>
            <Badge tone="info">{products?.content.length ?? 0} dòng</Badge>
          </CardHeader>
          <CardContent>
            <label className="pos-search">
              <Search size={16} />
              <Input placeholder="Tìm tên, SKU, barcode..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>

            {loading ? <p className="page-state">Đang tải sản phẩm...</p> : null}
            {!loading && products?.content.length === 0 ? <p className="page-state">Chưa có sản phẩm phù hợp.</p> : null}

            {!loading && products?.content.length ? (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Tên</th>
                      <th>Nhóm</th>
                      <th>Giá</th>
                      <th>Tồn</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.content.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.category ?? '-'}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td><Badge tone={product.stock <= 5 ? 'warning' : 'neutral'}>{product.stock} {product.unit}</Badge></td>
                        <td><Badge tone={product.active ? 'success' : 'danger'}>{product.active ? 'Đang bán' : 'Ngừng bán'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Tạo mới</p>
              <h3>Thêm sản phẩm</h3>
            </div>
            <PackagePlus size={20} />
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={submitProduct}>
              <label className="field"><span>SKU</span><Input required value={form.sku} onChange={(event) => updateField('sku', event.target.value)} /></label>
              <label className="field"><span>Tên sản phẩm</span><Input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
              <label className="field"><span>Danh mục</span><Input list="product-categories" value={form.category ?? ''} onChange={(event) => updateField('category', event.target.value)} /></label>
              <datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
              <div className="form-grid form-grid--two">
                <label className="field"><span>Giá bán</span><Input required type="number" min={0} value={form.price} onChange={(event) => updateField('price', Number(event.target.value))} /></label>
                <label className="field"><span>Giá vốn</span><Input type="number" min={0} value={form.cost ?? 0} onChange={(event) => updateField('cost', Number(event.target.value))} /></label>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field"><span>Tồn kho</span><Input required type="number" min={0} value={form.stock} onChange={(event) => updateField('stock', Number(event.target.value))} /></label>
                <label className="field">
                  <span>Đơn vị</span>
                  <select className="ui-input" required value={form.unit} onChange={(event) => updateField('unit', event.target.value)}>
                    {marketUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="barcode-tools">
                <Button type="button" variant={barcodeMode === 'manual' ? 'primary' : 'secondary'} size="sm" onClick={() => setBarcodeMode('manual')}>Nhập / quét tay</Button>
                <Button type="button" variant={barcodeMode === 'auto' ? 'primary' : 'secondary'} size="sm" onClick={() => { setBarcodeMode('auto'); updateField('barcode', generateBarcodeValue(barcodeFormat)) }}><Sparkles size={14} /> Tự tạo</Button>
              </div>
              <div className="form-grid form-grid--two">
                <label className="field">
                  <span>Chuẩn barcode</span>
                  <select className="ui-input" value={barcodeFormat} onChange={(event) => setBarcodeFormat(event.target.value as BarcodeFormat)}>
                    <option value="CODE128">Code 128</option>
                    <option value="EAN13">EAN-13</option>
                  </select>
                </label>
                <label className="field">
                  <span>Import file mã</span>
                  <input className="ui-input ui-input--file" type="file" accept="image/*" onChange={(event) => void importBarcodeFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              <label className="field"><span>Barcode</span><Input value={form.barcode ?? ''} readOnly={barcodeMode === 'auto'} onChange={(event) => updateField('barcode', event.target.value)} placeholder="Quét scanner hoặc tạo tự động" /></label>
              <BarcodePreview productName={form.name} barcode={form.barcode ?? ''} price={form.price} format={barcodeFormat} />
              <Button type="submit" full disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo sản phẩm'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

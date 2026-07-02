import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Barcode, Boxes, PackagePlus, RefreshCw, Search, Tags, Edit, Trash2 } from 'lucide-react'
import { BarcodePreview } from '../components/BarcodePreview'
import { PaginationBar } from '../components/PaginationBar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../store/toast'
import { useI18n } from '../i18n'
import { createProduct, deleteProduct, getProductCategories, getProducts, updateProduct } from '../services/products'
import type { CreateProductRequest, Product, ProductPageResponse, UpdateProductRequest } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'
import { generateBarcodeValue, type BarcodeFormat } from '../utils/barcode'
import { hasMinimumRole } from '../utils/roles'
import { useAuth } from '../store/auth'

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
  const { addToast } = useToast()
  const { me } = useAuth()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  
  const canEdit = hasMinimumRole(me?.role, 'MANAGER')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [products, setProducts] = useState<ProductPageResponse | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  
  const [form, setForm] = useState<CreateProductRequest>(emptyProduct)
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Edit Modal State
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState<UpdateProductRequest | null>(null)
  
  // Delete Dialog State
  const [deleteProductItem, setDeleteProductItem] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

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
  
  function updateEditField<K extends keyof UpdateProductRequest>(field: K, value: UpdateProductRequest[K]) {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value })
    }
  }

  async function loadProducts() {
    setLoading(true)
    try {
      setProducts(await getProducts({ search: search || undefined, page, size: 12 }))
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      await createProduct(form)
      setForm(emptyProduct)
      addToast(tr('Đã tạo sản phẩm mới.', 'Product created.'), 'success')
      await loadProducts()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }
  
  function openEditModal(product: Product) {
    setEditProduct(product)
    setEditForm({
      name: product.name,
      category: product.category ?? undefined,
      price: product.price,
      cost: product.cost ?? undefined,
      stock: product.stock,
      unit: product.unit,
      barcode: product.barcode ?? undefined,
      description: product.description ?? undefined,
      imageUrl: product.imageUrl ?? undefined,
      active: product.active
    })
  }
  
  async function submitEditProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editProduct || !editForm) return
    
    setSaving(true)
    try {
      await updateProduct(editProduct.id, editForm)
      setEditProduct(null)
      setEditForm(null)
      addToast(tr('Cập nhật sản phẩm thành công.', 'Product updated successfully.'), 'success')
      await loadProducts()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }
  
  async function confirmDeleteProduct() {
    if (!deleteProductItem) return
    
    setDeleting(true)
    try {
      await deleteProduct(deleteProductItem.id)
      setDeleteProductItem(null)
      addToast(tr('Đã xóa sản phẩm.', 'Product deleted.'), 'success')
      await loadProducts()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setDeleting(false)
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

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><Boxes size={22} /><span>{tr('Tổng sản phẩm', 'Total products')}</span><strong>{products?.totalElements ?? 0}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><Tags size={22} /><span>{tr('Đang bán', 'Active')}</span><strong>{activeCount}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><Barcode size={22} /><span>{tr('Sắp hết hàng', 'Low stock')}</span><strong>{lowStockCount}</strong></CardContent></Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Products</p>
              <h3>{tr('Danh sách sản phẩm', 'Product list')}</h3>
            </div>
            <Badge tone="info">{products?.content.length ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <label className="pos-search"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr('Tìm tên, SKU, barcode...', 'Search name, SKU, barcode...')} /></label>
            {loading ? <p className="page-state">{tr('Đang tải sản phẩm...', 'Loading products...')}</p> : null}
            {!loading && products?.content.length === 0 ? <p className="page-state">{tr('Chưa có sản phẩm phù hợp.', 'No matching products.')}</p> : null}
            {!loading && products?.content.length ? (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
                  <tbody>
                    {products.content.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.category ?? '-'}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td><Badge tone={product.stock <= 5 ? 'warning' : 'neutral'}>{product.stock} {product.unit}</Badge></td>
                        <td><Badge tone={product.active ? 'success' : 'danger'}>{product.active ? tr('Đang bán', 'Active') : tr('Ngừng bán', 'Inactive')}</Badge></td>
                        {canEdit && (
                          <td style={{ textAlign: 'right' }}>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => openEditModal(product)} style={{ marginRight: 8 }}>
                              <Edit size={14} />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => setDeleteProductItem(product)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {products ? <PaginationBar page={products.page} totalPages={products.totalPages} totalElements={products.totalElements} size={products.size} onPageChange={setPage} /> : null}
          </CardContent>
        </Card>

        {canEdit && (
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
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={!!editProduct && !!editForm} 
        onClose={() => { setEditProduct(null); setEditForm(null) }}
        title={tr('Cập nhật sản phẩm', 'Update product')}
        maxWidth="600px"
      >
        {editForm && (
          <form id="edit-product-form" className="form-grid" onSubmit={submitEditProduct}>
            <div className="form-grid form-grid--two">
              <label className="field"><span>SKU</span><Input value={editProduct?.sku} disabled /></label>
              <label className="field"><span>{tr('Tên sản phẩm', 'Product name')}</span><Input required value={editForm.name} onChange={(event) => updateEditField('name', event.target.value)} /></label>
            </div>
            <label className="field"><span>{tr('Danh mục', 'Category')}</span><Input list="product-categories" value={editForm.category ?? ''} onChange={(event) => updateEditField('category', event.target.value)} /></label>
            
            <div className="form-grid form-grid--two">
              <label className="field"><span>{tr('Giá bán', 'Price')}</span><Input required type="number" min={0} value={editForm.price} onChange={(event) => updateEditField('price', Number(event.target.value))} /></label>
              <label className="field"><span>{tr('Giá vốn', 'Cost')}</span><Input type="number" min={0} value={editForm.cost ?? 0} onChange={(event) => updateEditField('cost', Number(event.target.value))} /></label>
            </div>
            <div className="form-grid form-grid--two">
              <label className="field"><span>{tr('Tồn kho tổng', 'Total stock')}</span><Input required type="number" min={0} value={editForm.stock} onChange={(event) => updateEditField('stock', Number(event.target.value))} /></label>
              <label className="field"><span>{tr('Đơn vị', 'Unit')}</span><Input required value={editForm.unit} onChange={(event) => updateEditField('unit', event.target.value)} /></label>
            </div>
            
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>{tr('Trạng thái', 'Status')}</span>
                <select className="ui-input" value={editForm.active ? 'true' : 'false'} onChange={(e) => updateEditField('active', e.target.value === 'true')}>
                  <option value="true">{tr('Đang bán', 'Active')}</option>
                  <option value="false">{tr('Ngừng bán', 'Inactive')}</option>
                </select>
              </label>
              <label className="field"><span>Barcode</span><Input value={editForm.barcode ?? ''} onChange={(event) => updateEditField('barcode', event.target.value)} /></label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <Button type="button" variant="ghost" onClick={() => { setEditProduct(null); setEditForm(null) }}>{tr('Hủy', 'Cancel')}</Button>
              <Button type="submit" disabled={saving}>{saving ? tr('Đang lưu...', 'Saving...') : tr('Cập nhật', 'Update')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteProductItem}
        onClose={() => setDeleteProductItem(null)}
        onConfirm={confirmDeleteProduct}
        title={tr('Xóa sản phẩm', 'Delete product')}
        message={tr(`Bạn có chắc muốn xóa sản phẩm ${deleteProductItem?.name} (${deleteProductItem?.sku})? Thao tác này không thể hoàn tác.`, `Are you sure you want to delete ${deleteProductItem?.name} (${deleteProductItem?.sku})? This action cannot be undone.`)}
        confirmLabel={tr('Xóa', 'Delete')}
        variant="danger"
        loading={deleting}
      />
    </section>
  )
}

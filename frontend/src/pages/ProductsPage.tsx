import { useEffect, useState } from 'react'
import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { createProduct, deleteProduct, getProductById, getProductCategories, getProducts, updateProduct } from '../services/products'
import type { ProductPageResponse } from '../types/product'
import { getApiErrorMessage } from '../utils/apiError'

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<ProductPageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    getProducts({ search: search || undefined, size: 10 })
      .then((data) => setProducts(data))
      .catch((listError) => setError(getApiErrorMessage(listError)))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <ApiWorkbench
      eyebrow="Catalog"
      title="Products"
      actions={[
        { name: 'List products', description: 'GET /products', run: () => getProducts({ size: 10 }) },
        { name: 'Get product #1', description: 'GET /products/{id}', run: () => getProductById(1) },
        { name: 'List categories', description: 'GET /products/categories', run: () => getProductCategories() },
        { name: 'Delete product #1', description: 'DELETE /products/{id}', run: () => deleteProduct(1) },
        {
          name: 'Update product #1',
          description: 'PUT /products/{id}',
          run: () => updateProduct(1, {
            name: 'Updated product',
            category: 'General',
            price: 10000,
            cost: 8000,
            stock: 10,
            unit: 'pcs',
            barcode: 'FE-UPDATE-001',
            description: 'Updated from FE workbench',
            imageUrl: 'https://example.com/product.jpg',
            active: true,
          }),
        },
      ]}
    >
      <div className="panel">
        <div className="toolbar">
          <input placeholder="Search by name or SKU" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="button">Filter</button>
        </div>

        {loading ? <p className="page-state">Loading products...</p> : null}
        {error ? <p className="page-state page-state--error">{error}</p> : null}

        {!loading && !error ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products?.content.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category ?? '-'}</td>
                  <td>{product.price.toLocaleString('vi-VN')} VND</td>
                  <td>{product.stock}</td>
                  <td>{product.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <JsonForm
        title="Create product"
        initialValue={{
          sku: 'POS-GEN-FE-0001',
          name: 'Product from FE',
          category: 'General',
          price: 10000,
          cost: 8000,
          stock: 10,
          unit: 'pcs',
          barcode: 'FE-001',
          description: 'Created from FE workbench',
          imageUrl: 'https://example.com/product.jpg',
        }}
        onSubmit={(value) => createProduct(value)}
      />
    </ApiWorkbench>
  )
}

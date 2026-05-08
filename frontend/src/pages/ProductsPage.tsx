import { useEffect, useState } from 'react'
import { getProducts } from '../services/products'
import type { ProductPageResponse } from '../types/product'

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
      .catch(() => setError('Cannot load products.'))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Catalog</p>
          <h2 className="page-header__title">Products</h2>
        </div>

        <button type="button" className="primary-button">
          New product
        </button>
      </header>

      <div className="panel">
        <div className="toolbar">
          <input
            placeholder="Search by name or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
                  <td>{product.price.toLocaleString('vi-VN')} đ</td>
                  <td>{product.stock}</td>
                  <td>{product.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  )
}

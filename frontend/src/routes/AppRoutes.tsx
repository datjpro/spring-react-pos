import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { MainLayout } from '../layouts/MainLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { ProductsPage } from '../pages/ProductsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<PlaceholderPage title="Orders" />} />
          <Route path="/pos" element={<PlaceholderPage title="POS" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Coming next</p>
          <h2 className="page-header__title">{title}</h2>
        </div>
      </header>
      <div className="panel">Screen shell is ready for the next API integration phase.</div>
    </section>
  )
}

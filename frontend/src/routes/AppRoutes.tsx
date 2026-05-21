import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { MainLayout } from '../layouts/MainLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { AuthToolsPage } from '../pages/AuthToolsPage'
import { InventoryPage } from '../pages/InventoryPage'
import { LoginPage } from '../pages/LoginPage'
import { MasterDataPage } from '../pages/MasterDataPage'
import { PosPage } from '../pages/PosPage'
import { ProductsPage } from '../pages/ProductsPage'
import { PurchasesPage } from '../pages/PurchasesPage'
import { ReportsPage } from '../pages/ReportsPage'
import { SalesPage } from '../pages/SalesPage'
import { SystemPage } from '../pages/SystemPage'
import { UsersPage } from '../pages/UsersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/master-data" element={<MasterDataPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/auth-tools" element={<AuthToolsPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

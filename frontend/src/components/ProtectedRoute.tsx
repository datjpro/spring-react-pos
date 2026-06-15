import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function ProtectedRoute() {
  const { loading, token } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-state">Checking session...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

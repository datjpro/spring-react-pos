import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { hasAnyRole, type AppRole } from '../utils/roles'

export function RoleRoute({ roles }: { roles: AppRole[] }) {
  const { me } = useAuth()

  if (!hasAnyRole(me?.role, roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

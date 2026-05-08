import { NavLink, Outlet } from 'react-router-dom'
import { CreditCard, LayoutDashboard, LogOut, Package, ShoppingCart } from 'lucide-react'
import { useAuth } from '../store/auth'

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/pos', label: 'POS', icon: CreditCard },
]

export function MainLayout() {
  const { me, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="sidebar__eyebrow">Spring React POS</p>
          <h1 className="sidebar__title">Admin Panel</h1>
          <p className="sidebar__user">{me?.username ?? 'Unknown user'}</p>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {menuItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={label} to={to} className={({ isActive }) => `sidebar__nav-item ${isActive ? 'is-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="sidebar__logout" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
import { CreditCard, LayoutDashboard, Package, ShoppingCart } from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Products', icon: Package },
  { label: 'Orders', icon: ShoppingCart },
  { label: 'POS', icon: CreditCard },
]

export function MainLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="sidebar__eyebrow">Spring React POS</p>
          <h1 className="sidebar__title">Admin Panel</h1>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {menuItems.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className="sidebar__nav-item">
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

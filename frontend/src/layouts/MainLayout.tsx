import { NavLink, Outlet } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  CreditCard,
  Database,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  SunMedium,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../store/auth'

const navSections = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, hint: 'KPI & quick actions' }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: Package, hint: 'SKU, price, stock' },
      { to: '/master-data', label: 'Master Data', icon: Database, hint: 'Branches & suppliers' },
      { to: '/users', label: 'Users', icon: Users, hint: 'Roles & access' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { to: '/pos', label: 'POS', icon: CreditCard, hint: 'Counter checkout' },
      { to: '/orders', label: 'Orders', icon: ShoppingCart, hint: 'Orders & payments' },
      { to: '/sales', label: 'Sales', icon: ClipboardList, hint: 'Sales invoices' },
      { to: '/purchases', label: 'Purchases', icon: ShoppingCart, hint: 'Supplier intake' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Boxes, hint: 'Stock movement' },
      { to: '/reports', label: 'Reports', icon: ScrollText, hint: 'CSV & analytics' },
      { to: '/system', label: 'System', icon: Settings, hint: 'Admin tools' },
      { to: '/auth-tools', label: 'Auth Tools', icon: KeyRound, hint: 'Token utilities' },
    ],
  },
]

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const saved = window.localStorage.getItem('pos-theme')
  return saved === 'light' ? 'light' : 'dark'
}

export function MainLayout() {
  const { me, logout } = useAuth()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('pos-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? 'sidebar sidebar--open' : 'sidebar'}>
        <div className="sidebar__brand-row">
          <div>
            <p className="sidebar__eyebrow">Spring React POS</p>
            <h1 className="sidebar__title">Admin Panel</h1>
            <p className="sidebar__user">{me?.username ?? 'Unknown user'}</p>
          </div>
          <button type="button" className="icon-button sidebar__close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar__sections">
          {navSections.map((section) => (
            <section key={section.label} className="sidebar__section">
              <p className="sidebar__section-label">{section.label}</p>
              <nav className="sidebar__nav" aria-label={section.label}>
                {section.items.map(({ to, label, icon: Icon, hint }) => (
                  <NavLink key={label} to={to} className={({ isActive }) => `sidebar__nav-item ${isActive ? 'is-active' : ''}`}>
                    <Icon size={18} />
                    <span>
                      <strong>{label}</strong>
                      <small>{hint}</small>
                    </span>
                  </NavLink>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <button type="button" className="sidebar__logout" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {sidebarOpen ? <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left">
            <button type="button" className="icon-button topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <div>
              <p className="page-header__eyebrow">Control Center</p>
              <strong className="topbar__title">POS Admin Workspace</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <button type="button" className="ghost-button" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </button>
            <div className="user-chip">
              <span className="user-chip__avatar">{(me?.username ?? 'U').slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{me?.username ?? 'User'}</strong>
                <small>{me?.role ?? 'Authenticated'}</small>
              </span>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

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
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../store/auth'
import { hasMinimumRole, type AppRole } from '../utils/roles'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  hint: string
  minRole?: AppRole
}

interface NavSection {
  label: string
  items: NavItem[]
}

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  const saved = window.localStorage.getItem('pos-theme')
  return saved === 'light' ? 'light' : 'dark'
}

export function MainLayout() {
  const { me, logout } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('pos-theme', theme)
  }, [theme])

  const navSections = useMemo<NavSection[]>(
    () => [
      {
        label: 'Overview',
        items: [{ to: '/', label: t('layout.dashboard'), icon: LayoutDashboard, hint: 'KPI & quick actions' }],
      },
      {
        label: 'Catalog',
        items: [
          { to: '/products', label: t('layout.products'), icon: Package, hint: 'SKU, price, stock', minRole: 'MANAGER' },
          { to: '/master-data', label: t('layout.masterData'), icon: Database, hint: 'Branches & suppliers', minRole: 'ADMIN' },
          { to: '/users', label: t('layout.users'), icon: Users, hint: 'Roles & access', minRole: 'ADMIN' },
        ],
      },
      {
        label: 'Transactions',
        items: [
          { to: '/pos', label: t('layout.pos'), icon: CreditCard, hint: 'Counter checkout' },
          { to: '/sales', label: t('layout.sales'), icon: ClipboardList, hint: 'Sales invoices', minRole: 'MANAGER' },
          { to: '/purchases', label: t('layout.purchases'), icon: ShoppingCart, hint: 'Supplier intake', minRole: 'MANAGER' },
        ],
      },
      {
        label: 'Operations',
        items: [
          { to: '/inventory', label: t('layout.inventory'), icon: Boxes, hint: 'Stock movement' },
          { to: '/reports', label: t('layout.reports'), icon: ScrollText, hint: 'CSV & analytics', minRole: 'MANAGER' },
          { to: '/system', label: t('layout.system'), icon: Settings, hint: 'Admin tools', minRole: 'ADMIN' },
          { to: '/auth-tools', label: t('layout.authTools'), icon: KeyRound, hint: 'Token utilities', minRole: 'ADMIN' },
        ],
      },
    ],
    [t],
  )

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
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => !item.minRole || hasMinimumRole(me?.role, item.minRole))
            if (visibleItems.length === 0) return null

            return (
            <section key={section.label} className="sidebar__section">
              <p className="sidebar__section-label">{section.label}</p>
              <nav className="sidebar__nav" aria-label={section.label}>
                {visibleItems.map(({ to, label, icon: Icon, hint }) => (
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
            )
          })}
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
            <button type="button" className="ghost-button" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}>
              {language.toUpperCase()}
            </button>
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

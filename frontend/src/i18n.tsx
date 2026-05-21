import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Language = 'vi' | 'en'

type Messages = Record<string, string>

const messages: Record<Language, Messages> = {
  vi: {
    'common.actions': 'Thao tác',
    'common.active': 'Đang hoạt động',
    'common.branch': 'Chi nhánh',
    'common.branchId': 'Chi nhánh',
    'common.cancel': 'Hủy',
    'common.created': 'Ngày tạo',
    'common.createdBy': 'Người tạo',
    'common.inactive': 'Ngừng hoạt động',
    'common.loading': 'Đang tải...',
    'common.password': 'Mật khẩu',
    'common.product': 'Sản phẩm',
    'common.productId': 'Sản phẩm',
    'common.reload': 'Tải lại',
    'common.role': 'Vai trò',
    'common.status': 'Trạng thái',
    'common.username': 'Tên đăng nhập',
    'common.users': 'người dùng',
    'dashboard.description': 'Theo dõi doanh thu, hóa đơn bán và truy cập nhanh theo module nghiệp vụ chính.',
    'dashboard.inventory.description': 'Tồn theo chi nhánh và biến động kho',
    'dashboard.inventory.title': 'Kiểm soát tồn kho',
    'dashboard.pos.description': 'Tạo phiếu bán trực tiếp qua sales',
    'dashboard.pos.title': 'Bán hàng tại quầy',
    'dashboard.products.description': 'Cập nhật SKU, giá bán, trạng thái',
    'dashboard.products.title': 'Quản lý sản phẩm',
    'dashboard.sales.description': 'Xem giao dịch bán hàng theo chi nhánh',
    'dashboard.sales.title': 'Theo dõi hóa đơn bán',
    'dashboard.title': 'Bảng điều khiển POS',
    'inventory.adjustmentTitle': 'Điều chỉnh kho',
    'inventory.barcodeTitle': 'Quét mã để chọn sản phẩm nhanh',
    'inventory.description': 'Theo dõi tồn theo chi nhánh và lịch sử biến động kho từ backend mới.',
    'inventory.emptyMovements': 'Không có dữ liệu biến động kho cho bộ lọc hiện tại.',
    'inventory.emptyStock': 'Không có dữ liệu tồn kho cho bộ lọc hiện tại.',
    'inventory.filter': 'Lọc dữ liệu',
    'inventory.movementTitle': 'Lịch sử biến động kho',
    'inventory.stockTitle': 'Tồn hiện tại theo chi nhánh',
    'inventory.title': 'Quản lý tồn kho đa chi nhánh',
    'layout.authTools': 'Công cụ xác thực',
    'layout.dashboard': 'Bảng điều khiển',
    'layout.inventory': 'Tồn kho',
    'layout.masterData': 'Dữ liệu nền',
    'layout.pos': 'Bán hàng',
    'layout.products': 'Sản phẩm',
    'layout.purchases': 'Nhập hàng',
    'layout.reports': 'Báo cáo',
    'layout.sales': 'Hóa đơn bán',
    'layout.system': 'Hệ thống',
    'layout.users': 'Người dùng',
    'login.description': 'Đăng nhập bằng tài khoản quản trị backend.',
    'login.error': 'Đăng nhập thất bại. Kiểm tra tài khoản/mật khẩu.',
    'login.submit': 'Đăng nhập',
    'login.submitting': 'Đang đăng nhập...',
    'login.title': 'Đăng nhập quản trị POS',
    'pos.addToCart': 'Thêm vào giỏ',
    'pos.branch': 'Chi nhánh bán',
    'pos.checkout': 'Xác nhận bán hàng',
    'pos.description': 'Luồng POS tạo trực tiếp phiếu bán qua endpoint sales.',
    'pos.emptyCart': 'Chưa có sản phẩm.',
    'pos.note': 'Ghi chú',
    'pos.title': 'Bán hàng tại quầy',
    'users.create': 'Tạo người dùng',
    'users.createTitle': 'Thêm người dùng',
    'users.description': 'Quản trị người dùng, vai trò, chi nhánh và trạng thái kích hoạt.',
    'users.listTitle': 'Người dùng hệ thống',
    'users.lock': 'Khóa',
    'users.noBranch': 'Không gán chi nhánh',
    'users.saved': 'Đã tạo người dùng mới.',
    'users.title': 'Người dùng',
    'users.unlock': 'Mở',
  },
  en: {
    'common.actions': 'Actions',
    'common.active': 'Active',
    'common.branch': 'Branch',
    'common.branchId': 'Branch',
    'common.cancel': 'Cancel',
    'common.created': 'Created',
    'common.createdBy': 'Created by',
    'common.inactive': 'Inactive',
    'common.loading': 'Loading...',
    'common.password': 'Password',
    'common.product': 'Product',
    'common.productId': 'Product',
    'common.reload': 'Reload',
    'common.role': 'Role',
    'common.status': 'Status',
    'common.username': 'Username',
    'common.users': 'users',
    'dashboard.description': 'Track revenue, sales invoices, and quick access to main business modules.',
    'dashboard.inventory.description': 'Branch stock and stock movements',
    'dashboard.inventory.title': 'Inventory control',
    'dashboard.pos.description': 'Create sales directly through sales',
    'dashboard.pos.title': 'Counter POS',
    'dashboard.products.description': 'Update SKU, price, and status',
    'dashboard.products.title': 'Product management',
    'dashboard.sales.description': 'View branch sales transactions',
    'dashboard.sales.title': 'Sales invoices',
    'dashboard.title': 'POS Dashboard',
    'inventory.adjustmentTitle': 'Stock adjustment',
    'inventory.barcodeTitle': 'Scan barcode to select product',
    'inventory.description': 'Track branch stock levels and stock movement history from the new backend.',
    'inventory.emptyMovements': 'No stock movement data for current filters.',
    'inventory.emptyStock': 'No stock level data for current filters.',
    'inventory.filter': 'Filter data',
    'inventory.movementTitle': 'Stock movement history',
    'inventory.stockTitle': 'Current branch stock',
    'inventory.title': 'Multi-branch inventory',
    'layout.authTools': 'Auth Tools',
    'layout.dashboard': 'Dashboard',
    'layout.inventory': 'Inventory',
    'layout.masterData': 'Master Data',
    'layout.pos': 'POS',
    'layout.products': 'Products',
    'layout.purchases': 'Purchases',
    'layout.reports': 'Reports',
    'layout.sales': 'Sales',
    'layout.system': 'System',
    'layout.users': 'Users',
    'login.description': 'Sign in with backend admin account.',
    'login.error': 'Login failed. Check username/password.',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in...',
    'login.title': 'POS Admin Login',
    'pos.addToCart': 'Add to cart',
    'pos.branch': 'Sales branch',
    'pos.checkout': 'Confirm sale',
    'pos.description': 'POS flow creates sales directly through sales endpoint.',
    'pos.emptyCart': 'No products selected.',
    'pos.note': 'Note',
    'pos.title': 'Counter POS',
    'users.create': 'Create user',
    'users.createTitle': 'Add user',
    'users.description': 'Manage users, roles, branches, and activation status.',
    'users.listTitle': 'System users',
    'users.lock': 'Lock',
    'users.noBranch': 'No branch',
    'users.saved': 'User created.',
    'users.title': 'Users',
    'users.unlock': 'Unlock',
  },
}

interface I18nValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function getInitialLanguage(): Language {
  const saved = window.localStorage.getItem('pos-language')
  return saved === 'en' ? 'en' : 'vi'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const value = useMemo<I18nValue>(() => {
    function setLanguage(nextLanguage: Language) {
      window.localStorage.setItem('pos-language', nextLanguage)
      setLanguageState(nextLanguage)
    }

    function t(key: string) {
      return messages[language][key] ?? messages.vi[key] ?? key
    }

    return { language, setLanguage, t }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

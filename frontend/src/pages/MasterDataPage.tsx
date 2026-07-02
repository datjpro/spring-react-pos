import { useEffect, useState, type FormEvent } from 'react'
import { Building2, Truck, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { useToast } from '../store/toast'
import { 
  createBranch, updateBranch, deleteBranch, getBranches, 
  createSupplier, updateSupplier, deleteSupplier, getSuppliers 
} from '../services/masterData'
import type { Branch, BranchRequest, Supplier, SupplierRequest } from '../types/masterData'
import { getApiErrorMessage } from '../utils/apiError'

const emptyBranch: BranchRequest = { code: '', name: '', address: '' }
const emptySupplier: SupplierRequest = { code: '', name: '', phone: '', email: '', address: '' }

export function MasterDataPage() {
  const { language } = useI18n()
  const { addToast } = useToast()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [activeTab, setActiveTab] = useState('branches')
  
  const [branches, setBranches] = useState<Branch[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  
  const [branchPage, setBranchPage] = useState(0)
  const [supplierPage, setSupplierPage] = useState(0)
  const pageSize = 10

  const pagedBranches = branches.slice(branchPage * pageSize, branchPage * pageSize + pageSize)
  const pagedSuppliers = suppliers.slice(supplierPage * pageSize, supplierPage * pageSize + pageSize)

  // Form State
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [branchForm, setBranchForm] = useState<BranchRequest>(emptyBranch)
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null)
  
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [supplierForm, setSupplierForm] = useState<SupplierRequest>(emptySupplier)
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null)
  
  const [saving, setSaving] = useState(false)

  // Delete State
  const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null)
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [branchData, supplierData] = await Promise.all([getBranches(), getSuppliers()])
      setBranches(branchData)
      setSuppliers(supplierData)
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- BRANCH ACTIONS ---
  function handleOpenBranchModal(branch?: Branch) {
    if (branch) {
      setEditingBranchId(branch.id)
      setBranchForm({ code: branch.code, name: branch.name, address: branch.address ?? '' })
    } else {
      setEditingBranchId(null)
      setBranchForm(emptyBranch)
    }
    setShowBranchModal(true)
  }

  async function submitBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingBranchId) {
        await updateBranch(editingBranchId, branchForm)
        addToast(tr('Cập nhật chi nhánh thành công.', 'Branch updated.'), 'success')
      } else {
        await createBranch(branchForm)
        addToast(tr('Đã tạo chi nhánh mới.', 'Branch created.'), 'success')
      }
      setShowBranchModal(false)
      await loadData()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteBranch() {
    if (!deleteBranchId) return
    setDeleting(true)
    try {
      await deleteBranch(deleteBranchId)
      addToast(tr('Đã xóa chi nhánh.', 'Branch deleted.'), 'success')
      setDeleteBranchId(null)
      await loadData()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setDeleting(false)
    }
  }

  // --- SUPPLIER ACTIONS ---
  function handleOpenSupplierModal(supplier?: Supplier) {
    if (supplier) {
      setEditingSupplierId(supplier.id)
      setSupplierForm({ code: supplier.code, name: supplier.name, phone: supplier.phone ?? '', email: supplier.email ?? '', address: supplier.address ?? '' })
    } else {
      setEditingSupplierId(null)
      setSupplierForm(emptySupplier)
    }
    setShowSupplierModal(true)
  }

  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingSupplierId) {
        await updateSupplier(editingSupplierId, supplierForm)
        addToast(tr('Cập nhật NCC thành công.', 'Supplier updated.'), 'success')
      } else {
        await createSupplier(supplierForm)
        addToast(tr('Đã tạo nhà cung cấp mới.', 'Supplier created.'), 'success')
      }
      setShowSupplierModal(false)
      await loadData()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDeleteSupplier() {
    if (!deleteSupplierId) return
    setDeleting(true)
    try {
      await deleteSupplier(deleteSupplierId)
      addToast(tr('Đã xóa nhà cung cấp.', 'Supplier deleted.'), 'success')
      setDeleteSupplierId(null)
      await loadData()
    } catch (error) {
      addToast(getApiErrorMessage(error), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Master Data</p>
          <h2 className="page-header__title">{tr('Dữ liệu nền', 'Master Data')}</h2>
          <p className="page-header__description">{tr('Quản lý chi nhánh cửa hàng và đối tác cung cấp.', 'Manage branches and suppliers.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw size={16} /> {tr('Tải lại', 'Reload')}
        </Button>
      </header>

      <Tabs 
        tabs={[
          { id: 'branches', label: tr('Chi nhánh', 'Branches'), icon: <Building2 size={16} /> },
          { id: 'suppliers', label: tr('Nhà cung cấp', 'Suppliers'), icon: <Truck size={16} /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'branches' && (
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Branches</p>
              <h3>{tr('Danh sách chi nhánh', 'Branch list')}</h3>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Badge tone="info">{branches.length}</Badge>
              <Button size="sm" onClick={() => handleOpenBranchModal()}>
                <Plus size={16} /> {tr('Thêm', 'Add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="page-state">{tr('Đang tải...', 'Loading...')}</p> : (
              <>
                <div className="table-wrap">
                  <table className="data-table data-table--dense">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>Address</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {pagedBranches.map((branch) => (
                        <tr key={branch.id}>
                          <td>{branch.code}</td>
                          <td><strong>{branch.name}</strong></td>
                          <td>{branch.address ?? '-'}</td>
                          <td>
                            <Badge tone={branch.active ? 'success' : 'danger'}>
                              {branch.active ? tr('Đang hoạt động', 'Active') : tr('Tạm ngưng', 'Inactive')}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => handleOpenBranchModal(branch)} style={{ marginRight: 8 }}>
                              <Edit size={14} />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => setDeleteBranchId(branch.id)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar page={branchPage} totalPages={Math.ceil(branches.length / pageSize)} totalElements={branches.length} size={pageSize} onPageChange={setBranchPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'suppliers' && (
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Suppliers</p>
              <h3>{tr('Danh sách nhà cung cấp', 'Supplier list')}</h3>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Badge tone="info">{suppliers.length}</Badge>
              <Button size="sm" onClick={() => handleOpenSupplierModal()}>
                <Plus size={16} /> {tr('Thêm', 'Add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="page-state">{tr('Đang tải...', 'Loading...')}</p> : (
              <>
                <div className="table-wrap">
                  <table className="data-table data-table--dense">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>Contact</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {pagedSuppliers.map((supplier) => (
                        <tr key={supplier.id}>
                          <td>{supplier.code}</td>
                          <td><strong>{supplier.name}</strong></td>
                          <td>
                            {supplier.phone && <div style={{ fontSize: '0.85rem' }}>{supplier.phone}</div>}
                            {supplier.email && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supplier.email}</div>}
                          </td>
                          <td>
                            <Badge tone={supplier.active ? 'success' : 'danger'}>
                              {supplier.active ? tr('Đang hoạt động', 'Active') : tr('Tạm ngưng', 'Inactive')}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => handleOpenSupplierModal(supplier)} style={{ marginRight: 8 }}>
                              <Edit size={14} />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="ui-button--icon" onClick={() => setDeleteSupplierId(supplier.id)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar page={supplierPage} totalPages={Math.ceil(suppliers.length / pageSize)} totalElements={suppliers.length} size={pageSize} onPageChange={setSupplierPage} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Branch Modal */}
      <Modal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        title={editingBranchId ? tr('Cập nhật chi nhánh', 'Edit Branch') : tr('Thêm chi nhánh', 'Add Branch')}
        maxWidth="500px"
      >
        <form id="branch-form" className="form-grid" onSubmit={submitBranch}>
          <label className="field">
            <span>Code</span>
            <Input required value={branchForm.code} disabled={!!editingBranchId} onChange={e => setBranchForm(f => ({ ...f, code: e.target.value }))} />
          </label>
          <label className="field">
            <span>{tr('Tên chi nhánh', 'Name')}</span>
            <Input required value={branchForm.name} onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="field">
            <span>{tr('Địa chỉ', 'Address')}</span>
            <Input value={branchForm.address ?? ''} onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setShowBranchModal(false)}>{tr('Hủy', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? tr('Đang lưu...', 'Saving...') : tr('Lưu', 'Save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title={editingSupplierId ? tr('Cập nhật nhà cung cấp', 'Edit Supplier') : tr('Thêm nhà cung cấp', 'Add Supplier')}
        maxWidth="600px"
      >
        <form id="supplier-form" className="form-grid" onSubmit={submitSupplier}>
          <div className="form-grid form-grid--two">
            <label className="field">
              <span>Code</span>
              <Input required value={supplierForm.code} disabled={!!editingSupplierId} onChange={e => setSupplierForm(f => ({ ...f, code: e.target.value }))} />
            </label>
            <label className="field">
              <span>{tr('Tên NCC', 'Name')}</span>
              <Input required value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} />
            </label>
          </div>
          <div className="form-grid form-grid--two">
            <label className="field">
              <span>{tr('Số điện thoại', 'Phone')}</span>
              <Input value={supplierForm.phone ?? ''} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))} />
            </label>
            <label className="field">
              <span>Email</span>
              <Input type="email" value={supplierForm.email ?? ''} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} />
            </label>
          </div>
          <label className="field">
            <span>{tr('Địa chỉ', 'Address')}</span>
            <Input value={supplierForm.address ?? ''} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setShowSupplierModal(false)}>{tr('Hủy', 'Cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? tr('Đang lưu...', 'Saving...') : tr('Lưu', 'Save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletes */}
      <ConfirmDialog
        isOpen={!!deleteBranchId}
        onClose={() => setDeleteBranchId(null)}
        onConfirm={confirmDeleteBranch}
        title={tr('Xóa chi nhánh', 'Delete Branch')}
        message={tr('Bạn có chắc muốn xóa chi nhánh này không? Thao tác này không thể hoàn tác.', 'Are you sure you want to delete this branch?')}
        variant="danger"
        loading={deleting}
      />
      
      <ConfirmDialog
        isOpen={!!deleteSupplierId}
        onClose={() => setDeleteSupplierId(null)}
        onConfirm={confirmDeleteSupplier}
        title={tr('Xóa nhà cung cấp', 'Delete Supplier')}
        message={tr('Bạn có chắc muốn xóa nhà cung cấp này không? Thao tác này không thể hoàn tác.', 'Are you sure you want to delete this supplier?')}
        variant="danger"
        loading={deleting}
      />
    </section>
  )
}

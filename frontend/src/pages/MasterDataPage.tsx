import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PaginationBar } from '../components/PaginationBar'
import { useI18n } from '../i18n'
import { createBranch, createSupplier, getBranches, getSuppliers } from '../services/masterData'
import type { Branch, BranchRequest, Supplier, SupplierRequest } from '../types/masterData'
import { getApiErrorMessage } from '../utils/apiError'

const emptyBranch: BranchRequest = { code: '', name: '', address: '' }
const emptySupplier: SupplierRequest = { code: '', name: '', phone: '', email: '', address: '' }

export function MasterDataPage() {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)

  const [branches, setBranches] = useState<Branch[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [branchForm, setBranchForm] = useState<BranchRequest>(emptyBranch)
  const [supplierForm, setSupplierForm] = useState<SupplierRequest>(emptySupplier)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [branchPage, setBranchPage] = useState(0)
  const [supplierPage, setSupplierPage] = useState(0)
  const pageSize = 10

  const pagedBranches = branches.slice(branchPage * pageSize, branchPage * pageSize + pageSize)
  const pagedSuppliers = suppliers.slice(supplierPage * pageSize, supplierPage * pageSize + pageSize)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setMessage(null)
    try {
      const [branchData, supplierData] = await Promise.all([getBranches(), getSuppliers()])
      setBranches(branchData)
      setSuppliers(supplierData)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createBranch(branchForm)
      setBranchForm(emptyBranch)
      setMessage(tr('Đã tạo chi nhánh mới.', 'Branch created.'))
      await loadData()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      await createSupplier(supplierForm)
      setSupplierForm(emptySupplier)
      setMessage(tr('Đã tạo nhà cung cấp mới.', 'Supplier created.'))
      await loadData()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Catalog</p>
          <h2 className="page-header__title">{tr('Chi nhánh & nhà cung cấp', 'Branches & Suppliers')}</h2>
          <p className="page-header__description">{tr('Quản lý dữ liệu nền cho chi nhánh và nhà cung cấp.', 'Manage branch and supplier master data.')}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>{tr('Tải lại', 'Reload')}</Button>
      </header>
      {message ? <p className={message.includes('Đã') || message.includes('created') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Branch</p><h3>{tr('Danh sách chi nhánh', 'Branch list')}</h3></div><Badge tone="info">{branches.length}</Badge></CardHeader>
          <CardContent>
            {loading ? <p className="page-state">{tr('Đang tải chi nhánh...', 'Loading branches...')}</p> : (
              <>
                <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Name</th><th>Address</th><th>Status</th></tr></thead><tbody>{pagedBranches.map((branch) => <tr key={branch.id}><td>{branch.code}</td><td>{branch.name}</td><td>{branch.address ?? '-'}</td><td><Badge tone={branch.active ? 'success' : 'danger'}>{branch.active ? tr('Đang hoạt động', 'Active') : tr('Ngừng hoạt động', 'Inactive')}</Badge></td></tr>)}</tbody></table></div>
                <PaginationBar page={branchPage} totalPages={Math.ceil(branches.length / pageSize)} totalElements={branches.length} size={pageSize} onPageChange={setBranchPage} />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create branch</p><h3>{tr('Thêm chi nhánh', 'Add branch')}</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitBranch}><label className="field"><span>Code</span><Input required value={branchForm.code} onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))} /></label><label className="field"><span>Name</span><Input required value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} /></label><label className="field"><span>Address</span><Input value={branchForm.address ?? ''} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} /></label><Button type="submit" full>{tr('Tạo chi nhánh', 'Create branch')}</Button></form></CardContent>
        </Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Supplier</p><h3>{tr('Danh sách nhà cung cấp', 'Supplier list')}</h3></div><Badge tone="info">{suppliers.length}</Badge></CardHeader>
          <CardContent>
            <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Name</th><th>Phone</th><th>Email</th></tr></thead><tbody>{pagedSuppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.code}</td><td>{supplier.name}</td><td>{supplier.phone ?? '-'}</td><td>{supplier.email ?? '-'}</td></tr>)}</tbody></table></div>
            <PaginationBar page={supplierPage} totalPages={Math.ceil(suppliers.length / pageSize)} totalElements={suppliers.length} size={pageSize} onPageChange={setSupplierPage} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create supplier</p><h3>{tr('Thêm nhà cung cấp', 'Add supplier')}</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitSupplier}><label className="field"><span>Code</span><Input required value={supplierForm.code} onChange={(event) => setSupplierForm((current) => ({ ...current, code: event.target.value }))} /></label><label className="field"><span>Name</span><Input required value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} /></label><div className="form-grid form-grid--two"><label className="field"><span>Phone</span><Input value={supplierForm.phone ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} /></label><label className="field"><span>Email</span><Input value={supplierForm.email ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} /></label></div><label className="field"><span>Address</span><Input value={supplierForm.address ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))} /></label><Button type="submit" full>{tr('Tạo nhà cung cấp', 'Create supplier')}</Button></form></CardContent>
        </Card>
      </div>
    </section>
  )
}

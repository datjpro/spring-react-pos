import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createBranch, createSupplier, getBranches, getSuppliers } from '../services/masterData'
import type { Branch, BranchRequest, Supplier, SupplierRequest } from '../types/masterData'
import { getApiErrorMessage } from '../utils/apiError'

const emptyBranch: BranchRequest = { code: '', name: '', address: '' }
const emptySupplier: SupplierRequest = { code: '', name: '', phone: '', email: '', address: '' }

export function MasterDataPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [branchForm, setBranchForm] = useState<BranchRequest>(emptyBranch)
  const [supplierForm, setSupplierForm] = useState<SupplierRequest>(emptySupplier)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { void loadData() }, [])

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
      setMessage('Đã tạo chi nhánh mới.')
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
      setMessage('Đã tạo nhà cung cấp mới.')
      await loadData()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header pos-hero"><div><p className="page-header__eyebrow">Catalog</p><h2 className="page-header__title">Branches & Suppliers</h2><p className="page-header__description">Quản lý master data cho chi nhánh và nhà cung cấp.</p></div><Button type="button" variant="secondary" onClick={() => void loadData()} disabled={loading}>Tải lại</Button></header>
      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}
      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Branch</p><h3>Danh sách chi nhánh</h3></div><Badge tone="info">{branches.length}</Badge></CardHeader>
          <CardContent>{loading ? <p className="page-state">Đang tải chi nhánh...</p> : <div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Name</th><th>Address</th><th>Status</th></tr></thead><tbody>{branches.map((branch) => <tr key={branch.id}><td>{branch.code}</td><td>{branch.name}</td><td>{branch.address ?? '-'}</td><td><Badge tone={branch.active ? 'success' : 'danger'}>{branch.active ? 'Active' : 'Inactive'}</Badge></td></tr>)}</tbody></table></div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create branch</p><h3>Thêm chi nhánh</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitBranch}><label className="field"><span>Code</span><Input required value={branchForm.code} onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))} /></label><label className="field"><span>Name</span><Input required value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} /></label><label className="field"><span>Address</span><Input value={branchForm.address ?? ''} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} /></label><Button type="submit" full>Tạo chi nhánh</Button></form></CardContent>
        </Card>
      </div>

      <div className="catalog-grid">
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Supplier</p><h3>Danh sách nhà cung cấp</h3></div><Badge tone="info">{suppliers.length}</Badge></CardHeader>
          <CardContent><div className="table-wrap"><table className="data-table data-table--dense"><thead><tr><th>Code</th><th>Name</th><th>Phone</th><th>Email</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.code}</td><td>{supplier.name}</td><td>{supplier.phone ?? '-'}</td><td>{supplier.email ?? '-'}</td></tr>)}</tbody></table></div></CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="panel__eyebrow">Create supplier</p><h3>Thêm nhà cung cấp</h3></div></CardHeader>
          <CardContent><form className="form-grid" onSubmit={submitSupplier}><label className="field"><span>Code</span><Input required value={supplierForm.code} onChange={(event) => setSupplierForm((current) => ({ ...current, code: event.target.value }))} /></label><label className="field"><span>Name</span><Input required value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} /></label><div className="form-grid form-grid--two"><label className="field"><span>Phone</span><Input value={supplierForm.phone ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} /></label><label className="field"><span>Email</span><Input value={supplierForm.email ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} /></label></div><label className="field"><span>Address</span><Input value={supplierForm.address ?? ''} onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))} /></label><Button type="submit" full>Tạo supplier</Button></form></CardContent>
        </Card>
      </div>
    </section>
  )
}

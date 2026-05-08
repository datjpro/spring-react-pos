import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import {
  createBranch,
  createSupplier,
  deleteBranch,
  deleteSupplier,
  getBranchById,
  getBranches,
  getSupplierById,
  getSuppliers,
  updateBranch,
  updateSupplier,
} from '../services/masterData'

export function MasterDataPage() {
  return (
    <ApiWorkbench
      eyebrow="Catalog"
      title="Branches & Suppliers"
      actions={[
        { name: 'List branches', description: 'GET /branches', run: () => getBranches() },
        { name: 'Get branch #1', description: 'GET /branches/{id}', run: () => getBranchById(1) },
        {
          name: 'Update branch #1',
          description: 'PUT /branches/{id}',
          run: () => updateBranch(1, { code: 'BR-001', name: 'Main Branch', address: 'HN' }),
        },
        { name: 'Delete branch #1', description: 'DELETE /branches/{id}', run: () => deleteBranch(1) },
        { name: 'List suppliers', description: 'GET /suppliers', run: () => getSuppliers() },
        { name: 'Get supplier #1', description: 'GET /suppliers/{id}', run: () => getSupplierById(1) },
        {
          name: 'Update supplier #1',
          description: 'PUT /suppliers/{id}',
          run: () => updateSupplier(1, { code: 'SUP-001', name: 'Default Supplier', phone: '0900000000', email: 'sup@example.com', address: 'HN' }),
        },
        { name: 'Delete supplier #1', description: 'DELETE /suppliers/{id}', run: () => deleteSupplier(1) },
      ]}
    >
      <div className="workbench-grid">
        <JsonForm
          title="Create branch"
          initialValue={{ code: 'BR-NEW', name: 'Branch New', address: 'Hanoi' }}
          onSubmit={(value) => createBranch(value)}
        />
        <JsonForm
          title="Create supplier"
          initialValue={{ code: 'SUP-NEW', name: 'Supplier New', phone: '0900000000', email: 'supplier.new@example.com', address: 'Hanoi' }}
          onSubmit={(value) => createSupplier(value)}
        />
      </div>
    </ApiWorkbench>
  )
}

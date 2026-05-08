import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { cancelSale, createSale, getSaleById, getSales } from '../services/transactions'

export function SalesPage() {
  return (
    <ApiWorkbench
      eyebrow="Transactions"
      title="Sales"
      actions={[
        { name: 'List sales', description: 'GET /sales', run: () => getSales() },
        { name: 'Get sale #1', description: 'GET /sales/{id}', run: () => getSaleById(1) },
        { name: 'Cancel sale #1', description: 'POST /sales/{id}/cancel', run: () => cancelSale(1, 'Cancelled from FE workbench') },
      ]}
    >
      <JsonForm
        title="Create sale"
        initialValue={{ branchId: 1, note: 'Sale from FE', items: [{ productId: 1, quantity: 1 }] }}
        onSubmit={(value) => createSale(value)}
      />
    </ApiWorkbench>
  )
}

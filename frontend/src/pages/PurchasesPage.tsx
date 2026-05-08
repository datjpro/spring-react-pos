import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { cancelPurchase, createPurchase, getPurchaseById, getPurchases } from '../services/transactions'

export function PurchasesPage() {
  return (
    <ApiWorkbench
      eyebrow="Transactions"
      title="Purchases"
      actions={[
        { name: 'List purchases', description: 'GET /purchases', run: () => getPurchases() },
        { name: 'Get purchase #1', description: 'GET /purchases/{id}', run: () => getPurchaseById(1) },
        { name: 'Cancel purchase #1', description: 'POST /purchases/{id}/cancel', run: () => cancelPurchase(1, 'Cancelled from FE workbench') },
      ]}
    >
      <JsonForm
        title="Create purchase"
        initialValue={{ supplierId: 1, branchId: 1, note: 'Purchase from FE', items: [{ productId: 1, quantity: 1, unitCost: 10000 }] }}
        onSubmit={(value) => createPurchase(value)}
      />
    </ApiWorkbench>
  )
}

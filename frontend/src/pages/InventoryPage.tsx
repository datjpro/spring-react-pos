import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { createInventoryAdjustment, createStockAdjustment, getInventoryAdjustments, getLowStockProducts, getStockMovements } from '../services/inventory'

export function InventoryPage() {
  return (
    <ApiWorkbench
      eyebrow="Inventory"
      title="Inventory & Stock Movements"
      actions={[
        { name: 'List inventory adjustments', description: 'GET /inventory/adjustments', run: () => getInventoryAdjustments({ page: 0, size: 20 }) },
        { name: 'List low stock', description: 'GET /inventory/low-stock', run: () => getLowStockProducts(10) },
        { name: 'List stock movements', description: 'GET /stock-movements', run: () => getStockMovements(1, 0, 20) },
      ]}
    >
      <div className="workbench-grid">
        <JsonForm
          title="Create inventory adjustment"
          initialValue={{ productId: 1, adjustmentType: 'INCREASE', quantity: 1, reason: 'Manual adjust', note: 'From FE' }}
          onSubmit={(value) => createInventoryAdjustment(value)}
        />
        <JsonForm
          title="Create stock adjustment"
          initialValue={{ productId: 1, branchId: 1, quantityDelta: 1, reason: 'Stock movement adjust', note: 'From FE' }}
          onSubmit={(value) => createStockAdjustment(value)}
        />
      </div>
    </ApiWorkbench>
  )
}

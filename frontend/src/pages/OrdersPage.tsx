import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import { cancelOrder, createOrder, createPayment, getOrderById, getOrders, getPaymentById, getPaymentsByOrder } from '../services/transactions'

export function OrdersPage() {
  return (
    <ApiWorkbench
      eyebrow="Transactions"
      title="Orders & Payments"
      actions={[
        { name: 'List orders', description: 'GET /orders', run: () => getOrders({ page: 0, size: 20 }) },
        { name: 'Get order #1', description: 'GET /orders/{id}', run: () => getOrderById(1) },
        { name: 'Cancel order #1', description: 'POST /orders/{id}/cancel', run: () => cancelOrder(1, 'Cancelled from FE workbench') },
        { name: 'Get payment #1', description: 'GET /payments/{id}', run: () => getPaymentById(1) },
        { name: 'List payments for order #1', description: 'GET /payments?orderId=', run: () => getPaymentsByOrder(1) },
      ]}
    >
      <div className="workbench-grid">
        <JsonForm
          title="Create order"
          initialValue={{ discountAmount: 0, items: [{ productId: 1, quantity: 1 }] }}
          onSubmit={(value) => createOrder(value)}
        />
        <JsonForm
          title="Create payment"
          initialValue={{ orderId: 1, paymentMethod: 'CASH', amountReceived: 50000, paymentReference: 'FE-PAY-001', note: 'Payment from FE' }}
          onSubmit={(value) => createPayment(value)}
        />
      </div>
    </ApiWorkbench>
  )
}

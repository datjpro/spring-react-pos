import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CreditCard, Download, ReceiptText, RefreshCw, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { createOrder, createPayment, getOrders } from '../services/transactions'
import type { CreateOrderRequest, CreatePaymentRequest, Order } from '../types/transactions'
import { getApiErrorMessage } from '../utils/apiError'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

const emptyOrder: CreateOrderRequest = {
  discountAmount: 0,
  items: [{ productId: 1, quantity: 1 }],
}

const emptyPayment: CreatePaymentRequest = {
  orderId: 1,
  paymentMethod: 'CASH',
  amountReceived: 0,
  paymentReference: '',
  note: '',
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState('')
  const [orderForm, setOrderForm] = useState<CreateOrderRequest>(emptyOrder)
  const [paymentForm, setPaymentForm] = useState<CreatePaymentRequest>(emptyPayment)
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const totalRevenue = useMemo(() => orders.reduce((total, order) => total + order.totalAmount, 0), [orders])
  const totalItems = useMemo(() => orders.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0), 0), [orders])

  useEffect(() => {
    void loadOrders()
  }, [status])

  async function loadOrders() {
    setLoading(true)
    setMessage(null)

    try {
      const data = await getOrders({ page: 0, size: 12, status: status || undefined })
      setOrders(data.content)
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingOrder(true)
    setMessage(null)

    try {
      const order = await createOrder(orderForm)
      setMessage(`Đã tạo đơn ${order.orderCode}`)
      setOrderForm(emptyOrder)
      setPaymentForm((current) => ({ ...current, orderId: order.id, amountReceived: order.totalAmount }))
      await loadOrders()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSavingOrder(false)
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingPayment(true)
    setMessage(null)

    try {
      await createPayment(paymentForm)
      setMessage(`Đã ghi nhận thanh toán cho đơn #${paymentForm.orderId}`)
      await loadOrders()
    } catch (error) {
      setMessage(getApiErrorMessage(error))
    } finally {
      setSavingPayment(false)
    }
  }

  return (
    <section className="page-stack orders-workspace">
      <header className="page-header pos-hero">
        <div>
          <p className="page-header__eyebrow">Transactions</p>
          <h2 className="page-header__title">Orders & Payments</h2>
          <p className="page-header__description">Theo dõi đơn hàng gần đây, tạo đơn mới và ghi nhận thanh toán ngay.</p>
        </div>
        <div className="pos-hero__metrics">
          <Button type="button" variant="secondary" onClick={() => void loadOrders()} disabled={loading}><RefreshCw size={16} /> Tải lại</Button>
          <Badge tone="info"><Download size={14} /> CSV ready</Badge>
        </div>
      </header>

      <div className="stats-grid catalog-stats">
        <Card><CardContent className="metric-card"><ReceiptText size={22} /><span>Số đơn</span><strong>{orders.length}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><ShieldCheck size={22} /><span>Tổng món</span><strong>{totalItems}</strong></CardContent></Card>
        <Card><CardContent className="metric-card"><CreditCard size={22} /><span>Tổng tiền</span><strong>{formatCurrency(totalRevenue)}</strong></CardContent></Card>
      </div>

      {message ? <p className={message.includes('Đã') ? 'page-state page-state--success' : 'page-state page-state--error'}>{message}</p> : null}

      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <div>
              <p className="panel__eyebrow">Đơn hàng</p>
              <h3>Danh sách đơn gần đây</h3>
            </div>
            <Badge tone="neutral">{orders.length} dòng</Badge>
          </CardHeader>
          <CardContent>
            <div className="orders-toolbar">
              <Input placeholder="Lọc status: PAID, PENDING..." value={status} onChange={(event) => setStatus(event.target.value)} />
            </div>

            {loading ? <p className="page-state">Đang tải đơn hàng...</p> : null}
            {!loading && orders.length === 0 ? <p className="page-state">Chưa có đơn hàng.</p> : null}

            {!loading && orders.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Thu ngân</th>
                      <th>Trạng thái</th>
                      <th>Số món</th>
                      <th>Tổng tiền</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.orderCode}</strong></td>
                        <td>{order.cashierUsername}</td>
                        <td><Badge tone="info">{order.status}</Badge></td>
                        <td>{order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                        <td>{formatCurrency(order.totalAmount)}</td>
                        <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="orders-form-stack">
          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">Tạo đơn</p>
                <h3>Order mới</h3>
              </div>
              <ReceiptText size={20} />
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={submitOrder}>
                <div className="form-grid form-grid--two">
                  <label className="field"><span>Product ID</span><Input required type="number" min={1} value={orderForm.items[0]?.productId ?? 1} onChange={(event) => setOrderForm((current) => ({ ...current, items: [{ ...current.items[0], productId: Number(event.target.value) }] }))} /></label>
                  <label className="field"><span>Số lượng</span><Input required type="number" min={1} value={orderForm.items[0]?.quantity ?? 1} onChange={(event) => setOrderForm((current) => ({ ...current, items: [{ ...current.items[0], quantity: Number(event.target.value) }] }))} /></label>
                </div>
                <label className="field"><span>Giảm giá</span><Input type="number" min={0} value={orderForm.discountAmount ?? 0} onChange={(event) => setOrderForm((current) => ({ ...current, discountAmount: Number(event.target.value) }))} /></label>
                <Button type="submit" full disabled={savingOrder}>{savingOrder ? 'Đang tạo...' : 'Tạo đơn hàng'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="panel__eyebrow">Thanh toán</p>
                <h3>Ghi nhận payment</h3>
              </div>
              <CreditCard size={20} />
            </CardHeader>
            <CardContent>
              <form className="form-grid" onSubmit={submitPayment}>
                <label className="field"><span>Order ID</span><Input required type="number" min={1} value={paymentForm.orderId} onChange={(event) => setPaymentForm((current) => ({ ...current, orderId: Number(event.target.value) }))} /></label>
                <label className="field"><span>Phương thức</span><Input required value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentMethod: event.target.value }))} /></label>
                <label className="field"><span>Số tiền nhận</span><Input required type="number" min={0} value={paymentForm.amountReceived} onChange={(event) => setPaymentForm((current) => ({ ...current, amountReceived: Number(event.target.value) }))} /></label>
                <label className="field"><span>Tham chiếu</span><Input value={paymentForm.paymentReference ?? ''} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentReference: event.target.value }))} /></label>
                <Button type="submit" full disabled={savingPayment}>{savingPayment ? 'Đang ghi nhận...' : 'Tạo payment'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

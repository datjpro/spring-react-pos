import { ApiWorkbench, JsonForm } from '../components/ApiWorkbench'
import {
  exportReportCsv,
  getInventorySummaryReport,
  getProfitReport,
  getPurchaseSummaryReport,
  getRevenueReport,
  getSalesSummaryReport,
  getStockCardReport,
  getTopProductsReport,
} from '../services/reports'
import { getLast7DaysRange } from '../utils/dateRange'

export function ReportsPage() {
  const range = getLast7DaysRange()

  return (
    <ApiWorkbench
      eyebrow="Reporting"
      title="Reports"
      actions={[
        { name: 'Revenue report', description: 'GET /reports/revenue', run: () => getRevenueReport({ from: range.from, to: range.to, groupBy: 'day' }) },
        { name: 'Profit report', description: 'GET /reports/profit', run: () => getProfitReport({ from: range.from, to: range.to, groupBy: 'day' }) },
        { name: 'Top products', description: 'GET /reports/top-products', run: () => getTopProductsReport({ from: range.from, to: range.to, limit: 10, sortBy: 'quantity' }) },
        { name: 'Inventory summary', description: 'GET /reports/inventory-summary', run: () => getInventorySummaryReport() },
        { name: 'Stock card', description: 'GET /reports/stock-card', run: () => getStockCardReport({ productId: 1, branchId: 1, from: range.from, to: range.to }) },
        { name: 'Purchase summary', description: 'GET /reports/purchase-summary', run: () => getPurchaseSummaryReport({ from: range.from, to: range.to }) },
        { name: 'Sales summary', description: 'GET /reports/sales-summary', run: () => getSalesSummaryReport({ from: range.from, to: range.to }) },
        {
          name: 'Export revenue CSV',
          description: 'GET /reports/export?format=csv',
          run: async () => {
            const csv = await exportReportCsv({ type: 'revenue', from: range.from, to: range.to, groupBy: 'day' })
            return { csvPreview: csv.slice(0, 200) }
          },
        },
      ]}
    >
      <JsonForm
        title="Export custom CSV"
        initialValue={{ type: 'sales-summary', from: range.from, to: range.to, branchId: 1 }}
        onSubmit={async (value) => {
          const csv = await exportReportCsv(value as Record<string, string | number>)
          return { csvPreview: csv.slice(0, 200) }
        }}
      />
    </ApiWorkbench>
  )
}

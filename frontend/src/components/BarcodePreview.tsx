import { useRef } from 'react'
import Barcode from 'react-barcode'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

interface BarcodePreviewProps {
  productName: string
  barcode: string
  price?: number
  format?: 'CODE128' | 'EAN13'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function BarcodePreview({ productName, barcode, price, format = 'CODE128' }: BarcodePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  function printLabel() {
    const printWindow = window.open('', '_blank', 'width=420,height=320')
    if (!printWindow) return

    const barcodeSvg = wrapperRef.current?.querySelector('svg')?.outerHTML ?? ''

    const labelHtml = `
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 8px; }
            .label { width: 35mm; min-height: 22mm; border: 1px solid #ccc; padding: 4mm; }
            .name { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
            .price { font-size: 11px; margin-top: 4px; }
            svg { width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${productName || 'Sản phẩm mới'}</div>
            ${barcodeSvg}
            <div class="price">${typeof price === 'number' ? formatCurrency(price) : ''}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>`

    printWindow.document.write(labelHtml)
    printWindow.document.close()
  }

  if (!barcode.trim()) {
    return <Badge tone="warning">Chưa có barcode</Badge>
  }

  return (
    <div ref={wrapperRef} className="barcode-preview">
      <Barcode value={barcode} format={format} width={1.5} height={44} fontSize={12} margin={0} background="transparent" />
      <div className="barcode-preview__meta">
        <span>{barcode}</span>
        <Button type="button" size="sm" variant="secondary" onClick={printLabel}>In barcode</Button>
      </div>
    </div>
  )
}

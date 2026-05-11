import type { Product } from '../types/product'

export type BarcodeMode = 'manual' | 'auto'
export type BarcodeFormat = 'CODE128' | 'EAN13'

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

export function calculateEan13Checksum(input12: string) {
  const digits = input12.split('').map(Number)
  const sum = digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0)
  return String((10 - (sum % 10)) % 10)
}

export function generateBarcodeValue(format: BarcodeFormat) {
  if (format === 'EAN13') {
    const base12 = `893${randomDigits(9)}`
    return `${base12}${calculateEan13Checksum(base12)}`
  }

  return `POS-${Date.now()}-${randomDigits(4)}`
}

export function findProductByBarcode(products: Product[], barcode: string) {
  const normalized = barcode.trim().toLowerCase()
  return products.find((product) => (product.barcode ?? '').trim().toLowerCase() === normalized)
}

export async function readBarcodeFromFile(file: File) {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
    throw new Error('Trình duyệt chưa hỗ trợ đọc barcode từ file.')
  }

  const BarcodeDetectorCtor = window.BarcodeDetector
  if (!BarcodeDetectorCtor) {
    throw new Error('Trình duyệt chưa hỗ trợ đọc barcode từ file.')
  }

  const detector = new BarcodeDetectorCtor({ formats: ['code_128', 'ean_13'] })
  const bitmap = await createImageBitmap(file)

  try {
    const results = await detector.detect(bitmap)
    const first = results[0]?.rawValue
    if (!first) {
      throw new Error('Không đọc được barcode từ ảnh tải lên.')
    }

    return first
  } finally {
    bitmap.close()
  }
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
      }
    }
  }
}

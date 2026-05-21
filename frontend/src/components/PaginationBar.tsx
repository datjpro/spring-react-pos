import { Button } from './ui/Button'
import { useI18n } from '../i18n'

export function PaginationBar({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
}) {
  const { language } = useI18n()
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en)
  const safeTotalPages = Math.max(totalPages, 1)
  const start = totalElements === 0 ? 0 : page * size + 1
  const end = Math.min((page + 1) * size, totalElements)

  return (
    <div className="barcode-scan-row">
      <span className="page-state">
        {start}-{end} / {totalElements}
      </span>
      <Button type="button" size="sm" variant="secondary" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        {tr('Trước', 'Prev')}
      </Button>
      <span className="page-state">
        {page + 1}/{safeTotalPages}
      </span>
      <Button type="button" size="sm" variant="secondary" disabled={page + 1 >= safeTotalPages} onClick={() => onPageChange(page + 1)}>
        {tr('Sau', 'Next')}
      </Button>
    </div>
  )
}

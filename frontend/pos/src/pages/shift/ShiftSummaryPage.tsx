/**
 * Shift summary page - displays financial and inventory summary for a closed shift.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { Card, Button, formatPrice } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { getShiftSummaryForDisplay } from '@/services/shiftSummary'
import { formatDateTime } from '@/utils/dateFormat'
import { toast } from 'react-toastify'

export function ShiftSummaryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/app/shift-summary' })
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      if (!search.shift_number) {
        toast.error(t('shift.shiftNumberRequired') || 'Shift number is required')
        navigate({ to: '/app', replace: true })
        return
      }

      try {
        setLoading(true)
        console.log('Loading shift summary for shift number:', search.shift_number)
        const data = await getShiftSummaryForDisplay(search.shift_number)
        if (!data) {
          toast.error(t('shift.summaryNotFound') || 'Shift summary not found')
          navigate({ to: '/app', replace: true })
          return
        }
        setSummary(data)
      } catch (error: any) {
        console.error('Failed to load shift summary:', error)
        toast.error(error.message || t('common.error') || 'Failed to load shift summary')
        navigate({ to: '/app', replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [search.shift_number, navigate, t])

  const handleClose = () => {
    navigate({ to: '/app', replace: true })
  }

  if (loading) {
    return (
      <POSLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg">{t('common.loading') || 'Loading...'}</div>
          </div>
        </div>
      </POSLayout>
    )
  }

  if (!summary) {
    return null
  }

  // Format dates using centralized utility
  const openedDate = formatDateTime(summary.opened_at)
  const closedDate = summary.closed_at ? formatDateTime(summary.closed_at) : ''

  return (
    <POSLayout>
      <div className="p-2 flex flex-col overflow-hidden h-full w-full">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {t('shift.shiftSummary') || 'Resumen del Turno'} - #{summary.shift_number}
            </h1>
            <Button variant="secondary" onClick={handleClose}>
              {t('common.close') || 'CERRAR'}
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-4 gap-4 flex-1 min-h-0 h-full">
            {/* Left Column: Financial Summary */}
            <Card padding="md" className="flex flex-col h-full overflow-hidden">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('shift.financialSummary') || 'Resumen Financiero'}
              </h2>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.shiftStartDate') || 'Fecha de Inicio:'}
                  </label>
                  <div className="text-base" style={{ color: 'var(--color-text-primary)' }}>
                    {openedDate}
                  </div>
                </div>
                {summary.closed_at && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('shift.shiftEndDate') || 'Fecha de Cierre:'}
                    </label>
                    <div className="text-base" style={{ color: 'var(--color-text-primary)' }}>
                      {closedDate}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.initialCash') || 'Efectivo Inicial:'}
                  </label>
                  <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatPrice(summary.initial_cash, 'en-US', 'USD', 2)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.endCash') || 'Efectivo Final:'}
                  </label>
                  <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatPrice(summary.final_cash || 0, 'en-US', 'USD', 2)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.expectedCash') || 'Efectivo Esperado:'}
                  </label>
                  <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatPrice(summary.expected_cash, 'en-US', 'USD', 2)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.difference') || 'Diferencia:'}
                  </label>
                  <div
                    className={`text-base font-semibold ${
                      (summary.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPrice(summary.difference || 0, 'en-US', 'USD', 2)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('shift.bankTransferBalance') || 'Balance de Transferencias Bancarias:'}
                  </label>
                  <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatPrice(summary.bank_transfer_balance, 'en-US', 'USD', 2)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Column: Inventory Summary */}
            <Card padding="md" className="flex flex-col h-full overflow-hidden col-span-3">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {t('shift.inventorySummary') || 'Resumen de Inventario'}
              </h2>
              <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
                <table className="w-full text-sm border-collapse" style={{ borderColor: 'var(--color-border-default)' }}>
                  <thead
                    className="sticky top-0 z-20"
                    style={{
                      backgroundColor: 'var(--color-border-light)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <tr style={{ borderBottom: '2px solid var(--color-border-default)' }}>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.ingredientProduct') || 'Ingrediente / Producto'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.unitOfMeasure') || 'U.M.'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.invInicial') || 'Inv. Inicial'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill1') || 'Refill 1'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill2') || 'Refill 2'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill3') || 'Refill 3'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill4') || 'Refill 4'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill5') || 'Refill 5'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.refill6') || 'Refill 6'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.invFinal') || 'Inv. Final'}
                      </th>
                      <th className="text-left p-3 font-semibold" style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-border-light)' }}>
                        {t('shift.diff') || 'Diff.'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.inventory_summary.map((item: any, index: number) => {
                      // Group items by item_id and item_type to calculate rowSpan
                      const sameItemRows = summary.inventory_summary.filter(
                        (i: any) => i.item_id === item.item_id && i.item_type === item.item_type
                      )
                      const isFirstRow = index === 0 || 
                        (summary.inventory_summary[index - 1].item_id !== item.item_id || 
                         summary.inventory_summary[index - 1].item_type !== item.item_type)
                      
                      return (
                        <tr
                          key={`${item.item_id}-${item.item_type}-${item.uofm_id}-${index}`}
                          style={{ borderBottom: '1px solid var(--color-border-default)' }}
                          className="hover:bg-gray-50"
                        >
                          {isFirstRow && (
                            <td
                              className="py-0.5 px-3"
                              style={{ color: 'var(--color-text-primary)' }}
                              rowSpan={sameItemRows.length}
                            >
                              {item.item_name}
                            </td>
                          )}
                          <td className="py-0.5 px-3" style={{ color: 'var(--color-text-primary)' }}>
                            {item.uofm_abbreviation}
                          </td>
                          <td className="py-0.5 px-3 text-right" style={{ color: 'var(--color-text-primary)' }}>
                            {item.beg_balance.toFixed(2)}
                          </td>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <td key={i} className="py-0.5 px-3 text-right" style={{ color: 'var(--color-text-primary)' }}>
                              {item.refills[i]?.toFixed(2) || ''}
                            </td>
                          ))}
                          <td className="py-0.5 px-3 text-right" style={{ color: 'var(--color-text-primary)' }}>
                            {item.end_balance?.toFixed(2) || ''}
                          </td>
                          <td
                            className={`py-0.5 px-3 text-right font-semibold ${
                              (item.diff || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {item.diff?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </POSLayout>
  )
}


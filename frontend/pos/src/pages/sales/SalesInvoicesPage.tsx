/**
 * Sales Invoices Page - displays paid invoices/orders.
 */
import { useNavigate } from '@tanstack/react-router'
import { POSLayout } from '@/components/layout/POSLayout'
import { SalesInvoicesView } from '@/components/sales/SalesInvoicesView'

export function SalesInvoicesPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate({ to: '/app', replace: false })
  }

  return (
    <POSLayout>
      <SalesInvoicesView onBack={handleBack} />
    </POSLayout>
  )
}


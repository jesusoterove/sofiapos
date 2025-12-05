/**
 * Dashboard page component.
 */
import { useTranslation } from '@/i18n/hooks'

export function Dashboard() {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="mt-2 text-gray-600">{t('dashboard.welcome')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('dashboard.totalSales')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{t('common.currencySymbol')}0.00</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('dashboard.totalOrders')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('dashboard.totalProducts')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{t('dashboard.totalCustomers')}</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  )
}



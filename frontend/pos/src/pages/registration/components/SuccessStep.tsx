/**
 * Success step component for registration wizard.
 */
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'
import { Button } from '@sofiapos/ui'
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa'

interface SuccessStepProps {
  registrationCode: string
  cashierName: string
  onStart: () => void
}

export function SuccessStep({ registrationCode, cashierName, onStart }: SuccessStepProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 pt-12 pb-8 text-white text-center">
            <FaCheckCircle className="text-6xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              {t('registration.successTitle') || 'Registration Successful!'}
            </h1>
            <p className="text-green-100">
              {t('registration.successDescription') || 'Your cashier terminal has been registered successfully'}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {t('registration.cashierName') || 'Cashier Name'}: <strong>{cashierName}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {t('registration.registrationCode') || 'Registration Code'}: <code className="bg-gray-100 px-2 py-1 rounded">{registrationCode}</code>
              </p>
            </div>

            <Button
              variant="primary"
              onClick={onStart}
              className="w-full"
            >
              {t('registration.start') || 'Start'} <FaArrowRight className="ml-2 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


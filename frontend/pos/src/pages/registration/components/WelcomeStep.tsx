/**
 * Welcome step component for registration wizard.
 */
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Button } from '@sofiapos/ui'
import { FaGlobe, FaArrowRight } from 'react-icons/fa'

interface WelcomeStepProps {
  onNext: () => void
  initialLanguage?: string
  onLanguageChange?: (language: string) => void
}

export function WelcomeStep({ onNext, initialLanguage = 'es', onLanguageChange }: WelcomeStepProps) {
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage)

  useEffect(() => {
    // Update language when selection changes (only if different from current)
    if (currentLanguage !== selectedLanguage) {
      changeLanguage(selectedLanguage)
      onLanguageChange?.(selectedLanguage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-theme-primary px-8 pt-12 pb-8 text-white text-center" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
            <h1 className="text-4xl font-bold mb-4">
              {t('registration.welcomeTitle') || 'Welcome to SofiaPOS'}
            </h1>
            <p className="text-white text-lg opacity-90">
              {t('registration.welcomeDescription') || 'We are registering a new Cashier terminal'}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <FaGlobe className="inline mr-2" />
                {t('settings.language') || 'Language'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('es')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedLanguage === 'es'
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Español
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedLanguage === 'en'
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={onNext}
              className="w-full"
            >
              {t('common.next') || 'Next'} <FaArrowRight className="ml-2 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


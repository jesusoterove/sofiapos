/**
 * Settings page with tabbed sections.
 */
import { useTranslation } from '@/i18n/hooks'
import { Tabs, Tab } from '@sofiapos/ui'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function Settings() {
  const { t } = useTranslation()

  const tabs: Tab[] = [
    {
      id: 'general',
      label: t('settings.general') || 'General',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.theme') || 'Theme'}
            </label>
            <div>
              <ThemeSwitcher />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
              {t('settings.language') || 'Language'}
            </label>
            <div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.title') || 'Settings'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {t('settings.description') || 'Manage application settings'}
        </p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
          <Tabs tabs={tabs} defaultTab="general" />
        </div>
      </div>
    </div>
  )
}



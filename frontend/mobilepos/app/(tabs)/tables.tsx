import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function TablesScreen() {
  const { t } = useTranslation();

  return (
    <ScreenPlaceholder
      title={t('placeholders.tablesTitle', 'Tables & service modes')}
      description={t(
        'placeholders.tablesBody',
        'Floor plans, sections, and service type toggles will live here for tablets and phones.',
      )}
      hint={t('placeholder.cta', 'Coming soon')}
    />
  );
}

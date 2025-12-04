# Sofia-UI Internationalization Integration Guide

## Overview

Sofia-UI components use `react-i18next` for internationalization. The library provides its own translation files for UI-specific strings (like pagination, data grid controls, etc.), which should be merged into the consuming application's i18n instance.

## Architecture

1. **Sofia-UI Translations**: Located in `src/i18n/locales/` with translations for:
   - `common` (yes/no)
   - `pagination` (pagination controls)
   - `dataGrid` (data grid filters, loading states, etc.)

2. **Translation Merging**: Applications should import and merge sofia-ui translations into their own i18n setup.

3. **LanguageContext**: Sofia-UI components use `LanguageContext` to sync with the application's language settings.

## Integration Steps

### 1. Import Sofia-UI Translations

In your application's i18n setup file (e.g., `src/i18n/index.ts`):

```typescript
import sofiaUiTranslations from '@sofiapos/ui/i18n/translations'
```

### 2. Merge Translations

Merge sofia-ui translations with your application translations:

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enAppTranslations from './locales/en/translation.json'
import esAppTranslations from './locales/es/translation.json'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        ...sofiaUiTranslations.en,  // Sofia-UI translations first
        ...enAppTranslations,        // App translations override if conflicts
      },
    },
    es: {
      translation: {
        ...sofiaUiTranslations.es,  // Sofia-UI translations first
        ...esAppTranslations,        // App translations override if conflicts
      },
    },
  },
  // ... other i18n config
})
```

### 3. Provide LanguageContext

Wrap your application with `LanguageProvider` from sofia-ui:

```typescript
import { LanguageProvider } from '@sofiapos/ui'
import { useTranslation } from './i18n/hooks'

function AppContent() {
  const { currentLanguage, changeLanguage } = useTranslation()
  
  return (
    <LanguageProvider language={currentLanguage} changeLanguage={changeLanguage}>
      {/* Your app content */}
    </LanguageProvider>
  )
}
```

## Translation Keys

Sofia-UI uses the following translation keys:

- `common.yes` / `common.no`
- `pagination.*` (firstPage, previousPage, nextPage, lastPage, pageInfo, rowsPerPage, showingRows)
- `dataGrid.*` (showFilters, hideFilters, clearFilters, loading, noData, filterPlaceholder)

## Benefits

1. **Centralized UI Translations**: All UI component translations are in one place
2. **Reusable**: Same translations work across multiple applications
3. **Override Capability**: Applications can override sofia-ui translations if needed
4. **Type Safety**: Translations are typed and validated

## Notes

- Sofia-UI translations are merged first, so application translations can override them
- The `LanguageContext` ensures sofia-ui components stay in sync with the application's language
- Sofia-UI maintains a fallback i18n instance for standalone use, but applications should merge translations for best results


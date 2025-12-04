# Internationalization (i18n) Guide

## Overview

The Console application uses `react-i18next` for internationalization. English is the base language, and Spanish is set as the default for development.

## Adding Translations

### 1. Add Translation Keys

Edit the translation files:
- `locales/en/translation.json` - English (base language)
- `locales/es/translation.json` - Spanish

### 2. Translation File Structure

Translations are organized by feature/module:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "products": {
    "title": "Products",
    "createProduct": "Create Product"
  }
}
```

### 3. Using Translations in Components

```tsx
import { useTranslation } from '@/i18n/hooks'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('products.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### 4. Changing Language

```tsx
import { useTranslation } from '@/i18n/hooks'

function LanguageSwitcher() {
  const { changeLanguage, currentLanguage } = useTranslation()
  
  return (
    <select 
      value={currentLanguage} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  )
}
```

## Adding a New Language

1. Create a new directory: `locales/{language_code}/`
2. Copy `translation.json` from English
3. Translate all values
4. Update `i18n/index.ts` to include the new language:

```typescript
import newLangTranslations from './locales/{language_code}/translation.json'

resources: {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  {language_code}: { translation: newLangTranslations },
}
```

5. Add language to `useLanguages()` hook if needed

## Translation Keys Naming Convention

- Use dot notation: `module.submodule.key`
- Use camelCase for keys
- Group related keys under the same namespace
- Examples:
  - `products.title`
  - `orders.status.paid`
  - `common.buttons.save`

## Best Practices

1. **Always translate**: Don't hardcode text, use translation keys
2. **Use namespaces**: Group translations by feature
3. **Keep keys consistent**: Use the same key structure across languages
4. **Test translations**: Ensure all keys are translated
5. **Handle missing keys**: i18next will show the key if translation is missing

## Interpolation

Use interpolation for dynamic values:

```json
{
  "welcome": "Welcome, {{name}}!"
}
```

```tsx
{t('welcome', { name: 'John' })}
// Output: "Welcome, John!"
```

## Pluralization

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```tsx
{t('items', { count: 1 })}
// Output: "1 item"

{t('items', { count: 5 })}
// Output: "5 items"
```


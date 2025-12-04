# Internationalization (i18n) Guide

## Overview

SofiaPOS uses `react-i18next` for internationalization in both Console and POS applications. English is the base language, and Spanish is set as the default for development.

## Configuration

### Default Language

- **Development**: Spanish (es) is the default
- **Production**: Detects from browser or falls back to English
- **Base Language**: English (en) - all translations should exist in English

### Language Detection

The system detects language in this order:
1. `localStorage` (user preference)
2. Browser language
3. HTML lang attribute
4. Fallback to English

## Adding Translations

### 1. Console Application

Edit translation files in `frontend/console/src/i18n/locales/`:
- `en/translation.json` - English (base)
- `es/translation.json` - Spanish

### 2. POS Application

Edit translation files in `frontend/pos/src/i18n/locales/`:
- `en/translation.json` - English (base)
- `es/translation.json` - Spanish

### 3. Translation File Structure

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

## Using Translations

### In React Components

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

### Changing Language

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

### Step 1: Create Translation File

Create a new directory and file:
```
frontend/console/src/i18n/locales/{language_code}/translation.json
frontend/pos/src/i18n/locales/{language_code}/translation.json
```

### Step 2: Copy Base Translations

Copy `en/translation.json` as a starting point.

### Step 3: Translate

Translate all values while keeping the same structure.

### Step 4: Register Language

Update `i18n/index.ts` in both apps:

```typescript
import newLangTranslations from './locales/{language_code}/translation.json'

resources: {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  {language_code}: { translation: newLangTranslations },
}
```

### Step 5: Add to Language List

Update `i18n/hooks.ts`:

```typescript
export function useLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: '{language_code}', name: '{Language Name}', nativeName: '{Native Name}' },
  ]
}
```

## Translation Key Naming Convention

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

## Translation Coverage

### Console Translations

- Common UI elements
- Authentication
- Dashboard
- Stores, Products, Orders, Customers
- Inventory, Shifts, Cash Registers
- Reports and Settings

### POS Translations

- Common UI elements
- Product selection
- Order management
- Payment processing
- Tables, Shifts, Cash Registers
- Inventory entry
- Sync status

## Testing Translations

1. Switch language in the app
2. Verify all text is translated
3. Check for missing keys (they will show as key names)
4. Test interpolation and pluralization
5. Verify formatting (dates, numbers, currency)

## Maintenance

- Keep English translations as the source of truth
- Update Spanish translations when English changes
- Add new languages by copying English and translating
- Use translation management tools for larger projects (optional)


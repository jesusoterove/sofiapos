# Theming System

The Console application uses a flexible theming system backed by the shared design tokens exposed by `@sofiapos/shared`.

## Architecture

### Theme Context
- **Location**: `src/contexts/ThemeContext.tsx`
- **Purpose**: Manages current theme, theme switching, and applies CSS variables
- **Features**:
  - Theme persistence (localStorage)
  - Dynamic CSS variable injection sourced from shared tokens
  - Easy theme switching

### Theme Definition
Themes are built from the shared `ThemeTokens` objects and shaped as:
- `name`: Internal theme identifier
- `displayName`: User-facing theme name
- `colors`: Color palette object (primary/background/text/border)

## Current Themes

### Sofia Core Theme (Shared)
The default theme is created directly from `themeTokens.sofia` inside `@sofiapos/shared`:
- Primary colors: Sofia blue palette (50-900)
- Background: Light surfaces with a blue gradient accent
- Text: Slate shades for readability
- Borders: Soft gray for subtle separation

Using the shared source keeps Tailwind, CSS variables, and runtime theme context aligned with the same values consumed by other Sofia clients.

## Adding a New Theme

1. **Define the theme** (either by creating new tokens in `@sofiapos/shared` or composing an inline object) in `src/contexts/ThemeContext.tsx`:

```typescript
import { themeTokens, type ThemeTokens } from '@sofiapos/shared/theme'

const buildThemeFromTokens = (tokens: ThemeTokens): Theme => ({
  name: tokens.name,
  displayName: tokens.displayName,
  colors: tokens.colors,
})

const oceanTheme = buildThemeFromTokens(themeTokens.ocean)
```

2. **Register the theme** in the `themes` map:

```typescript
export const themes: Record<string, Theme> = {
  [sofiaTheme.name]: sofiaTheme,
  [oceanTheme.name]: oceanTheme,
}
```

3. **Use theme colors** in components:

```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { currentTheme } = useTheme()
  const theme = currentTheme.colors
  
  return (
    <div style={{ backgroundColor: theme.primary[500] }}>
      Themed content
    </div>
  )
}
```

## Using Theme Colors

### Method 1: CSS Variables (Recommended)
Theme colors are automatically available as CSS variables:

```css
.my-element {
  color: var(--color-primary-500);
  background: var(--color-bg-paper);
  border-color: var(--color-border-default);
}
```

### Method 2: Inline Styles
Use the theme context directly:

```tsx
const { currentTheme } = useTheme()
const theme = currentTheme.colors

<div style={{ color: theme.text.primary }}>
  Content
</div>
```

### Method 3: Utility Classes
Use predefined utility classes:

```tsx
<div className="bg-theme-gradient text-theme-primary">
  Themed content
</div>
```

## Theme Structure

```typescript
interface ThemeColors {
  primary: {
    50-900: string  // 10 shades from light to dark
  }
  background: {
    default: string      // Main background
    paper: string        // Card/paper background
    gradient: {
      from: string       // Gradient start
      via: string        // Gradient middle
      to: string         // Gradient end
    }
  }
  text: {
    primary: string      // Main text color
    secondary: string    // Secondary text
    muted: string        // Muted text
  }
  border: {
    default: string      // Default border
    light: string        // Light border
  }
}
```

## Theme Switcher

The `ThemeSwitcher` component is available in the header and allows users to switch themes. Themes are persisted in localStorage.

## Best Practices

1. **Use CSS variables** when possible for better performance
2. **Test all themes** when adding new components
3. **Maintain contrast ratios** for accessibility
4. **Keep color palettes consistent** across themes (ideally upstreamed into `@sofiapos/shared`)
5. **Document theme-specific overrides** in component comments

## Future Enhancements

- Dark mode support
- Custom theme creation
- Theme preview
- Export/import themes
- Per-user theme preferences

# Theming System

The Console application uses a flexible theming system that allows for easy customization and theme switching.

## Architecture

### Theme Context
- **Location**: `src/contexts/ThemeContext.tsx`
- **Purpose**: Manages current theme, theme switching, and applies CSS variables
- **Features**:
  - Theme persistence (localStorage)
  - Dynamic CSS variable injection
  - Easy theme switching

### Theme Definition
Themes are defined as TypeScript objects with:
- `name`: Internal theme identifier
- `displayName`: User-facing theme name
- `colors`: Color palette object

## Current Themes

### Sunshine Theme
The default theme with a vibrant yellow color palette:
- Primary colors: Yellow shades (50-900)
- Background: White with yellow gradient
- Text: Gray shades for readability
- Borders: Light gray

## Adding a New Theme

1. **Define the theme** in `src/contexts/ThemeContext.tsx`:

```typescript
export const oceanTheme: Theme = {
  name: 'ocean',
  displayName: 'Ocean',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      // ... etc
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      gradient: {
        from: '#3b82f6',
        via: '#60a5fa',
        to: '#2563eb',
      },
    },
    // ... rest of colors
  },
}
```

2. **Register the theme** in the `themes` object:

```typescript
export const themes: Record<string, Theme> = {
  sunshine: sunshineTheme,
  ocean: oceanTheme, // Add here
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
4. **Keep color palettes consistent** across themes
5. **Document theme-specific overrides** in component comments

## Future Enhancements

- Dark mode support
- Custom theme creation
- Theme preview
- Export/import themes
- Per-user theme preferences


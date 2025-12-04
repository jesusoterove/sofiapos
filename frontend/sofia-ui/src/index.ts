/**
 * SofiaPOS UI Component Library
 * Main entry point for all components
 */

// Components
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
export { ThemeSwitcher } from './components/ThemeSwitcher'
export { DataGrid } from './components/DataGrid'
export type { DataGridProps, DataGridColumn } from './components/DataGrid'

// Theme
export { ThemeProvider, useTheme, sunshineTheme, themes } from './theme/ThemeContext'
export type { Theme, ThemeColors } from './theme/ThemeContext'

// Styles
import './styles/theme.css'


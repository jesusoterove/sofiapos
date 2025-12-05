/**
 * SofiaPOS UI Component Library
 * Main entry point for all components
 */

// Initialize i18n
import './i18n'

// Components
export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
export { ThemeSwitcher } from './components/ThemeSwitcher'
export { DataGrid } from './components/DataGrid'
export type { DataGridProps, DataGridColumn, CellRendererType, CellRendererOptions } from './components/DataGrid'
export { DataGridPagination } from './components/DataGridPagination'
export type { DataGridPaginationProps } from './components/DataGridPagination'
export { MessageBox } from './components/MessageBox'
export type { MessageBoxProps, MessageBoxType, MessageBoxButton } from './components/MessageBox'
export { MessageBoxProvider } from './components/MessageBoxProvider'
export { messageBox } from './components/MessageBoxManager'
export type { MessageBoxOptions, MessageBoxResult, MessageBoxButtonType } from './components/MessageBoxManager'

// Cell Renderers
export {
  TextCellRenderer,
  NumberCellRenderer,
  YesNoCellRenderer,
  DateCellRenderer,
  DateTimeCellRenderer,
  TimeCellRenderer,
  CheckboxCellRenderer,
} from './components/cells'
export type {
  TextCellRendererProps,
  NumberCellRendererProps,
  YesNoCellRendererProps,
  DateCellRendererProps,
  DateTimeCellRendererProps,
  TimeCellRendererProps,
  CheckboxCellRendererProps,
} from './components/cells'

// Theme
export { ThemeProvider, useTheme, sunshineTheme, themes } from './theme/ThemeContext'
export type { Theme, ThemeColors } from './theme/ThemeContext'

// Language
export { LanguageProvider } from './contexts/LanguageContext'
export type { LanguageContextType, LanguageProviderProps } from './contexts/LanguageContext'

// Settings
export { SettingsProvider } from './contexts/SettingsContext'
export type { SettingsContextType, SettingsProviderProps } from './contexts/SettingsContext'

// Translations (for merging into application i18n)
export { sofiaUiTranslations } from './i18n/translations'
export { default as sofiaUiTranslationsDefault } from './i18n/translations'

// Styles
import './styles/theme.css'


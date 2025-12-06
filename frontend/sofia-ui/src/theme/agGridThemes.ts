/**
 * AG Grid theme configurations
 * Extends ag-grid themes to match Sofia UI themes
 */
import { themeQuartz } from 'ag-grid-community'

export const agGridSunshineTheme = themeQuartz.withParams({
  // Theme parameters to be defined later
  // This allows customization of ag-grid colors to match the sunshine theme
  spacing: 7,
  columnBorder: true,
  headerBackgroundColor: "var(--color-primary-500)", //yellow-400
  oddRowBackgroundColor: "var(--color-bg-paper)",
})


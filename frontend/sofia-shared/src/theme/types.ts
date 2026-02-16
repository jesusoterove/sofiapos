export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export interface ThemeGradient {
  from: string
  via: string
  to: string
}

export interface ThemeColors {
  primary: ColorScale
  background: {
    default: string
    paper: string
    gradient: ThemeGradient
  }
  text: {
    primary: string
    secondary: string
    muted: string
  }
  border: {
    default: string
    light: string
  }
}

export interface ThemeTypography {
  fontFamily: string
  scale: {
    xs: number
    sm: number
    base: number
    lg: number
    xl: number
    '2xl': number
    '3xl': number
  }
}

export interface ThemeSpacing {
  unit: number
  scale: Record<string, number>
}

export interface ElevationScale {
  level0: string
  level1: string
  level2: string
  level3: string
  level4: string
}

export interface ThemeTokens {
  name: string
  displayName: string
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  elevation: ElevationScale
  radii: {
    sm: number
    md: number
    lg: number
    pill: number
  }
}

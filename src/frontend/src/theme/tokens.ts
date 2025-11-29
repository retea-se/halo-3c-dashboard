/**
 * Design Tokens - Exporterar tokens från JSON till TypeScript
 */
import tokensJson from '../assets/themes/tokens.json';

export interface DesignTokens {
  colors: {
    light: ColorTheme;
    dark: ColorTheme;
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  transitions: Transitions;
  breakpoints: Breakpoints;
  zIndex: ZIndex;
}

export interface ColorTheme {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceElevated: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
  sensor: {
    good: string;
    moderate: string;
    bad: string;
    critical: string;
  };
}

export interface Typography {
  fontFamily: {
    sans: string;
    mono: string;
  };
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  weights: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeights: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface BorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Transitions {
  fast: string;
  normal: string;
  slow: string;
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ZIndex {
  base: string;
  dropdown: string;
  sticky: string;
  fixed: string;
  modalBackdrop: string;
  modal: string;
  popover: string;
  tooltip: string;
}

export const tokens: DesignTokens = tokensJson as DesignTokens;
export default tokens;


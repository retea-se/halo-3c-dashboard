/**
 * Theme Provider - Hanterar light/dark mode med CSS-variabler
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import tokens from './tokens';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Läs från localStorage eller använd default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as ThemeMode | null;
      if (stored && (stored === 'light' || stored === 'dark')) {
        return stored;
      }
    }
    return defaultMode;
  });

  useEffect(() => {
    // Spara till localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', mode);

      // Applicera CSS-variabler till root
      const root = document.documentElement;
      const theme = tokens.colors[mode];

      // Set color variables
      root.style.setProperty('--color-primary', theme.primary);
      root.style.setProperty('--color-primary-hover', theme.primaryHover);
      root.style.setProperty('--color-primary-active', theme.primaryActive);
      root.style.setProperty('--color-secondary', theme.secondary);
      root.style.setProperty('--color-background', theme.background);
      root.style.setProperty('--color-surface', theme.surface);
      root.style.setProperty('--color-surface-hover', theme.surfaceHover);
      root.style.setProperty('--color-surface-elevated', theme.surfaceElevated);
      root.style.setProperty('--color-border', theme.border);
      root.style.setProperty('--color-text-primary', theme.text.primary);
      root.style.setProperty('--color-text-secondary', theme.text.secondary);
      root.style.setProperty('--color-text-muted', theme.text.muted);
      root.style.setProperty('--color-text-inverse', theme.text.inverse);
      root.style.setProperty('--color-success', theme.success);
      root.style.setProperty('--color-warning', theme.warning);
      root.style.setProperty('--color-error', theme.error);
      root.style.setProperty('--color-info', theme.info);
      root.style.setProperty('--color-sensor-good', theme.sensor.good);
      root.style.setProperty('--color-sensor-moderate', theme.sensor.moderate);
      root.style.setProperty('--color-sensor-bad', theme.sensor.bad);
      root.style.setProperty('--color-sensor-critical', theme.sensor.critical);

      // Set typography variables
      root.style.setProperty('--font-family-sans', tokens.typography.fontFamily.sans);
      root.style.setProperty('--font-family-mono', tokens.typography.fontFamily.mono);
      root.style.setProperty('--font-size-xs', tokens.typography.sizes.xs);
      root.style.setProperty('--font-size-sm', tokens.typography.sizes.sm);
      root.style.setProperty('--font-size-base', tokens.typography.sizes.base);
      root.style.setProperty('--font-size-lg', tokens.typography.sizes.lg);
      root.style.setProperty('--font-size-xl', tokens.typography.sizes.xl);
      root.style.setProperty('--font-size-2xl', tokens.typography.sizes['2xl']);
      root.style.setProperty('--font-size-3xl', tokens.typography.sizes['3xl']);
      root.style.setProperty('--font-size-4xl', tokens.typography.sizes['4xl']);
      root.style.setProperty('--font-weight-normal', tokens.typography.weights.normal);
      root.style.setProperty('--font-weight-medium', tokens.typography.weights.medium);
      root.style.setProperty('--font-weight-semibold', tokens.typography.weights.semibold);
      root.style.setProperty('--font-weight-bold', tokens.typography.weights.bold);

      // Set spacing variables
      root.style.setProperty('--spacing-xs', tokens.spacing.xs);
      root.style.setProperty('--spacing-sm', tokens.spacing.sm);
      root.style.setProperty('--spacing-md', tokens.spacing.md);
      root.style.setProperty('--spacing-lg', tokens.spacing.lg);
      root.style.setProperty('--spacing-xl', tokens.spacing.xl);
      root.style.setProperty('--spacing-2xl', tokens.spacing['2xl']);
      root.style.setProperty('--spacing-3xl', tokens.spacing['3xl']);

      // Set border radius variables
      root.style.setProperty('--radius-sm', tokens.borderRadius.sm);
      root.style.setProperty('--radius-md', tokens.borderRadius.md);
      root.style.setProperty('--radius-lg', tokens.borderRadius.lg);
      root.style.setProperty('--radius-xl', tokens.borderRadius.xl);
      root.style.setProperty('--radius-full', tokens.borderRadius.full);

      // Set shadow variables
      root.style.setProperty('--shadow-sm', tokens.shadows.sm);
      root.style.setProperty('--shadow-md', tokens.shadows.md);
      root.style.setProperty('--shadow-lg', tokens.shadows.lg);
      root.style.setProperty('--shadow-xl', tokens.shadows.xl);

      // Set transition variables
      root.style.setProperty('--transition-fast', tokens.transitions.fast);
      root.style.setProperty('--transition-normal', tokens.transitions.normal);
      root.style.setProperty('--transition-slow', tokens.transitions.slow);

      // Set base styles
      root.style.backgroundColor = theme.background;
      root.style.color = theme.text.primary;
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType & { colors: typeof tokens.colors.light } => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  // Returnera context med colors objekt
  return {
    ...context,
    colors: tokens.colors[context.mode],
  };
};

/**
 * Theme Toggle - Växlingsknapp för light/dark mode
 * Använder SVG-ikoner istället för emojis
 */
import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Växla till ${mode === 'light' ? 'mörkt' : 'ljus'} tema`}
    >
      {mode === 'light' ? (
        <Icon name="moon" size={20} />
      ) : (
        <Icon name="sun" size={20} />
      )}
    </Button>
  );
};

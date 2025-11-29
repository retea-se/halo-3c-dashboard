/**
 * Card - Grundläggande kort-komponent med theme-stöd
 */
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  style,
}) => {
  const paddingStyles: Record<string, React.CSSProperties> = {
    none: {},
    sm: { padding: 'var(--spacing-sm)' },
    md: { padding: 'var(--spacing-md)' },
    lg: { padding: 'var(--spacing-lg)' },
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'var(--transition-normal)',
    ...paddingStyles[padding],
    ...style,
  };

  return (
    <div
      style={baseStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
        }
      }}
    >
      {children}
    </div>
  );
};

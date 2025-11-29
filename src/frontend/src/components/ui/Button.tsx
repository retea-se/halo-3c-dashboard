/**
 * Button - Grundläggande knapp-komponent med theme-stöd
 */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'var(--font-family-sans)',
    fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-normal)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
    },
    secondary: {
      backgroundColor: 'var(--color-secondary)',
      color: 'var(--color-text-inverse)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: 'var(--font-size-sm)',
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-size-base)',
    },
    lg: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: 'var(--font-size-lg)',
    },
  };

  const disabledStyles: React.CSSProperties = props.disabled
    ? {
        opacity: 0.5,
        cursor: 'not-allowed',
      }
    : {};

  const combinedStyle: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...disabledStyles,
  };

  return (
    <button
      style={combinedStyle}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Navbar - Huvudnavigation för Halo 3C Dashboard
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeProvider';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard-icon' },
  { path: '/sensors/compare', label: 'Grafer', icon: 'graph-icon' },
  { path: '/beacons', label: 'Beacons', icon: 'beacon-icon' },
  { path: '/events', label: 'Events', icon: 'events-icon' },
  { path: '/sensors/info', label: 'Sensor Info', icon: 'sensor-info-icon' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { colors } = useTheme();

  return (
    <nav
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderBottom: `1px solid var(--color-border)`,
        padding: 'var(--spacing-md) var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
        {/* Logo/Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            fontWeight: 600,
            fontSize: 'var(--font-size-lg)',
          }}
        >
          <Icon name="halo-icon" size={24} color={colors.primary} />
          <span>Halo 3C Dashboard</span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? `${colors.primary}10` : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 'var(--font-size-base)',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.icon && <Icon name={item.icon} size={18} color={isActive ? colors.primary : colors.text.secondary} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Theme Toggle */}
      <div>
        <ThemeToggle />
      </div>
    </nav>
  );
};



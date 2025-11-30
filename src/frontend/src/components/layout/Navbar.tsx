/**
 * Navbar - Huvudnavigation for Tekniklokaler Dashboard
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Icon } from '../ui/Icon';
import { HeartbeatIndicator } from '../system/HeartbeatIndicator';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';

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
  { path: '/alarms', label: 'Larm', icon: 'alert-icon' },
  { path: '/certification', label: 'Certifiering', icon: 'certification-icon' },
  { path: '/utilization', label: 'Utnyttjande', icon: 'chart-icon' },
  { path: '/log', label: 'Logg', icon: 'log-icon' },
  { path: '/sensors/info', label: 'Sensor Info', icon: 'sensor-info-icon' },
  { path: '/device', label: 'Enhet', icon: 'device-icon' },
  { path: '/integrations', label: 'Integrationer', icon: 'integrations-icon' },
  { path: '/docs', label: 'Docs', icon: 'docs-icon' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Initial check based on current window width (SSR-safe with fallback)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    // Check immediately on mount
    checkMobile();
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    // Also check on orientation change (important for mobile devices)
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Close menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        borderBottom: `1px solid var(--color-border)`,
        padding: 'var(--spacing-sm) var(--spacing-md)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Main navbar row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {/* Mobile menu button - always render but hide on desktop for proper touch support */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              padding: 'var(--spacing-sm)',
              cursor: 'pointer',
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary)',
              minWidth: '44px', // Touch-friendly size (minimum 44x44)
              minHeight: '44px',
              marginLeft: '-8px', // Compensate for padding to align with edge
              WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
            }}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </button>

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
              fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-lg)',
            }}
          >
            <Icon name="halo-icon" size={isMobile ? 20 : 24} color={colors.primary} />
            <span>{isMobile ? 'TL' : 'Tekniklokaler'}</span>
          </Link>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
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
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive ? `${colors.primary}10` : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 'var(--font-size-sm)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.icon && <Icon name={item.icon} size={16} color={isActive ? colors.primary : colors.text.secondary} />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: Heartbeat + Theme Toggle + User info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <HeartbeatIndicator compact refreshInterval={15000} />
          <ThemeToggle />

          {user && !isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              paddingLeft: 'var(--spacing-sm)',
              borderLeft: '1px solid var(--color-border)',
            }}>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}>
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)';
                  (e.target as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                }}
              >
                Logga ut
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          marginTop: 'var(--spacing-sm)',
          paddingTop: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  backgroundColor: isActive ? `${colors.primary}10` : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 'var(--font-size-base)',
                }}
              >
                {item.icon && <Icon name={item.icon} size={20} color={isActive ? colors.primary : colors.text.secondary} />}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile logout */}
          {user && (
            <div style={{
              marginTop: 'var(--spacing-sm)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-sm) var(--spacing-md)',
            }}>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}>
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Logga ut
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

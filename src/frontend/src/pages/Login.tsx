/**
 * Login Page - Inloggningssida for Tekniklokaler Dashboard
 */
import React, { useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Felaktigt anvandarnamn eller losenord');
      }
    } catch {
      setError('Inloggningen misslyckades. Forsok igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-lg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--spacing-2xl)',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-sm)',
          }}>
            Tekniklokaler
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            Smart Sensor Monitoring Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Anvandarnamn
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Losenord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
              backgroundColor: 'var(--color-error-light, #fef2f2)',
              border: '1px solid var(--color-error, #ef4444)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error, #ef4444)',
              fontSize: 'var(--font-size-sm)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'white',
              backgroundColor: isLoading ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-primary-dark, #2563eb)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-primary)';
              }
            }}
          >
            {isLoading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <div style={{
          marginTop: 'var(--spacing-xl)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-tertiary)',
          }}>
            Overvakning av obemannade tekniska utrymmen
          </p>
        </div>
      </div>
    </div>
  );
};

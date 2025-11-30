/**
 * App - Huvudkomponent for Tekniklokaler Dashboard
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider, ProtectedRoute, useAuth } from './components/auth/AuthProvider';
import { Layout } from './components/layout/Layout';
import './App.css';

import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { SensorInfoOverview } from './pages/SensorInfoOverview';
import { SensorInfoDetail } from './pages/SensorInfoDetail';
import { SensorCompare } from './pages/SensorCompare';
import { BeaconManagement } from './pages/BeaconManagement';
import { DeviceInfo } from './pages/DeviceInfo';
import { Documentation } from './pages/Documentation';
import { Log } from './pages/Log';
import { Login } from './pages/Login';
import { Integrations } from './pages/Integrations';
import { AlarmConfig } from './pages/AlarmConfig';
import { Certification } from './pages/Certification';
import { Utilization } from './pages/Utilization';

/**
 * AppContent - Innehall som kraver auth context
 */
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Visa laddningsindikator under initial auth-check
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)',
      }}>
        Laddar...
      </div>
    );
  }

  // Visa login-sidan om ej autentiserad
  if (!isAuthenticated) {
    return <Login />;
  }

  // Visa huvudapplikationen om autentiserad
  return (
    <div className="app" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-family-sans)'
    }}>
      <Layout>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } />
          <Route path="/sensors/info" element={
            <ProtectedRoute>
              <SensorInfoOverview />
            </ProtectedRoute>
          } />
          <Route path="/sensors/info/:sensorId" element={
            <ProtectedRoute>
              <SensorInfoDetail />
            </ProtectedRoute>
          } />
          <Route path="/sensors/compare" element={
            <ProtectedRoute>
              <SensorCompare />
            </ProtectedRoute>
          } />
          <Route path="/beacons" element={
            <ProtectedRoute>
              <BeaconManagement />
            </ProtectedRoute>
          } />
          <Route path="/device" element={
            <ProtectedRoute>
              <DeviceInfo />
            </ProtectedRoute>
          } />
          <Route path="/docs" element={
            <ProtectedRoute>
              <Documentation />
            </ProtectedRoute>
          } />
          <Route path="/log" element={
            <ProtectedRoute>
              <Log />
            </ProtectedRoute>
          } />
          <Route path="/integrations" element={
            <ProtectedRoute>
              <Integrations />
            </ProtectedRoute>
          } />
          <Route path="/alarms" element={
            <ProtectedRoute>
              <AlarmConfig />
            </ProtectedRoute>
          } />
          <Route path="/certification" element={
            <ProtectedRoute>
              <Certification />
            </ProtectedRoute>
          } />
          <Route path="/utilization" element={
            <ProtectedRoute>
              <Utilization />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="light">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

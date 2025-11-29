/**
 * App - Huvudkomponent för Halo 3C Dashboard
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { Layout } from './components/layout/Layout';
import './App.css';

import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { SensorInfoOverview } from './pages/SensorInfoOverview';
import { SensorInfoDetail } from './pages/SensorInfoDetail';
import { SensorCompare } from './pages/SensorCompare';
import { BeaconManagement } from './pages/BeaconManagement';

const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="light">
      <Router>
        <div className="app" style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-sans)'
        }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/sensors/info" element={<SensorInfoOverview />} />
              <Route path="/sensors/info/:sensorId" element={<SensorInfoDetail />} />
              <Route path="/sensors/compare" element={<SensorCompare />} />
              <Route path="/beacons" element={<BeaconManagement />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;

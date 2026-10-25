import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParkingProvider } from './context/ParkingContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { LiveParkingPage } from './pages/LiveParkingPage';
import { IoTDevicesPage } from './pages/IoTDevicesPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ParkingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="live-parking" element={<LiveParkingPage />} />
            <Route path="iot-devices" element={<IoTDevicesPage />} />
            <Route path="activity-logs" element={<ActivityLogsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ParkingProvider>
  );
};

export default App;

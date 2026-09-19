import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import InspectionPortalPage from './pages/InspectionPortalPage';
import CarrierPortalPage from './pages/CarrierPortalPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Authenticated Routes (Any Logged-in User) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
          </Route>

          {/* Role-Restricted Route: Mechanics / Repair Shops Only */}
          <Route element={<ProtectedRoute allowedRoles={['REPAIR_SHOP']} />}>
            <Route path="/inspections/*" element={<InspectionPortalPage />} />
          </Route>

          {/* Role-Restricted Route: Logistics Carriers Only */}
          <Route element={<ProtectedRoute allowedRoles={['LOGISTICS']} />}>
            <Route path="/carrier/*" element={<CarrierPortalPage />} />
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

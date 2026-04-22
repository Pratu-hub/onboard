import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/Login';
import NewHireDashboard from './pages/NewHireDashboard';
import ItAdminDashboard from './pages/ItAdminDashboard';
import HrDashboardLayout from './features/hr/HrDashboardLayout';
import HrCasesPage from './features/hr/pages/HrCasesPage';
import HrAnalyticsPage from './features/hr/pages/HrAnalyticsPage';
import NewHireProfile from './pages/NewHireProfile';
import StatusTracker from './pages/StatusTracker';

// A wrapper for routes that require authentication
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but doesn't have the right role, redirect to base dashboard
    if (user.role === 'NEW_HIRE') return <Navigate to="/dashboard/new-hire" replace />;
    if (user.role === 'HR') return <Navigate to="/dashboard/hr" replace />;
    if (user.role === 'IT_ADMIN') return <Navigate to="/dashboard/it-admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['NEW_HIRE']}>
            <NewHireProfile />
          </ProtectedRoute>
        } />
        
        {/* Dashboard Routes wrapped in the Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout><Navigate to="/dashboard/new-hire" replace /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/new-hire" element={
          <ProtectedRoute allowedRoles={['NEW_HIRE', 'HR', 'IT_ADMIN']}>
            <DashboardLayout><NewHireDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* --- Unified HR Dashboard Routes --- */}
        <Route path="/dashboard/hr" element={
          <ProtectedRoute allowedRoles={['HR']}>
            <HrDashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="cases" replace />} />
          <Route path="cases" element={<HrCasesPage />} />
          <Route path="analytics" element={<HrAnalyticsPage />} />
        </Route>

        <Route path="/dashboard/status-tracker" element={
          <ProtectedRoute allowedRoles={['NEW_HIRE', 'HR', 'IT_ADMIN']}>
            <DashboardLayout><StatusTracker /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/it-admin" element={
          <ProtectedRoute allowedRoles={['IT_ADMIN']}>
            <DashboardLayout><ItAdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;

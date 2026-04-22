import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/Login';
import NewHireDashboard from './pages/NewHireDashboard';
import HrAdminDashboard from './pages/HrAdminDashboard';
import HrReviewerDashboard from './features/hr-reviewer/HrReviewerDashboard';
import ItAdminDashboard from './pages/ItAdminDashboard';
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
    if (user.role === 'HR_ADMIN') return <Navigate to="/dashboard/hr-admin" replace />;
    if (user.role === 'HR_REVIEWER') return <Navigate to="/dashboard/hr-reviewer" replace />;
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
          <ProtectedRoute allowedRoles={['NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN']}>
            <DashboardLayout><NewHireDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/status-tracker" element={
          <ProtectedRoute allowedRoles={['NEW_HIRE', 'HR_REVIEWER', 'HR_ADMIN', 'IT_ADMIN']}>
            <DashboardLayout><StatusTracker /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/hr-admin" element={
          <ProtectedRoute allowedRoles={['HR_ADMIN']}>
            <DashboardLayout><HrAdminDashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/hr-reviewer" element={
          <ProtectedRoute allowedRoles={['HR_REVIEWER', 'HR_ADMIN']}>
            <DashboardLayout><HrReviewerDashboard /></DashboardLayout>
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

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RoleGuard from '../components/layout/RoleGuard';
import AppLayout from '../components/layout/AppLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Subscriptions from '../pages/Subscriptions';
import Invoices from '../pages/Invoices';
import Payments from '../pages/Payments';

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Authenticated Application Shell */}
      <Route
        element={
          <RoleGuard>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Master Data / Products (Admin & Staff Only) */}
        <Route
          path="/products"
          element={
            <RoleGuard allowedRoles={['admin', 'staff']}>
              <Products />
            </RoleGuard>
          }
        />

        {/* Subscriptions Pipeline (Admin, Staff, Customer) */}
        <Route
          path="/subscriptions"
          element={
            <RoleGuard allowedRoles={['admin', 'staff', 'customer']}>
              <Subscriptions />
            </RoleGuard>
          }
        />

        {/* Invoices (Admin, Staff, Customer) */}
        <Route
          path="/invoices"
          element={
            <RoleGuard allowedRoles={['admin', 'staff', 'customer']}>
              <Invoices />
            </RoleGuard>
          }
        />

        {/* Payments (Admin & Staff Only) */}
        <Route
          path="/payments"
          element={
            <RoleGuard allowedRoles={['admin', 'staff']}>
              <Payments />
            </RoleGuard>
          }
        />
      </Route>

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

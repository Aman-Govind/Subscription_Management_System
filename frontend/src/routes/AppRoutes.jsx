import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RoleGuard from '../components/layout/RoleGuard';
import AppLayout from '../components/layout/AppLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';

// Module placeholders during phase execution
const ProductsPlaceholder = () => (
  <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-xl text-center">
    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
      Products & Plans Catalog
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Master catalog management for subscriptions and plan tiers.
    </p>
  </div>
);

const SubscriptionsPlaceholder = () => (
  <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-xl text-center">
    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
      Subscription Lifecycle Pipeline
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Lifecycle transitions from Draft to Active subscription status.
    </p>
  </div>
);

const InvoicesPlaceholder = () => (
  <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-xl text-center">
    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
      Invoices & Tax Engine
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Billing invoice generation with tax and discount breakdowns.
    </p>
  </div>
);

const PaymentsPlaceholder = () => (
  <div className="p-8 border border-slate-800 bg-slate-900/60 rounded-xl text-center">
    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
      Payment Reconciliation
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Recording and reconciliation of manual and automated payments.
    </p>
  </div>
);

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

        {/* Products (Admin & Staff Only) */}
        <Route
          path="/products"
          element={
            <RoleGuard allowedRoles={['admin', 'staff']}>
              <ProductsPlaceholder />
            </RoleGuard>
          }
        />

        {/* Subscriptions (Admin, Staff, Customer) */}
        <Route
          path="/subscriptions"
          element={
            <RoleGuard allowedRoles={['admin', 'staff', 'customer']}>
              <SubscriptionsPlaceholder />
            </RoleGuard>
          }
        />

        {/* Invoices (Admin, Staff, Customer) */}
        <Route
          path="/invoices"
          element={
            <RoleGuard allowedRoles={['admin', 'staff', 'customer']}>
              <InvoicesPlaceholder />
            </RoleGuard>
          }
        />

        {/* Payments (Admin & Staff Only) */}
        <Route
          path="/payments"
          element={
            <RoleGuard allowedRoles={['admin', 'staff']}>
              <PaymentsPlaceholder />
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

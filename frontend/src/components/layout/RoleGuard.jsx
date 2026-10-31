import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * RoleGuard protects application routes:
 * 1. Confirms active authenticated session.
 * 2. Enforces immutable role permissions against allowedRoles.
 */
export const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { role, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-mono uppercase tracking-wider text-slate-400">
          Validating authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
          <div className="w-11 h-11 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your current assigned role (<span className="font-mono text-indigo-400 font-semibold">{role}</span>) does not hold authorization to access this enterprise module.
          </p>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
            <span className="text-xs font-mono text-slate-400 font-semibold">403 FORBIDDEN</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;

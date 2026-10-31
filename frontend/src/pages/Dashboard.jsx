import React from 'react';
import useAuth from '../hooks/useAuth';
import { Shield, Key, Building2, CheckCircle2 } from 'lucide-react';

export const Dashboard = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Session Authenticated
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Welcome back, {user?.name || 'Authorized User'}
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Enterprise subscription and billing management portal for{' '}
          <span className="font-semibold text-slate-200">{user?.company || 'Brightloop Systems'}</span>.
          Session role locked to <span className="font-mono text-indigo-400 font-semibold uppercase">{role}</span>.
        </p>
      </div>

      {/* Security & Access State Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-slate-400 font-semibold">JWT Interceptor</div>
              <div className="text-xs font-semibold text-slate-200">Bearer Token Active</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Centralized Axios client appends bearer credentials to all outgoing API requests.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-slate-400 font-semibold">RBAC Isolation</div>
              <div className="text-xs font-semibold text-slate-200">RoleGuard Enforced</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access to administrative, billing, and subscriber views is strictly partitioned.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Tenant Session</div>
              <div className="text-xs font-semibold text-slate-200">{user?.company || 'Enterprise Tenant'}</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role state and user profile are locked in persistent storage throughout the session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

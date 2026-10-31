import React from 'react';
import useAuth from '../../hooks/useAuth';
import { LogOut, Building, ShieldCheck } from 'lucide-react';

export const Header = () => {
  const { user, role, logout } = useAuth();

  const roleBadgeStyles = {
    admin: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    staff: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    customer: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };

  return (
    <header className="h-14 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
      {/* Workspace Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-200">{user?.company || 'Brightloop Systems'}</span>
          <span className="text-slate-400">/</span>
          <span className="font-mono text-slate-400">{user?.department || 'Workspace'}</span>
        </div>
      </div>

      {/* User Session Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Session Locked</span>
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-100">{user?.name || 'Authenticated User'}</div>
            <div className="text-xs font-mono text-slate-400">{user?.email}</div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider border font-medium ${
              roleBadgeStyles[role] || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {role}
          </span>

          <button
            onClick={logout}
            title="Terminate session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

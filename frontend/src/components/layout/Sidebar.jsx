import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  Repeat,
  Receipt,
  CreditCard,
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'staff', 'customer'],
    },
    {
      name: 'Products & Plans',
      to: '/products',
      icon: Package,
      roles: ['admin', 'staff'],
    },
    {
      name: 'Subscriptions',
      to: '/subscriptions',
      icon: Repeat,
      roles: ['admin', 'staff', 'customer'],
    },
    {
      name: 'Invoices',
      to: '/invoices',
      icon: Receipt,
      roles: ['admin', 'staff', 'customer'],
    },
    {
      name: 'Payments',
      to: '/payments',
      icon: CreditCard,
      roles: ['admin', 'staff'],
    },
  ];

  const visibleNav = navigation.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-14 flex items-center px-5 border-b border-slate-800 gap-2.5">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-600/30 border border-indigo-400/20">
            BL
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              Brightloop
              <span className="text-xs font-mono font-medium px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                SaaS
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Billing Console
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-4">
          <div className="px-2 mb-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Platform Modules
          </div>
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Engine Status */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Engine Active
          </span>
          <span className="text-slate-400">v1.4.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

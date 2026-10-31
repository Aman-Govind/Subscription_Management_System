import React from 'react';

const VARIANT_MAP = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  // Specific subscription states
  draft: 'bg-slate-800 text-slate-400 border-slate-700',
  quotation: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  confirmed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  // Specific invoice states
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const Badge = ({ children, variant = 'default', className = '', dot = false }) => {
  const style = VARIANT_MAP[variant.toLowerCase()] || VARIANT_MAP.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider border font-medium ${style} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
};

export default Badge;


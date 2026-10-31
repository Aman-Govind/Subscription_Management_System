import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-800/60 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
      <div className="h-10 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="divide-y divide-slate-800/60 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="py-3 px-3 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={c === 0 ? 'w-32' : c === 1 ? 'flex-1' : 'w-24'}
              >
                <Skeleton className="h-3.5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatGridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;


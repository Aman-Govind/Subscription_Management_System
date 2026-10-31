import React from 'react';

export const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found.',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Loading records...
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden border border-slate-800 rounded-xl bg-slate-900 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={`py-3 px-4 font-semibold ${col.align === 'right' ? 'text-right' : ''} ${
                    col.headerClassName || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-slate-500 font-mono text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row[keyField] || rowIndex}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col, colIndex) => {
                    const value = col.accessor ? col.accessor(row) : row[col.key];
                    return (
                      <td
                        key={col.key || colIndex}
                        className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : ''} ${
                          col.className || ''
                        }`}
                      >
                        {col.render ? col.render(row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;


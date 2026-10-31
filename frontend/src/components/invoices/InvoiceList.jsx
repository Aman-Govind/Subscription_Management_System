import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import {
  FileText,
  CreditCard,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Send,
} from 'lucide-react';

export const InvoiceList = ({
  invoices = [],
  onViewInvoice,
  onConfirmInvoice,
  onRecordPayment,
  isLoading = false,
  userRole = 'admin',
}) => {
  const canManageBilling = ['admin', 'staff'].includes(userRole);

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading billing ledger & invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-200">No Invoices Found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No billing records match the current filter criteria or need automated generation.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Subscription</th>
              <th className="py-3 px-4">Issue / Due Date</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {invoices.map((inv) => {
              const isOverdue =
                inv.status === 'confirmed' &&
                inv.dueDate &&
                new Date(inv.dueDate) < new Date();
              const displayStatus = isOverdue ? 'overdue' : inv.status;

              return (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                  onClick={() => onViewInvoice && onViewInvoice(inv)}
                >
                  {/* Invoice Number */}
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <span>{inv.invoiceNumber}</span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{inv.customer}</div>
                    <div className="font-mono text-[11px] text-slate-500">{inv.customerEmail}</div>
                  </td>

                  {/* Linked Subscription */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {inv.subscriptionNumber ? (
                      <span className="inline-flex items-center gap-1 text-slate-300 hover:text-indigo-300">
                        {inv.subscriptionNumber}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-300">{inv.invoiceDate}</div>
                    <div
                      className={
                        isOverdue
                          ? 'text-rose-400 font-semibold flex items-center gap-1 mt-0.5'
                          : 'text-slate-500 mt-0.5'
                      }
                    >
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      Due: {inv.dueDate}
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="text-slate-100 font-bold">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {inv.taxAmount > 0 && (
                      <div className="text-[10px] text-slate-500">
                        incl. ₹{Number(inv.taxAmount).toLocaleString('en-IN')} GST
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={displayStatus} dot>
                      {displayStatus.toUpperCase()}
                    </Badge>
                  </td>

                  {/* Action Buttons */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="View Full Invoice"
                        onClick={() => onViewInvoice && onViewInvoice(inv)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all active:scale-[0.98]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canManageBilling && inv.status === 'draft' && (
                        <button
                          title="Confirm Invoice"
                          onClick={() => onConfirmInvoice && onConfirmInvoice(inv.id)}
                          className="px-2 py-1 text-[11px] font-mono font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all active:scale-[0.98]"
                        >
                          Confirm
                        </button>
                      )}

                      {canManageBilling && inv.status !== 'paid' && (
                        <button
                          title="Record Payment"
                          onClick={() => onRecordPayment && onRecordPayment(inv)}
                          className="px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1 transition-all active:scale-[0.98]"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;


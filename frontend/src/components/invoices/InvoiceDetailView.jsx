import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import TaxDiscountBreakdown from '../common/TaxDiscountBreakdown';
import {
  Receipt,
  Printer,
  CreditCard,
  CheckCircle2,
  Building,
  Calendar,
  FileCheck,
  Send,
  Zap,
} from 'lucide-react';

export const InvoiceDetailView = ({
  isOpen,
  onClose,
  invoice,
  onConfirmInvoice,
  onOpenPaymentModal,
}) => {
  if (!invoice) return null;

  const isDraft = invoice.status === 'draft';
  const isConfirmed = invoice.status === 'confirmed';
  const isPaid = invoice.status === 'paid';
  const isOverdue =
    isConfirmed && invoice.dueDate && new Date(invoice.dueDate) < new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Billing Entity: Brightloop Software Solutions • Generated: ${invoice.invoiceDate}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-slate-100 print:text-black">
        {/* Invoice Header Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-indigo-400">
                {invoice.invoiceNumber}
              </span>
              <Badge variant={isOverdue ? 'overdue' : invoice.status} dot>
                {isOverdue ? 'OVERDUE' : invoice.status}
              </Badge>
            </div>
            <div className="text-xs text-slate-400">
              Contract Linked: <span className="font-mono text-slate-200">{invoice.subscriptionNumber || 'Direct Recurring'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Issue Date</span>
              <span className="text-slate-200">{invoice.invoiceDate}</span>
            </div>
            <div className="pl-3 border-l border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Payment Due</span>
              <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {invoice.dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Bill-To & Issuer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block mb-1">
              Billed To (Subscriber Tenant)
            </span>
            <div className="font-semibold text-slate-100 text-sm">{invoice.customer}</div>
            <div className="font-mono text-slate-400 mt-0.5">{invoice.customerEmail}</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              {invoice.billingAddress || 'Corporate Headquarters'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block mb-1">
              Remit To (Issuer Service)
            </span>
            <div className="font-semibold text-slate-100 text-sm">Brightloop Software Ltd</div>
            <div className="font-mono text-slate-400 mt-0.5">finance@brightloop.io</div>
            <div className="text-slate-400 mt-1 leading-relaxed">
              GSTIN: 29AABCB1234F1Z8 • Electronic Invoice Portal
            </div>
          </div>
        </div>

        {/* Line Items Scannable Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Item Description</th>
                <th className="py-2.5 px-3 text-center w-20">Qty</th>
                <th className="py-2.5 px-4 text-right w-32">Unit Price</th>
                <th className="py-2.5 px-4 text-right w-36">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invoice.lineItems?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                    ₹{Number(item.subtotal).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statutory Tax & Discount Breakdown */}
        <TaxDiscountBreakdown
          subtotal={invoice.subtotal}
          discountType={invoice.discountType}
          discountValue={invoice.discountValue}
          taxRate={invoice.taxRate}
          currency={invoice.currency || '₹'}
        />

        {/* Settlement Audit Log if Paid */}
        {isPaid && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Settled on {invoice.paidDate} via {invoice.paymentMethod || 'Wire Transfer'}
              </span>
            </div>
            <span className="text-slate-300 font-semibold">
              Ref: {invoice.paymentReference || 'VERIFIED-SETTLEMENT'}
            </span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print / PDF Stub
          </Button>

          <div className="flex items-center gap-2">
            {isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={FileCheck}
                onClick={() => onConfirmInvoice(invoice.id)}
              >
                Confirm Invoice
              </Button>
            )}

            {!isPaid && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={() => onOpenPaymentModal(invoice)}
              >
                Record Payment
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailView;


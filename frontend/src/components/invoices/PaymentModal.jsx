import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { CreditCard, DollarSign, Calendar, CheckCircle2, FileText, Hash } from 'lucide-react';

export const PaymentModal = ({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire Transfer');
  const [amount, setAmount] = useState(invoice ? invoice.totalAmount : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.totalAmount);
      setReferenceNumber(`UTR-${Date.now().toString().slice(-6)}`);
      setNotes(`Payment reconciled for ${invoice.invoiceNumber}`);
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordPayment({
        invoiceId: invoice.id,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customer} • Total Billed: ₹${Number(invoice.totalAmount).toLocaleString('en-IN')}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outstanding Balance Banner */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Target Balance Due:</span>
          <span className="font-mono text-base font-bold text-emerald-400">
            ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Payment Reconciliation Channel
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Bank Wire Transfer">Bank Wire Transfer (NEFT/RTGS/IMPS)</option>
            <option value="UPI Auto-Debit">UPI Mandate / Direct Transfer</option>
            <option value="Credit / Debit Card">Credit / Debit Card Gateway</option>
            <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
          </select>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount Paid (₹)"
            type="number"
            step="0.01"
            mono
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Payment Date"
            type="date"
            mono
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Reference Number */}
        <Input
          label="Transaction / UTR Reference #"
          placeholder="e.g. UTR-AXIS-992140"
          mono
          required
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Audit Ledger Note
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reconciliation note or authorization approval..."
            className="block w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSubmitting}
            icon={CreditCard}
          >
            Record & Mark as Paid
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import billingService from '../services/billingService';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import PaymentModal from '../components/invoices/PaymentModal';
import { useToast } from '../components/common/Toast';
import {
  CreditCard,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Building,
  Smartphone,
  Wallet,
  Receipt,
  FileCheck,
} from 'lucide-react';

export const Payments = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modal for new payment selection
  const [isSelectInvoiceOpen, setIsSelectInvoiceOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const canManageBilling = ['admin', 'staff'].includes(user?.role);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentsData, invoicesData] = await Promise.all([
        billingService.getPayments(),
        billingService.getInvoices(),
      ]);
      setPayments(paymentsData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to load payments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');

  const handleRecordPayment = async (paymentData) => {
    try {
      await billingService.recordPayment(paymentData);
      await loadData();
      setIsPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      toast.success('Payment verified and settled in ledger.');
      setNotification({
        type: 'success',
        message: 'Payment verified and settled in ledger.',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Payment reconciliation failed.');
    }
  };

  // Telemetry Metrics
  const totalSettled = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const wireSettled = payments
    .filter((p) => p.paymentMethod?.toLowerCase().includes('wire') || p.paymentMethod?.toLowerCase().includes('bank'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const upiSettled = payments
    .filter((p) => p.paymentMethod?.toLowerCase().includes('upi'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = p.paymentNumber?.toLowerCase().includes(q);
      const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
      const matchCust = p.customer?.toLowerCase().includes(q);
      const matchRef = p.referenceNumber?.toLowerCase().includes(q);
      return matchNum || matchInv || matchCust || matchRef;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Payments & Collections Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track bank wires, UPI mandates, and card settlements with electronic UTR reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            loading={isLoading}
          >
            Refresh
          </Button>

          {canManageBilling && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsSelectInvoiceOpen(true)}
            >
              Record Manual Payment
            </Button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Settled Revenue"
          value={`₹${totalSettled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${payments.length} verified transactions`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Bank Wire Transfers"
          value={`₹${wireSettled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Corporate NEFT / RTGS"
          icon={Building}
        />
        <StatCard
          title="UPI & Digital Mandates"
          value={`₹${upiSettled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle="Instant recurring debits"
          icon={Smartphone}
        />
        <StatCard
          title="Pending Invoices"
          value={unpaidInvoices.length}
          subtitle={unpaidInvoices.length > 0 ? 'Awaiting remittance' : 'All invoices settled'}
          icon={Receipt}
          color={unpaidInvoices.length > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Channels' },
            { id: 'Bank Wire Transfer', label: 'Bank Wire' },
            { id: 'UPI Auto-Debit', label: 'UPI Auto-Debit' },
            { id: 'Credit / Debit Card', label: 'Cards' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all whitespace-nowrap active:scale-[0.98] ${
                methodFilter === tab.id
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search payment #, UTR, invoice..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">UTR / External Ref</th>
                <th className="py-3 px-4 text-right">Settled Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-500 font-mono">
                    No payment records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.paymentNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-indigo-400">
                      {p.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {p.customer}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {p.paymentDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px]">
                        {p.referenceNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="paid" dot>
                        SETTLED
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pick Invoice Modal to Record Payment */}
      <Modal
        isOpen={isSelectInvoiceOpen}
        onClose={() => setIsSelectInvoiceOpen(false)}
        title="Select Invoice for Payment Settlement"
        subtitle="Choose an outstanding or confirmed invoice to reconcile remittance"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {unpaidInvoices.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">All Invoices Settled</p>
              <p className="text-xs text-slate-400 mt-1">
                There are no open invoices requiring remittance at this time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              {unpaidInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 hover:bg-slate-900/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => {
                    setSelectedInvoiceForPayment(inv);
                    setIsSelectInvoiceOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-400">
                        {inv.invoiceNumber}
                      </span>
                      <Badge variant={inv.status} dot>
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-300 font-medium mt-1">
                      {inv.customer}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Due: {inv.dueDate} • Ref: {inv.subscriptionNumber || 'Direct'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-100 text-sm">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      className="mt-1.5 px-2.5 py-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoiceForPayment(inv);
                        setIsSelectInvoiceOpen(false);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      Reconcile Remittance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectInvoiceOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Reconciliation Modal */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
          onRecordPayment={handleRecordPayment}
        />
      )}
    </div>
  );
};

export default Payments;


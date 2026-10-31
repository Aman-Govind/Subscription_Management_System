import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import billingService from '../services/billingService';
import InvoiceList from '../components/invoices/InvoiceList';
import InvoiceDetailView from '../components/invoices/InvoiceDetailView';
import PaymentModal from '../components/invoices/PaymentModal';
import Button from '../components/common/Button';
import StatCard from '../components/common/StatCard';
import Input from '../components/common/Input';
import {
  FileText,
  CreditCard,
  Zap,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Coins,
} from 'lucide-react';

export const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal states
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const canManageBilling = ['admin', 'staff'].includes(user?.role);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await billingService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleGenerateDueInvoices = async () => {
    setIsGenerating(true);
    setNotification(null);
    try {
      const res = await billingService.generateDueInvoices();
      await loadInvoices();
      setNotification({
        type: 'success',
        message:
          res.generatedCount > 0
            ? `Generated ${res.generatedCount} recurring invoice(s) from due active subscriptions.`
            : 'All active subscriptions are currently up to date; no recurring invoices were due.',
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to generate recurring invoices.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId) => {
    try {
      await billingService.confirmInvoice(invoiceId);
      await loadInvoices();
      if (activeInvoice && activeInvoice.id === invoiceId) {
        setActiveInvoice((prev) => ({ ...prev, status: 'confirmed' }));
      }
      setNotification({
        type: 'success',
        message: 'Invoice confirmed and issued to customer.',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to confirm invoice.');
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      await billingService.recordPayment(paymentData);
      await loadInvoices();
      setIsPaymentOpen(false);
      setIsDetailOpen(false);
      setNotification({
        type: 'success',
        message: `Payment reconciled successfully. Invoice balance settled.`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reconcile payment.');
    }
  };

  // Telemetry Calculations
  const totalInvoiced = invoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalCollected = paidInvoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const outstandingInvoices = invoices.filter((i) => i.status === 'confirmed');
  const totalOutstanding = outstandingInvoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const overdueCount = invoices.filter(
    (i) => i.status === 'confirmed' && i.dueDate && new Date(i.dueDate) < new Date()
  ).length;

  // Filter & Search Logic
  const filteredInvoices = invoices.filter((inv) => {
    const isOverdue =
      inv.status === 'confirmed' && inv.dueDate && new Date(inv.dueDate) < new Date();
    
    // Status Filter
    if (statusFilter === 'overdue' && !isOverdue) return false;
    if (statusFilter !== 'all' && statusFilter !== 'overdue' && inv.status !== statusFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchCustomer = inv.customer?.toLowerCase().includes(q);
      const matchEmail = inv.customerEmail?.toLowerCase().includes(q);
      const matchSub = inv.subscriptionNumber?.toLowerCase().includes(q);
      return matchNumber || matchCustomer || matchEmail || matchSub;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Invoices & Billing Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile recurring subscription invoices, manage GST tax compliance, and settle payments.
          </p>
        </div>

        {canManageBilling && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadInvoices}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={handleGenerateDueInvoices}
              loading={isGenerating}
            >
              Generate Due Invoices
            </Button>
          </div>
        )}
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Invoiced"
          value={`₹${totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${invoices.length} billable invoices generated`}
          icon={Coins}
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${paidInvoices.length} fully settled invoices`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Outstanding Receivables"
          value={`₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`${outstandingInvoices.length} invoices awaiting payment`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue Receivables"
          value={overdueCount}
          subtitle={overdueCount > 0 ? 'Requires collection action' : 'All accounts in good standing'}
          icon={AlertCircle}
          color={overdueCount > 0 ? 'rose' : 'slate'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'draft', label: 'Draft' },
            { id: 'confirmed', label: 'Confirmed / Due' },
            { id: 'paid', label: 'Paid' },
            { id: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all whitespace-nowrap active:scale-[0.98] ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search invoice #, customer..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Invoice Table View */}
      <InvoiceList
        invoices={filteredInvoices}
        isLoading={isLoading}
        userRole={user?.role}
        onViewInvoice={(invoice) => {
          setActiveInvoice(invoice);
          setIsDetailOpen(true);
        }}
        onConfirmInvoice={handleConfirmInvoice}
        onRecordPayment={(invoice) => {
          setPayingInvoice(invoice);
          setIsPaymentOpen(true);
        }}
      />

      {/* Invoice Detail Drawer Modal */}
      {isDetailOpen && (
        <InvoiceDetailView
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          invoice={activeInvoice}
          onConfirmInvoice={handleConfirmInvoice}
          onOpenPaymentModal={(invoice) => {
            setPayingInvoice(invoice);
            setIsPaymentOpen(true);
          }}
        />
      )}

      {/* Record Payment Reconcile Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          invoice={payingInvoice}
          onRecordPayment={handleRecordPayment}
        />
      )}
    </div>
  );
};

export default Invoices;


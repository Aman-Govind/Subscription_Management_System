import React, { useState, useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import subscriptionService from '../services/subscriptionService';
import SubscriptionTable from '../components/subscriptions/SubscriptionTable';
import LineItemsEditor from '../components/subscriptions/LineItemsEditor';
import StatusFlowModal from '../components/subscriptions/StatusFlowModal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import {
  Repeat,
  Plus,
  Search,
  Filter,
  Layers,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const Subscriptions = () => {
  const { user, role, isCustomer } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSubForStatus, setSelectedSubForStatus] = useState(null);
  const [selectedSubForDetails, setSelectedSubForDetails] = useState(null);

  // New Subscription Form State
  const [newSubData, setNewSubData] = useState({
    customer: isCustomer ? user?.company : 'Acme Logistics Corp',
    customerEmail: isCustomer ? user?.email : 'procurement@acme.corp',
    billingCycle: 'monthly',
    paymentTerms: 'Net 30',
    startDate: new Date().toISOString().split('T')[0],
    nextBillingDate: subscriptionService.calculateNextRenewalDate(new Date(), 'monthly'),
    endDate: '2027-10-31',
    status: 'draft',
    notes: 'Enterprise SLA subscription with Odoo connector integration.',
    lineItems: [
      {
        id: 'li_initial',
        productId: 'prod_01',
        productName: 'Enterprise Cloud Core',
        variantId: 'var_odoo_01',
        variantName: 'Odoo Enterprise Connector Sync',
        quantity: 1,
        unitPrice: 32000,
        variantDelta: 560,
        taxRate: 18,
        subtotal: 32560,
        taxAmount: 5860.8,
        total: 38420.8,
      },
    ],
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    const data = await subscriptionService.getSubscriptions();
    // If customer role, only view customer's tenant records
    if (isCustomer && user?.company) {
      setSubscriptions(
        data.filter(
          (s) =>
            s.customer.toLowerCase().includes(user.company.toLowerCase()) ||
            s.customerEmail?.toLowerCase() === user.email?.toLowerCase()
        )
      );
    } else {
      setSubscriptions(data);
    }
    setIsLoading(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newSubData.customer.trim() || newSubData.lineItems.length === 0) {
      alert('Please provide a customer name and at least one service line item.');
      return;
    }

    await subscriptionService.createSubscription(newSubData);
    setIsCreateModalOpen(false);
    await loadSubscriptions();
  };

  const handleTransitionStatus = async (subId, newStatus, note) => {
    await subscriptionService.transitionStatus(subId, newStatus, note);
    await loadSubscriptions();
  };

  const handleCycleChange = (cycle) => {
    setNewSubData((prev) => ({
      ...prev,
      billingCycle: cycle,
      nextBillingDate: subscriptionService.calculateNextRenewalDate(prev.startDate, cycle),
    }));
  };

  // Filtered Records
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesStatus =
        statusFilter === 'all' || sub.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCycle =
        cycleFilter === 'all' || sub.billingCycle.toLowerCase() === cycleFilter.toLowerCase();
      const matchesSearch =
        sub.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesCycle && matchesSearch;
    });
  }, [subscriptions, statusFilter, cycleFilter, searchTerm]);

  // Aggregate counts for tabs
  const counts = useMemo(() => {
    return {
      all: subscriptions.length,
      draft: subscriptions.filter((s) => s.status === 'draft').length,
      quotation: subscriptions.filter((s) => s.status === 'quotation').length,
      confirmed: subscriptions.filter((s) => s.status === 'confirmed').length,
      active: subscriptions.filter((s) => s.status === 'active').length,
      closed: subscriptions.filter((s) => s.status === 'closed').length,
    };
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            Subscription Lifecycle & Status Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end recurring contract pipeline: Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Subscription
        </Button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-3">
        {/* Status Pipeline Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { key: 'all', label: 'All Records', count: counts.all },
            { key: 'draft', label: 'Draft', count: counts.draft },
            { key: 'quotation', label: 'Quotation', count: counts.quotation },
            { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'closed', label: 'Closed', count: counts.closed },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="capitalize">{tab.label}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                  statusFilter === tab.key
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Cadence Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
          <div className="w-full sm:w-80">
            <Input
              icon={Search}
              placeholder="Search by SUB #, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-mono uppercase text-slate-400">Cadence:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {['all', 'weekly', 'monthly', 'yearly'].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setCycleFilter(cycle)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    cycleFilter === cycle
                      ? 'bg-slate-800 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Subscriptions Table */}
      <SubscriptionTable
        subscriptions={filteredSubscriptions}
        onManageStatus={(sub) => setSelectedSubForStatus(sub)}
        onViewDetails={(sub) => setSelectedSubForDetails(sub)}
        isLoading={isLoading}
      />

      {/* Modal: Status Pipeline Controller */}
      <StatusFlowModal
        isOpen={!!selectedSubForStatus}
        onClose={() => setSelectedSubForStatus(null)}
        subscription={selectedSubForStatus}
        onTransition={handleTransitionStatus}
      />

      {/* Modal: New Subscription Proposal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Subscription Proposal"
        subtitle="Provision recurring billing contract with line items and variant add-ons."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Subscriber / Organization"
              required
              placeholder="Acme Global Logistics"
              value={newSubData.customer}
              onChange={(e) => setNewSubData({ ...newSubData, customer: e.target.value })}
            />
            <Input
              label="Billing Contact Email"
              type="email"
              required
              mono
              placeholder="billing@acme.corp"
              value={newSubData.customerEmail}
              onChange={(e) => setNewSubData({ ...newSubData, customerEmail: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Billing Cadence
              </label>
              <select
                value={newSubData.billingCycle}
                onChange={(e) => handleCycleChange(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono capitalize"
              >
                <option value="weekly">Weekly (+7 days)</option>
                <option value="monthly">Monthly (+1 month)</option>
                <option value="yearly">Yearly (+1 year)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Terms
              </label>
              <select
                value={newSubData.paymentTerms}
                onChange={(e) => setNewSubData({ ...newSubData, paymentTerms: e.target.value })}
                className="block w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono"
              >
                <option value="Immediate Debit">Immediate Debit</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
              </select>
            </div>

            <Input
              label="Subscription Start Date"
              type="date"
              mono
              required
              value={newSubData.startDate}
              onChange={(e) =>
                setNewSubData({
                  ...newSubData,
                  startDate: e.target.value,
                  nextBillingDate: subscriptionService.calculateNextRenewalDate(
                    e.target.value,
                    newSubData.billingCycle
                  ),
                })
              }
            />

            <Input
              label="First Renewal Date"
              type="date"
              mono
              required
              value={newSubData.nextBillingDate}
              onChange={(e) => setNewSubData({ ...newSubData, nextBillingDate: e.target.value })}
            />
          </div>

          {/* Dynamic Line Items Editor */}
          <LineItemsEditor
            items={newSubData.lineItems}
            onChange={(updatedItems) => setNewSubData({ ...newSubData, lineItems: updatedItems })}
            billingCycle={newSubData.billingCycle}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Contract Terms & SLA Notes
            </label>
            <textarea
              rows={2}
              placeholder="Special provisioning clauses, dedicated SLA terms, or notes..."
              value={newSubData.notes}
              onChange={(e) => setNewSubData({ ...newSubData, notes: e.target.value })}
              className="block w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Subscription Proposal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details & Line Items */}
      {selectedSubForDetails && (
        <Modal
          isOpen={!!selectedSubForDetails}
          onClose={() => setSelectedSubForDetails(null)}
          title={`Subscription Details: ${selectedSubForDetails.subscriptionNumber}`}
          subtitle={`Subscriber: ${selectedSubForDetails.customer}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            {/* Summary Context */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Status:</span>
                <Badge variant={selectedSubForDetails.status} dot>
                  {selectedSubForDetails.status}
                </Badge>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Cadence:</span>
                <span className="text-slate-200 capitalize font-semibold">{selectedSubForDetails.billingCycle}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Renewal:</span>
                <span className="text-slate-200">{selectedSubForDetails.nextBillingDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Total:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{Math.round(selectedSubForDetails.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Readonly Line Items */}
            <LineItemsEditor
              items={selectedSubForDetails.lineItems}
              onChange={() => {}}
              readOnly={true}
              billingCycle={selectedSubForDetails.billingCycle}
            />

            {selectedSubForDetails.notes && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Contract Notes
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedSubForDetails.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const target = selectedSubForDetails;
                  setSelectedSubForDetails(null);
                  setSelectedSubForStatus(target);
                }}
              >
                Open Pipeline Controller ➔
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubForDetails(null)}
              >
                Close View
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Subscriptions;


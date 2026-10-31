import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';
import StatCard from '../components/common/StatCard';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  Repeat,
  DollarSign,
  Clock,
  AlertTriangle,
  Package,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user, role, isCustomer } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      const [metricsData, activitiesData] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getRecentActivities(),
      ]);
      setMetrics(metricsData);
      setRecentActivities(activitiesData);
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const activityColumns = [
    {
      key: 'id',
      header: 'Invoice Reference',
      render: (row) => (
        <span className="font-mono text-indigo-400 font-semibold">{row.id}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Subscriber Account',
      render: (row) => (
        <span className="font-medium text-slate-200">{row.customer}</span>
      ),
    },
    {
      key: 'type',
      header: 'Subscribed Service',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-300">
          <span>{row.type}</span>
          <span className="text-[10px] font-mono text-slate-400">({row.planCycle})</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Total Billed',
      render: (row) => (
        <span className="font-mono text-slate-100 font-bold">{row.amount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Reconciliation',
      render: (row) => (
        <Badge variant={row.status} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Due / Paid Date',
      render: (row) => (
        <span className="font-mono text-slate-400 text-xs">{row.date}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {role?.toUpperCase()} SESSION ACTIVE
            </span>
            <span className="text-xs font-mono text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">
              {user?.company || 'Brightloop Systems'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {isCustomer ? `Welcome back, ${user?.name}` : 'Subscription & Revenue Operations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isCustomer
              ? `Manage your active enterprise subscriptions, renewal cycles, and payment histories.`
              : `Real-time recurring billing metrics, subscriber pipeline health, and receivables ledger.`}
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          {!isCustomer && (
            <Link to="/products">
              <Button variant="outline" size="sm" icon={Package}>
                Product Catalog
              </Button>
            </Link>
          )}
          <Link to="/subscriptions">
            <Button variant="primary" size="sm" icon={Repeat}>
              Subscriptions
            </Button>
          </Link>
        </div>
      </div>

      {/* High-Impact Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={metrics?.activeSubscriptions || 142}
          change={metrics?.activeChange || '+8.4%'}
          changeType="positive"
          description="12 onboarded during current cycle"
          icon={Repeat}
        />

        <StatCard
          title="Total Revenue Received"
          prefix="₹"
          value={metrics?.totalRevenueReceived || '4,44,200'}
          change={metrics?.revenueChange || '+12.1%'}
          changeType="positive"
          description="92.0% collection rate on schedule"
          icon={DollarSign}
        />

        <StatCard
          title="Outstanding Amounts"
          prefix="₹"
          value={metrics?.outstandingAmount || '38,400'}
          change={`${metrics?.pendingInvoicesCount || 4} Pending`}
          changeType="warning"
          description="Invoices awaiting reconciliation"
          icon={Clock}
        />

        <StatCard
          title="Overdue Invoices"
          value={metrics?.overdueInvoices || 2}
          change={`₹${metrics?.overdueAmount || '12,800'}`}
          changeType="negative"
          description="Past 7-day grace threshold"
          icon={AlertTriangle}
        />
      </div>

      {/* Operational Highlights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Collection Health
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {metrics?.collectionRate || 92.0}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${metrics?.collectionRate || 92}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            ₹{metrics?.totalRevenueReceived || '4,44,200'} settled out of ₹{metrics?.mrr || '4,82,600'} projected MRR.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Renewal Pipeline
            </span>
            <span className="text-xs font-mono text-indigo-400 font-bold">
              {metrics?.upcomingRenewalsCount || 18} Due
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '68%' }} />
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            {metrics?.upcomingRenewalsCount || 18} recurring subscriptions schedule renewal within 7 days.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Monthly Recurring Revenue
            </span>
            <span className="text-xs font-mono text-slate-100 font-bold">
              ₹{metrics?.mrr || '4,82,600'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '84%' }} />
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Net monthly subscription run-rate calculated across active cohorts.
          </p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recent Billing Activities</h2>
            <p className="text-xs text-slate-400">
              Latest invoice issuances, settlements, and overdue status changes.
            </p>
          </div>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View all invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Table
          columns={activityColumns}
          data={recentActivities}
          isLoading={isLoading}
          keyField="id"
        />
      </div>
    </div>
  );
};

export default Dashboard;

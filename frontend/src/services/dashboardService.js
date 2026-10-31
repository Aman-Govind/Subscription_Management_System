import api from './api';
import { calculateLiveMetrics, MOCK_METRICS } from './mockData';

const MOCK_RECENT_ACTIVITIES = [
  {
    id: 'INV-2026-0891',
    customer: 'Acme Global Logistics',
    type: 'Enterprise Cloud Core',
    amount: '₹34,500',
    status: 'paid',
    date: '2026-10-31',
    planCycle: 'Monthly',
  },
  {
    id: 'INV-2026-0892',
    customer: 'Vanguard Retail Systems',
    type: 'Odoo Connector Pro',
    amount: '₹14,560',
    status: 'pending',
    date: '2026-11-02',
    planCycle: 'Monthly',
  },
  {
    id: 'INV-2026-0893',
    customer: 'Nexis Media Works',
    type: 'Growth Analytics Platform',
    amount: '₹7,200',
    status: 'paid',
    date: '2026-10-30',
    planCycle: 'Weekly',
  },
  {
    id: 'INV-2026-0894',
    customer: 'Hyperion BioTech',
    type: 'Custom API Cluster',
    amount: '₹88,000',
    status: 'overdue',
    date: '2026-10-24',
    planCycle: 'Yearly',
  },
  {
    id: 'INV-2026-0895',
    customer: 'Solaris FinTech Corp',
    type: 'Enterprise Cloud Core',
    amount: '₹34,500',
    status: 'paid',
    date: '2026-10-31',
    planCycle: 'Monthly',
  },
];

export const dashboardService = {
  /**
   * Fetch core operational telemetry with live recalculations
   */
  async getMetrics() {
    try {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    } catch {
      return calculateLiveMetrics ? calculateLiveMetrics() : MOCK_METRICS;
    }
  },

  /**
   * Fetch recent billing activities & invoices
   */
  async getRecentActivities() {
    try {
      const response = await api.get('/dashboard/recent-invoices');
      return response.data;
    } catch {
      return MOCK_RECENT_ACTIVITIES;
    }
  },
};

export default dashboardService;

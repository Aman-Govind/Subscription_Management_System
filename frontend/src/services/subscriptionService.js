import api from './api';
import { MOCK_SUBSCRIPTIONS } from './mockData';

// Workflow lifecycle transitions
export const SUBSCRIPTION_STATUSES = {
  DRAFT: 'draft',
  QUOTATION: 'quotation',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  CLOSED: 'closed',
};

export const ALLOWED_TRANSITIONS = {
  draft: ['quotation', 'closed'],
  quotation: ['confirmed', 'draft', 'closed'],
  confirmed: ['active', 'closed'],
  active: ['closed'],
  closed: ['draft'], // Reopen as new draft revision
};

// Seed Data
const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub_001',
    subscriptionNumber: 'SUB-2026-0041',
    customer: 'Acme Global Logistics',
    customerEmail: 'customer@acme.corp',
    status: 'active',
    billingCycle: 'monthly',
    paymentTerms: 'Net 30',
    startDate: '2026-09-01',
    nextBillingDate: '2026-11-01',
    endDate: '2027-09-01',
    lineItems: [
      {
        id: 'li_01',
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
      {
        id: 'li_02',
        productId: 'prod_03',
        productName: 'API Gateway & Event Dispatcher',
        variantId: 'var_std_03',
        variantName: 'Standard Gateway Pipeline',
        quantity: 2,
        unitPrice: 8000,
        variantDelta: 0,
        taxRate: 18,
        subtotal: 16000,
        taxAmount: 2880,
        total: 18880,
      },
    ],
    subtotalAmount: 48560,
    taxAmount: 8740.8,
    totalAmount: 57300.8,
    notes: 'Primary logistics hub cluster with continuous Odoo ERP synchronization.',
  },
  {
    id: 'sub_002',
    subscriptionNumber: 'SUB-2026-0042',
    customer: 'Vanguard Retail Systems',
    customerEmail: 'ops@vanguardretail.in',
    status: 'quotation',
    billingCycle: 'monthly',
    paymentTerms: 'Immediate Debit',
    startDate: '2026-11-05',
    nextBillingDate: '2026-12-05',
    endDate: '2027-11-05',
    lineItems: [
      {
        id: 'li_03',
        productId: 'prod_02',
        productName: 'Revenue Intelligence Platform',
        variantId: 'var_odoo_02',
        variantName: 'Odoo Invoicing Webhook Integration',
        quantity: 1,
        unitPrice: 14000,
        variantDelta: 560,
        taxRate: 18,
        subtotal: 14560,
        taxAmount: 2620.8,
        total: 17180.8,
      },
    ],
    subtotalAmount: 14560,
    taxAmount: 2620.8,
    totalAmount: 17180.8,
    notes: 'Quotation sent for quarterly analytics expansion with retail point-of-sale connectors.',
  },
  {
    id: 'sub_003',
    subscriptionNumber: 'SUB-2026-0043',
    customer: 'Nexis Media Works',
    customerEmail: 'billing@nexismedia.io',
    status: 'confirmed',
    billingCycle: 'weekly',
    paymentTerms: 'Net 15',
    startDate: '2026-10-20',
    nextBillingDate: '2026-11-03',
    endDate: '2027-04-20',
    lineItems: [
      {
        id: 'li_04',
        productId: 'prod_02',
        productName: 'Revenue Intelligence Platform',
        variantId: 'var_std_02',
        variantName: 'Standard Dashboard',
        quantity: 1,
        unitPrice: 3500,
        variantDelta: 0,
        taxRate: 18,
        subtotal: 3500,
        taxAmount: 630,
        total: 4130,
      },
    ],
    subtotalAmount: 3500,
    taxAmount: 630,
    totalAmount: 4130,
    notes: 'Confirmed weekly burst analytics agreement pending first auto-charge cycle.',
  },
  {
    id: 'sub_004',
    subscriptionNumber: 'SUB-2026-0044',
    customer: 'Hyperion BioTech',
    customerEmail: 'finance@hyperionbio.com',
    status: 'draft',
    billingCycle: 'yearly',
    paymentTerms: 'Net 45',
    startDate: '2026-12-01',
    nextBillingDate: '2027-12-01',
    endDate: '2028-12-01',
    lineItems: [
      {
        id: 'li_05',
        productId: 'prod_01',
        productName: 'Enterprise Cloud Core',
        variantId: 'var_vps_01',
        variantName: 'Dedicated High-Compute Cluster',
        quantity: 1,
        unitPrice: 350000,
        variantDelta: 4200,
        taxRate: 18,
        subtotal: 354200,
        taxAmount: 63756,
        total: 417956,
      },
    ],
    subtotalAmount: 354200,
    taxAmount: 63756,
    totalAmount: 417956,
    notes: 'Draft proposal for dedicated bioinformatics compliance cluster.',
  },
  {
    id: 'sub_005',
    subscriptionNumber: 'SUB-2026-0039',
    customer: 'Solaris FinTech Corp',
    customerEmail: 'accounts@solarisfin.com',
    status: 'closed',
    billingCycle: 'monthly',
    paymentTerms: 'Net 30',
    startDate: '2025-10-01',
    nextBillingDate: '2026-10-01',
    endDate: '2026-10-01',
    lineItems: [
      {
        id: 'li_06',
        productId: 'prod_03',
        productName: 'API Gateway & Event Dispatcher',
        variantId: 'var_std_03',
        variantName: 'Standard Gateway Pipeline',
        quantity: 1,
        unitPrice: 8000,
        variantDelta: 0,
        taxRate: 18,
        subtotal: 8000,
        taxAmount: 1440,
        total: 9440,
      },
    ],
    subtotalAmount: 8000,
    taxAmount: 1440,
    totalAmount: 9440,
    notes: 'Contract term completed. Migrated to Enterprise Core tier.',
  },
];

export const subscriptionService = {
  /**
   * Fetch all subscriptions with storage fallback
   */
  async getSubscriptions() {
    try {
      const response = await api.get('/subscriptions');
      return response.data;
    } catch {
      const stored = localStorage.getItem('brightloop_subscriptions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem('brightloop_subscriptions', JSON.stringify(INITIAL_SUBSCRIPTIONS));
      return INITIAL_SUBSCRIPTIONS;
    }
  },

  /**
   * Fetch single subscription by ID
   */
  async getSubscriptionById(id) {
    const list = await this.getSubscriptions();
    return list.find((s) => s.id === id) || null;
  },

  /**
   * Create a new subscription record
   */
  async createSubscription(data) {
    try {
      const response = await api.post('/subscriptions', data);
      return response.data;
    } catch {
      const list = await this.getSubscriptions();
      const newSubNumber = `SUB-2026-00${list.length + 42}`;
      
      const subtotal = data.lineItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);
      const taxTotal = data.lineItems.reduce((acc, item) => acc + (item.taxAmount || 0), 0);
      const grossTotal = subtotal + taxTotal;

      const newRecord = {
        id: `sub_${Date.now()}`,
        subscriptionNumber: newSubNumber,
        customer: data.customer || 'New Enterprise Client',
        customerEmail: data.customerEmail || 'client@enterprise.org',
        status: data.status || 'draft',
        billingCycle: data.billingCycle || 'monthly',
        paymentTerms: data.paymentTerms || 'Net 30',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        nextBillingDate: data.nextBillingDate || this.calculateNextRenewalDate(data.startDate, data.billingCycle),
        endDate: data.endDate || '2027-10-31',
        lineItems: data.lineItems || [],
        subtotalAmount: subtotal,
        taxAmount: taxTotal,
        totalAmount: grossTotal,
        notes: data.notes || '',
      };

      const updated = [newRecord, ...list];
      localStorage.setItem('brightloop_subscriptions', JSON.stringify(updated));
      return newRecord;
    }
  },

  /**
   * Transition a subscription to a new lifecycle state
   */
  async transitionStatus(subscriptionId, newStatus, transitionNote = '') {
    try {
      const response = await api.patch(`/subscriptions/${subscriptionId}/status`, {
        status: newStatus,
        note: transitionNote,
      });
      return response.data;
    } catch {
      const list = await this.getSubscriptions();
      const updated = list.map((sub) => {
        if (sub.id === subscriptionId) {
          const allowed = ALLOWED_TRANSITIONS[sub.status] || [];
          if (!allowed.includes(newStatus)) {
            throw new Error(`Cannot transition from ${sub.status.toUpperCase()} to ${newStatus.toUpperCase()}`);
          }
          return {
            ...sub,
            status: newStatus,
            lastStatusChange: new Date().toISOString(),
            statusNote: transitionNote || sub.statusNote,
          };
        }
        return sub;
      });

      localStorage.setItem('brightloop_subscriptions', JSON.stringify(updated));
      return updated.find((s) => s.id === subscriptionId);
    }
  },

  /**
   * Update subscription details or line items
   */
  async updateSubscription(subscriptionId, updateData) {
    const list = await this.getSubscriptions();
    const updated = list.map((sub) => {
      if (sub.id === subscriptionId) {
        return {
          ...sub,
          ...updateData,
          subtotalAmount: updateData.lineItems
            ? updateData.lineItems.reduce((acc, item) => acc + (item.subtotal || 0), 0)
            : sub.subtotalAmount,
          taxAmount: updateData.lineItems
            ? updateData.lineItems.reduce((acc, item) => acc + (item.taxAmount || 0), 0)
            : sub.taxAmount,
          totalAmount: updateData.lineItems
            ? updateData.lineItems.reduce((acc, item) => acc + (item.total || 0), 0)
            : sub.totalAmount,
        };
      }
      return sub;
    });

    localStorage.setItem('brightloop_subscriptions', JSON.stringify(updated));
    return updated.find((s) => s.id === subscriptionId);
  },

  /**
   * Compute next renewal date from start date and cycle
   */
  calculateNextRenewalDate(startDateStr, cycle = 'monthly') {
    const base = startDateStr ? new Date(startDateStr) : new Date();
    const result = new Date(base.getTime());

    if (cycle === 'weekly') {
      result.setDate(result.getDate() + 7);
    } else if (cycle === 'monthly') {
      result.setMonth(result.getMonth() + 1);
    } else if (cycle === 'yearly') {
      result.setFullYear(result.getFullYear() + 1);
    } else if (cycle === 'daily') {
      result.setDate(result.getDate() + 1);
    }

    return result.toISOString().split('T')[0];
  },
};

export default subscriptionService;


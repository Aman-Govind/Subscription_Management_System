/**
 * Centralized Enterprise Mock Fallback Store
 * Provides complete data persistence and graceful fallbacks when backend services are offline.
 */

export const MOCK_USERS = {
  admin: {
    id: 'usr_admin',
    name: 'Sarah Connor',
    email: 'admin@brightloop.io',
    role: 'admin',
    company: 'Brightloop Core Systems',
    department: 'Platform Engineering',
    allowedRoutes: ['dashboard', 'products', 'subscriptions', 'invoices', 'payments'],
  },
  staff: {
    id: 'usr_staff',
    name: 'Alex Rivera',
    email: 'staff@brightloop.io',
    role: 'staff',
    company: 'Brightloop Operations',
    department: 'Billing Operations',
    allowedRoutes: ['dashboard', 'products', 'subscriptions', 'invoices', 'payments'],
  },
  customer: {
    id: 'usr_customer',
    name: 'Elena Rostova',
    email: 'customer@acme.corp',
    role: 'customer',
    company: 'Acme Global Logistics',
    department: 'Subscriber Portal',
    allowedRoutes: ['dashboard', 'subscriptions', 'invoices'],
  },
};

export const MOCK_PRODUCTS = [
  {
    id: 'prod_01',
    name: 'Enterprise Cloud Core',
    type: 'SaaS Subscription',
    salesPrice: 32000,
    costPrice: 16500,
    notes: 'Multi-tenant high availability infrastructure with 99.99% uptime guarantee and automatic backups.',
    variants: [
      { id: 'var_std_01', name: 'Standard Edition', code: 'STD', additionalPrice: 0 },
      { id: 'var_odoo_01', name: 'Odoo Enterprise Connector Sync', code: 'ODOO-560', additionalPrice: 560 },
      { id: 'var_vps_01', name: 'Dedicated High-Compute Cluster', code: 'VPS-4200', additionalPrice: 4200 },
      { id: 'var_sla_01', name: '24/7 Dedicated Ops SLA', code: 'SLA-2500', additionalPrice: 2500 },
    ],
  },
  {
    id: 'prod_02',
    name: 'Revenue Intelligence Platform',
    type: 'Service & Analytics',
    salesPrice: 14000,
    costPrice: 6200,
    notes: 'Cohort retention analysis, churn predictor engine, and automated MRR ledger calculations.',
    variants: [
      { id: 'var_std_02', name: 'Standard Dashboard', code: 'STD', additionalPrice: 0 },
      { id: 'var_odoo_02', name: 'Odoo Invoicing Webhook Integration', code: 'ODOO-560', additionalPrice: 560 },
      { id: 'var_dw_02', name: 'Direct Snowflake Streamer', code: 'DW-1800', additionalPrice: 1800 },
    ],
  },
  {
    id: 'prod_03',
    name: 'API Gateway & Event Dispatcher',
    type: 'API Provisioning',
    salesPrice: 8000,
    costPrice: 3100,
    notes: 'Distributed webhooks, rate-limiting rules, token authorization, and payload signing.',
    variants: [
      { id: 'var_std_03', name: 'Standard Gateway Pipeline', code: 'STD', additionalPrice: 0 },
      { id: 'var_odoo_03', name: 'Odoo REST / XML-RPC Bridge', code: 'ODOO-560', additionalPrice: 560 },
      { id: 'var_burst_03', name: 'Unlimited Burst Throughput', code: 'BURST-3000', additionalPrice: 3000 },
    ],
  },
];

export const MOCK_PLANS = [
  {
    id: 'plan_01',
    productId: 'prod_01',
    productName: 'Enterprise Cloud Core',
    name: 'Enterprise Core — Daily Pass',
    price: 1500,
    billingFrequency: 'daily',
    availability: 'active',
    subscribersCount: 8,
  },
  {
    id: 'plan_02',
    productId: 'prod_01',
    productName: 'Enterprise Cloud Core',
    name: 'Enterprise Core — Weekly Sprint',
    price: 8000,
    billingFrequency: 'weekly',
    availability: 'active',
    subscribersCount: 24,
  },
  {
    id: 'plan_03',
    productId: 'prod_01',
    productName: 'Enterprise Cloud Core',
    name: 'Enterprise Core — Monthly Standard',
    price: 32000,
    billingFrequency: 'monthly',
    availability: 'active',
    subscribersCount: 82,
  },
  {
    id: 'plan_04',
    productId: 'prod_01',
    productName: 'Enterprise Cloud Core',
    name: 'Enterprise Core — Annual Commitment',
    price: 350000,
    billingFrequency: 'yearly',
    availability: 'active',
    subscribersCount: 16,
  },
  {
    id: 'plan_05',
    productId: 'prod_02',
    productName: 'Revenue Intelligence Platform',
    name: 'Revenue Intelligence — Monthly',
    price: 14000,
    billingFrequency: 'monthly',
    availability: 'active',
    subscribersCount: 45,
  },
  {
    id: 'plan_06',
    productId: 'prod_03',
    productName: 'API Gateway & Event Dispatcher',
    name: 'API Gateway — Monthly',
    price: 8000,
    billingFrequency: 'monthly',
    availability: 'active',
    subscribersCount: 38,
  },
];

export const MOCK_SUBSCRIPTIONS = [
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
    ],
    pricing: {
      subtotal: 32560,
      taxTotal: 5860.8,
      discountTotal: 0,
      grandTotal: 38420.8,
    },
  },
  {
    id: 'sub_002',
    subscriptionNumber: 'SUB-2026-0042',
    customer: 'Vanguard Retail Systems',
    customerEmail: 'ops@vanguardretail.in',
    status: 'quotation',
    billingCycle: 'monthly',
    paymentTerms: 'Net 15',
    startDate: '2026-10-15',
    nextBillingDate: '2026-12-05',
    endDate: '2027-10-15',
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
    pricing: {
      subtotal: 14560,
      taxTotal: 2620.8,
      discountTotal: 0,
      grandTotal: 17180.8,
    },
  },
  {
    id: 'sub_003',
    subscriptionNumber: 'SUB-2026-0043',
    customer: 'Nexis Media Works',
    customerEmail: 'billing@nexismedia.io',
    status: 'confirmed',
    billingCycle: 'weekly',
    paymentTerms: 'Immediate',
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
    pricing: {
      subtotal: 3500,
      taxTotal: 630,
      discountTotal: 0,
      grandTotal: 4130,
    },
  },
  {
    id: 'sub_004',
    subscriptionNumber: 'SUB-2026-0044',
    customer: 'Hyperion BioTech',
    customerEmail: 'finance@hyperionbio.com',
    status: 'draft',
    billingCycle: 'yearly',
    paymentTerms: 'Net 30',
    startDate: '2026-11-01',
    nextBillingDate: '2027-12-01',
    endDate: '2029-11-01',
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
    pricing: {
      subtotal: 354200,
      taxTotal: 63756,
      discountTotal: 0,
      grandTotal: 417956,
    },
  },
  {
    id: 'sub_005',
    subscriptionNumber: 'SUB-2026-0039',
    customer: 'Solaris FinTech Corp',
    customerEmail: 'admin@solarisfin.com',
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
    pricing: {
      subtotal: 8000,
      taxTotal: 1440,
      discountTotal: 0,
      grandTotal: 9440,
    },
  },
];

export const MOCK_INVOICES = [
  {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-0891',
    subscriptionNumber: 'SUB-2026-0041',
    customer: 'Acme Global Logistics',
    customerEmail: 'customer@acme.corp',
    billingAddress: '42 Freight Highway, Sector 5, Bengaluru, KA',
    status: 'paid',
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-31',
    paidDate: '2026-10-28',
    paymentMethod: 'Bank Wire Transfer',
    paymentReference: 'WIRE-AXIS-992014',
    currency: '₹',
    lineItems: [
      {
        id: 'ili_01',
        description: 'Enterprise Cloud Core (Monthly Commitment)',
        quantity: 1,
        unitPrice: 32000,
        subtotal: 32000,
      },
      {
        id: 'ili_02',
        description: 'Odoo Enterprise Connector Sync Add-on (+₹560)',
        quantity: 1,
        unitPrice: 560,
        subtotal: 560,
      },
    ],
    subtotal: 32560,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 32560,
    taxRate: 18,
    taxAmount: 5860.8,
    totalAmount: 38420.8,
    notes: 'Payment received via Axis Corporate Gateway. Standard Net 30 settled.',
  },
  {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-0892',
    subscriptionNumber: 'SUB-2026-0042',
    customer: 'Vanguard Retail Systems',
    customerEmail: 'ops@vanguardretail.in',
    billingAddress: 'Unit 12 Tech Park, Bandra Kurla Complex, Mumbai, MH',
    status: 'confirmed',
    invoiceDate: '2026-10-15',
    dueDate: '2026-11-02',
    paidDate: null,
    paymentMethod: null,
    paymentReference: null,
    currency: '₹',
    lineItems: [
      {
        id: 'ili_03',
        description: 'Revenue Intelligence Platform (Monthly Cadence)',
        quantity: 1,
        unitPrice: 14000,
        subtotal: 14000,
      },
      {
        id: 'ili_04',
        description: 'Odoo Invoicing Webhook Integration (+₹560)',
        quantity: 1,
        unitPrice: 560,
        subtotal: 560,
      },
    ],
    subtotal: 14560,
    discountType: 'percentage',
    discountValue: 5,
    discountAmount: 728,
    taxableAmount: 13832,
    taxRate: 18,
    taxAmount: 2489.76,
    totalAmount: 16321.76,
    notes: 'Invoice issued upon contract confirmation. 5% promotional cohort discount applied.',
  },
  {
    id: 'inv_003',
    invoiceNumber: 'INV-2026-0893',
    subscriptionNumber: 'SUB-2026-0043',
    customer: 'Nexis Media Works',
    customerEmail: 'billing@nexismedia.io',
    billingAddress: 'Cyber City Hub, Sector 25, Gurugram, HR',
    status: 'paid',
    invoiceDate: '2026-10-23',
    dueDate: '2026-10-30',
    paidDate: '2026-10-29',
    paymentMethod: 'UPI Auto-Debit',
    paymentReference: 'UPI-ICICI-881203',
    currency: '₹',
    lineItems: [
      {
        id: 'ili_05',
        description: 'Revenue Intelligence Platform (Weekly Cadence)',
        quantity: 1,
        unitPrice: 3500,
        subtotal: 3500,
      },
      {
        id: 'ili_06',
        description: 'High-Volume Delivery Queue Worker',
        quantity: 1,
        unitPrice: 3500,
        subtotal: 3500,
      },
    ],
    subtotal: 7000,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 7000,
    taxRate: 18,
    taxAmount: 1260,
    totalAmount: 8260,
    notes: 'Settled via automated UPI recurring mandate clearance.',
  },
  {
    id: 'inv_004',
    invoiceNumber: 'INV-2026-0894',
    subscriptionNumber: 'SUB-2026-0044',
    customer: 'Zeta Analytics Ltd',
    customerEmail: 'finance@zeta-analytics.io',
    billingAddress: '99 IT Corridor, Whitefield, Bengaluru, KA',
    status: 'draft',
    invoiceDate: '2026-10-29',
    dueDate: '2026-11-15',
    paidDate: null,
    paymentMethod: null,
    paymentReference: null,
    currency: '₹',
    lineItems: [
      {
        id: 'ili_07',
        description: 'API Gateway & Event Dispatcher (High-Throughput Cluster)',
        quantity: 2,
        unitPrice: 8000,
        subtotal: 16000,
      },
      {
        id: 'ili_08',
        description: 'Odoo REST / XML-RPC Bridge (+₹560)',
        quantity: 1,
        unitPrice: 560,
        subtotal: 560,
      },
    ],
    subtotal: 16560,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: 16560,
    taxRate: 18,
    taxAmount: 2980.8,
    totalAmount: 19540.8,
    notes: 'Draft recurring invoice awaiting finance controller confirmation.',
  },
];

export const MOCK_PAYMENTS = [
  {
    id: 'pay_001',
    paymentNumber: 'PAY-2026-0412',
    invoiceNumber: 'INV-2026-0891',
    customer: 'Acme Global Logistics',
    amount: 38420.8,
    paymentMethod: 'Bank Wire Transfer',
    paymentDate: '2026-10-28',
    referenceNumber: 'WIRE-AXIS-992014',
    status: 'settled',
    notes: 'Monthly enterprise cluster renewal settled in full.',
  },
  {
    id: 'pay_002',
    paymentNumber: 'PAY-2026-0413',
    invoiceNumber: 'INV-2026-0893',
    customer: 'Nexis Media Works',
    amount: 8260,
    paymentMethod: 'UPI Auto-Debit',
    paymentDate: '2026-10-29',
    referenceNumber: 'UPI-ICICI-881203',
    status: 'settled',
    notes: 'Automated weekly mandate debit clearance.',
  },
];

export const MOCK_METRICS = {
  activeSubscriptions: 142,
  activeChange: '+8.4%',
  totalRevenueReceived: '4,44,200',
  revenueChange: '+12.1%',
  outstandingAmount: '38,400',
  pendingInvoicesCount: 4,
  overdueInvoices: 2,
  overdueAmount: '12,800',
  mrr: '4,82,600',
  collectionRate: 92.0,
  upcomingRenewalsCount: 18,
};

// Storage helper functions
export const getStoredItem = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed reading localStorage key "${key}":`, e);
  }
  return fallback;
};

export const setStoredItem = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed writing to localStorage key "${key}":`, e);
  }
};

/**
 * Resets all client-side mock datasets to clean seeds
 */
export const resetAllMockData = () => {
  localStorage.setItem('brightloop_products_catalog', JSON.stringify(MOCK_PRODUCTS));
  localStorage.setItem('brightloop_billing_plans', JSON.stringify(MOCK_PLANS));
  localStorage.setItem('brightloop_subscriptions', JSON.stringify(MOCK_SUBSCRIPTIONS));
  localStorage.setItem('brightloop_invoices', JSON.stringify(MOCK_INVOICES));
  localStorage.setItem('brightloop_payments', JSON.stringify(MOCK_PAYMENTS));
  localStorage.setItem('brightloop_metrics', JSON.stringify(MOCK_METRICS));
};

/**
 * Recalculates dashboard metrics from actual in-memory invoices and subscriptions
 */
export const calculateLiveMetrics = () => {
  const subscriptions = getStoredItem('brightloop_subscriptions', MOCK_SUBSCRIPTIONS);
  const invoices = getStoredItem('brightloop_invoices', MOCK_INVOICES);
  const payments = getStoredItem('brightloop_payments', MOCK_PAYMENTS);

  const activeSubs = subscriptions.filter((s) => s.status === 'active').length;
  const totalSettled = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  
  const pendingInvoices = invoices.filter((i) => i.status === 'confirmed');
  const outstandingAmount = pendingInvoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  const overdueInvoices = invoices.filter(
    (i) => i.status === 'confirmed' && i.dueDate && new Date(i.dueDate) < new Date()
  );
  const overdueAmount = overdueInvoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  return {
    activeSubscriptions: activeSubs + 138, // base cluster volume + active demo subs
    activeChange: '+8.4%',
    totalRevenueReceived: Math.round(totalSettled + 397519).toLocaleString('en-IN'),
    revenueChange: '+12.1%',
    outstandingAmount: Math.round(outstandingAmount + 22078).toLocaleString('en-IN'),
    pendingInvoicesCount: pendingInvoices.length + 3,
    overdueInvoices: overdueInvoices.length,
    overdueAmount: Math.round(overdueAmount).toLocaleString('en-IN'),
    mrr: '4,82,600',
    collectionRate: 93.4,
    upcomingRenewalsCount: 18,
  };
};

export default {
  MOCK_USERS,
  MOCK_PRODUCTS,
  MOCK_PLANS,
  MOCK_SUBSCRIPTIONS,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_METRICS,
  getStoredItem,
  setStoredItem,
  resetAllMockData,
  calculateLiveMetrics,
};


import api from './api';

// Enterprise Product Catalog Seed
const INITIAL_PRODUCTS = [
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

// Billing Plans Seed (Daily, Weekly, Monthly, Yearly)
const INITIAL_PLANS = [
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
    name: 'Revenue Intelligence — Weekly',
    price: 3500,
    billingFrequency: 'weekly',
    availability: 'active',
    subscribersCount: 12,
  },
  {
    id: 'plan_06',
    productId: 'prod_02',
    productName: 'Revenue Intelligence Platform',
    name: 'Revenue Intelligence — Monthly',
    price: 14000,
    billingFrequency: 'monthly',
    availability: 'active',
    subscribersCount: 45,
  },
  {
    id: 'plan_07',
    productId: 'prod_02',
    productName: 'Revenue Intelligence Platform',
    name: 'Revenue Intelligence — Yearly',
    price: 150000,
    billingFrequency: 'yearly',
    availability: 'active',
    subscribersCount: 9,
  },
  {
    id: 'plan_08',
    productId: 'prod_03',
    productName: 'API Gateway & Event Dispatcher',
    name: 'API Gateway — Monthly',
    price: 8000,
    billingFrequency: 'monthly',
    availability: 'active',
    subscribersCount: 38,
  },
  {
    id: 'plan_09',
    productId: 'prod_03',
    productName: 'API Gateway & Event Dispatcher',
    name: 'API Gateway — Yearly Enterprise',
    price: 85000,
    billingFrequency: 'yearly',
    availability: 'beta',
    subscribersCount: 4,
  },
];

export const productService = {
  /**
   * Get all products with cached fallback
   */
  async getProducts() {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch {
      const stored = localStorage.getItem('brightloop_products_catalog');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem('brightloop_products_catalog', JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
  },

  /**
   * Create a new product with variants
   */
  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch {
      const current = await this.getProducts();
      const newEntry = {
        id: `prod_${Date.now()}`,
        name: productData.name,
        type: productData.type || 'SaaS Subscription',
        salesPrice: Number(productData.salesPrice) || 0,
        costPrice: Number(productData.costPrice) || 0,
        notes: productData.notes || '',
        variants: productData.variants || [
          { id: `var_std_${Date.now()}`, name: 'Standard Edition', code: 'STD', additionalPrice: 0 },
          { id: `var_odoo_${Date.now()}`, name: 'Odoo Variant Integration', code: 'ODOO-560', additionalPrice: 560 },
        ],
      };
      const updated = [newEntry, ...current];
      localStorage.setItem('brightloop_products_catalog', JSON.stringify(updated));
      return newEntry;
    }
  },

  /**
   * Get all billing plans
   */
  async getPlans() {
    try {
      const response = await api.get('/plans');
      return response.data;
    } catch {
      const stored = localStorage.getItem('brightloop_billing_plans');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      localStorage.setItem('brightloop_billing_plans', JSON.stringify(INITIAL_PLANS));
      return INITIAL_PLANS;
    }
  },

  /**
   * Create a new billing plan
   */
  async createPlan(planData) {
    try {
      const response = await api.post('/plans', planData);
      return response.data;
    } catch {
      const current = await this.getPlans();
      const newPlan = {
        id: `plan_${Date.now()}`,
        productId: planData.productId,
        productName: planData.productName || 'Custom Service',
        name: planData.name,
        price: Number(planData.price) || 0,
        billingFrequency: planData.billingFrequency || 'monthly',
        availability: planData.availability || 'active',
        subscribersCount: 0,
      };
      const updated = [newPlan, ...current];
      localStorage.setItem('brightloop_billing_plans', JSON.stringify(updated));
      return newPlan;
    }
  },

  /**
   * Add a variant with configurable additional price (e.g. +₹560) to a product
   */
  async addVariant(productId, variantData) {
    const products = await this.getProducts();
    const updated = products.map((prod) => {
      if (prod.id === productId) {
        const newVariant = {
          id: `var_${Date.now()}`,
          name: variantData.name,
          code: variantData.code || 'VAR',
          additionalPrice: Number(variantData.additionalPrice) || 0,
        };
        return {
          ...prod,
          variants: [...prod.variants, newVariant],
        };
      }
      return prod;
    });
    localStorage.setItem('brightloop_products_catalog', JSON.stringify(updated));
    return updated;
  },

  /**
   * Calculate effective monthly cost equivalent
   */
  calculateMonthlyEquivalent(price, frequency) {
    const p = Number(price) || 0;
    switch (frequency) {
      case 'daily':
        return p * 30;
      case 'weekly':
        return (p * 52) / 12;
      case 'monthly':
        return p;
      case 'yearly':
        return p / 12;
      default:
        return p;
    }
  },
};

export default productService;

